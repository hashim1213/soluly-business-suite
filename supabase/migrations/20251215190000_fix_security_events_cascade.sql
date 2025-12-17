-- =============================================
-- Fix security_events foreign key to cascade on delete
-- =============================================

-- Drop the existing constraint
ALTER TABLE security_events
DROP CONSTRAINT IF EXISTS security_events_team_member_id_fkey;

-- Re-add with CASCADE
ALTER TABLE security_events
ADD CONSTRAINT security_events_team_member_id_fkey
FOREIGN KEY (team_member_id)
REFERENCES team_members(id)
ON DELETE CASCADE;

-- Also fix notifications if it doesn't have cascade
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_recipient_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_recipient_id_fkey
FOREIGN KEY (recipient_id)
REFERENCES team_members(id)
ON DELETE CASCADE;

-- Fix actor_id on notifications too
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

ALTER TABLE notifications
ADD CONSTRAINT notifications_actor_id_fkey
FOREIGN KEY (actor_id)
REFERENCES team_members(id)
ON DELETE SET NULL;
