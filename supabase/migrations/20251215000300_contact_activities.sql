-- Migration: Create contact activities table
-- Description: Polymorphic activity logging for contacts (calls, emails, meetings, notes, tasks)

-- Activity type enum
DO $$ BEGIN
  CREATE TYPE contact_activity_type AS ENUM ('call', 'email', 'meeting', 'note', 'task');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Call outcome enum
DO $$ BEGIN
  CREATE TYPE call_outcome_type AS ENUM ('answered', 'no_answer', 'voicemail', 'busy', 'callback_scheduled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Email direction enum
DO $$ BEGIN
  CREATE TYPE email_direction_type AS ENUM ('sent', 'received');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task status enum
DO $$ BEGIN
  CREATE TYPE activity_task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Task priority enum
DO $$ BEGIN
  CREATE TYPE activity_task_priority AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Contact activities table
CREATE TABLE IF NOT EXISTS contact_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  display_id TEXT NOT NULL,

  -- Activity type discriminator
  activity_type contact_activity_type NOT NULL,

  -- Common fields
  title TEXT,
  description TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES team_members(id) ON DELETE SET NULL,

  -- Call-specific fields
  call_duration INTEGER,
  call_outcome call_outcome_type,

  -- Email-specific fields
  email_subject TEXT,
  email_direction email_direction_type,

  -- Meeting-specific fields
  meeting_location TEXT,
  meeting_attendees JSONB,
  meeting_outcome TEXT,
  meeting_start_time TIMESTAMPTZ,
  meeting_end_time TIMESTAMPTZ,

  -- Task-specific fields
  task_due_date TIMESTAMPTZ,
  task_status activity_task_status DEFAULT 'pending',
  task_priority activity_task_priority DEFAULT 'medium',
  task_completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, display_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_activities_organization ON contact_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_contact ON contact_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_activities_type ON contact_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_contact_activities_date ON contact_activities(activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_contact_activities_created_by ON contact_activities(created_by);
CREATE INDEX IF NOT EXISTS idx_contact_activities_task_status ON contact_activities(task_status) WHERE activity_type = 'task';
CREATE INDEX IF NOT EXISTS idx_contact_activities_task_due_date ON contact_activities(task_due_date) WHERE activity_type = 'task';

-- Enable RLS
ALTER TABLE contact_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view contact_activities in their organization" ON contact_activities
  FOR SELECT USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create contact_activities in their organization" ON contact_activities
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update contact_activities in their organization" ON contact_activities
  FOR UPDATE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete contact_activities in their organization" ON contact_activities
  FOR DELETE USING (
    organization_id IN (
      SELECT tm.organization_id FROM team_members tm
      WHERE tm.auth_user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_contact_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_contact_activities_updated_at
  BEFORE UPDATE ON contact_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_activities_updated_at();

-- Function to generate display_id for activities
CREATE OR REPLACE FUNCTION generate_contact_activity_display_id()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_num INTEGER;
BEGIN
  -- Set prefix based on activity type
  CASE NEW.activity_type
    WHEN 'call' THEN prefix := 'CALL';
    WHEN 'email' THEN prefix := 'EMAIL';
    WHEN 'meeting' THEN prefix := 'MTG';
    WHEN 'note' THEN prefix := 'NOTE';
    WHEN 'task' THEN prefix := 'TASK';
    ELSE prefix := 'ACT';
  END CASE;

  -- Get next number for this organization and type
  SELECT COALESCE(MAX(
    CASE
      WHEN display_id ~ ('^' || prefix || '-[0-9]+$')
      THEN CAST(SUBSTRING(display_id FROM position('-' IN display_id) + 1) AS INTEGER)
      ELSE 0
    END
  ), 0) + 1
  INTO next_num
  FROM contact_activities
  WHERE organization_id = NEW.organization_id
    AND display_id LIKE prefix || '-%';

  NEW.display_id := prefix || '-' || LPAD(next_num::TEXT, 4, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_generate_activity_display_id
  BEFORE INSERT ON contact_activities
  FOR EACH ROW
  WHEN (NEW.display_id IS NULL OR NEW.display_id = '')
  EXECUTE FUNCTION generate_contact_activity_display_id();
