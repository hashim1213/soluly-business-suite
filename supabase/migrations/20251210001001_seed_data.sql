-- ============================================
-- SOLULY BUSINESS SUITE - SEED DATA
-- Initial data population for all tables
-- ============================================

-- =====================
-- TEAM MEMBERS
-- =====================
INSERT INTO public.team_members (id, name, email, phone, role, department, hourly_rate, salary, contract_type, status, total_hours, avatar) VALUES
  ('11111111-1111-1111-1111-111111111111', 'You', 'you@company.com', '+1 555-0100', 'Project Lead', 'Management', 150.00, 120000.00, 'Full-time', 'active', 160, 'Y'),
  ('11111111-1111-1111-1111-111111111112', 'Sarah Chen', 'sarah@company.com', '+1 555-0101', 'Senior Developer', 'Engineering', 95.00, 95000.00, 'Full-time', 'active', 120, 'SC'),
  ('11111111-1111-1111-1111-111111111113', 'Mike Johnson', 'mike@company.com', '+1 555-0102', 'Designer', 'Design', 85.00, 0.00, 'Contractor', 'active', 80, 'MJ'),
  ('11111111-1111-1111-1111-111111111114', 'Emma Wilson', 'emma@company.com', '+1 555-0103', 'Developer', 'Engineering', 90.00, 90000.00, 'Full-time', 'active', 60, 'EW'),
  ('11111111-1111-1111-1111-111111111115', 'David Brown', 'david@company.com', '+1 555-0104', 'QA Engineer', 'Quality', 75.00, 75000.00, 'Full-time', 'active', 40, 'DB'),
  ('11111111-1111-1111-1111-111111111116', 'Lisa Park', 'lisa@company.com', '+1 555-0105', 'Business Analyst', 'Operations', 80.00, 80000.00, 'Full-time', 'active', 30, 'LP'),
  ('11111111-1111-1111-1111-111111111117', 'James Lee', 'james@company.com', '+1 555-0106', 'DevOps Engineer', 'Engineering', 100.00, 100000.00, 'Full-time', 'active', 0, 'JL'),
  ('11111111-1111-1111-1111-111111111118', 'Anna Martinez', 'anna@company.com', '+1 555-0107', 'UI Designer', 'Design', 80.00, 0.00, 'Contractor', 'inactive', 45, 'AM');

-- =====================
-- PROJECTS
-- =====================
INSERT INTO public.projects (id, display_id, name, description, status, progress, value, client_name, client_email, start_date) VALUES
  ('22222222-2222-2222-2222-222222222221', 'PRJ-001', 'Acme Corp', 'Enterprise software implementation and consulting', 'active', 75, 45000.00, 'John Smith', 'john@acmecorp.com', '2024-01-15'),
  ('22222222-2222-2222-2222-222222222222', 'PRJ-002', 'TechStart Inc', 'Digital transformation strategy and execution', 'active', 40, 28000.00, 'Sarah Johnson', 'sarah@techstart.io', '2024-02-01'),
  ('22222222-2222-2222-2222-222222222223', 'PRJ-003', 'Global Solutions', 'Process optimization and automation project', 'active', 90, 62000.00, 'Mike Chen', 'mike@globalsol.com', '2023-12-10'),
  ('22222222-2222-2222-2222-222222222224', 'PRJ-004', 'DataFlow Ltd', 'Data analytics platform development', 'pending', 15, 35000.00, 'Emma Wilson', 'emma@dataflow.io', '2024-03-01'),
  ('22222222-2222-2222-2222-222222222225', 'PRJ-005', 'CloudNine Systems', 'Cloud migration and infrastructure setup', 'completed', 100, 52000.00, 'David Brown', 'david@cloudnine.io', '2023-11-05'),
  ('22222222-2222-2222-2222-222222222226', 'PRJ-006', 'InnovateTech', 'Product development consulting', 'active', 55, 38000.00, 'Lisa Anderson', 'lisa@innovatetech.com', '2024-01-20');

-- =====================
-- PROJECT TEAM MEMBERS (Assignments)
-- =====================
INSERT INTO public.project_team_members (project_id, team_member_id, hours_logged) VALUES
  -- You is on all projects
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 40),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 30),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 25),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 10),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 35),
  ('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111111', 20),
  -- Sarah Chen
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111112', 60),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111112', 60),
  -- Mike Johnson
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111113', 40),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111113', 40),
  -- Emma Wilson
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111114', 30),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111114', 30),
  -- David Brown
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111115', 20),
  ('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111115', 20),
  -- Lisa Park
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111116', 30);

-- =====================
-- TICKETS
-- =====================
INSERT INTO public.tickets (id, display_id, title, description, category, project_id, priority, status, assignee_id) VALUES
  ('33333333-3333-3333-3333-333333333331', 'TKT-001', 'Add export functionality to reports', 'Users want to export reports in PDF and Excel formats', 'feature', '22222222-2222-2222-2222-222222222221', 'high', 'open', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333332', 'TKT-002', 'Quote request for enterprise package', 'Customer needs pricing for enterprise tier', 'quote', '22222222-2222-2222-2222-222222222222', 'medium', 'in-progress', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'TKT-003', 'Dashboard loading speed issue', 'Dashboard takes too long to load with many projects', 'feedback', '22222222-2222-2222-2222-222222222223', 'high', 'open', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333334', 'TKT-004', 'Integration with Salesforce CRM', 'Request for Salesforce integration capability', 'feature', '22222222-2222-2222-2222-222222222221', 'low', 'open', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333335', 'TKT-005', 'Annual contract renewal discussion', 'Contract coming up for renewal in Q1', 'quote', '22222222-2222-2222-2222-222222222224', 'medium', 'pending', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333336', 'TKT-006', 'Mobile app feature request', 'Request for native mobile application', 'feature', '22222222-2222-2222-2222-222222222222', 'medium', 'open', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333337', 'TKT-007', 'Positive feedback on new UI', 'Customer loves the new interface design', 'feedback', '22222222-2222-2222-2222-222222222223', 'low', 'closed', '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333338', 'TKT-008', 'Extended support package quote', 'Quote for 24/7 premium support package', 'quote', '22222222-2222-2222-2222-222222222221', 'high', 'in-progress', '11111111-1111-1111-1111-111111111111');

-- =====================
-- CRM CLIENTS
-- =====================
INSERT INTO public.crm_clients (id, display_id, name, contact_name, contact_email, contact_phone, industry, address, total_revenue, status) VALUES
  ('44444444-4444-4444-4444-444444444441', 'CLT-001', 'Acme Corporation', 'John Smith', 'john@acmecorp.com', '+1 555-0111', 'Technology', '100 Tech Drive, San Jose, CA', 145000.00, 'active'),
  ('44444444-4444-4444-4444-444444444442', 'CLT-002', 'TechStart Inc', 'Sarah Wilson', 'sarah@techstart.io', '+1 555-0112', 'Startup', '200 Innovation Ave, Palo Alto, CA', 28000.00, 'active'),
  ('44444444-4444-4444-4444-444444444443', 'CLT-003', 'Global Solutions Ltd', 'Michael Brown', 'm.brown@globalsol.com', '+1 555-0113', 'Consulting', '50 Business Park, Chicago, IL', 167000.00, 'active'),
  ('44444444-4444-4444-4444-444444444444', 'CLT-004', 'DataFlow Ltd', 'Emily Davis', 'emily@dataflow.co', '+1 555-0114', 'Data Analytics', '75 Data Center Rd, Austin, TX', 35000.00, 'inactive'),
  ('44444444-4444-4444-4444-444444444445', 'CLT-005', 'CloudNine Systems', 'Lisa Chen', 'lisa@cloudnine.io', '+1 555-0115', 'Cloud Computing', '300 Cloud Way, Seattle, WA', 52000.00, 'active'),
  ('44444444-4444-4444-4444-444444444446', 'CLT-006', 'StartupXYZ', 'Mike Johnson', 'mike@startupxyz.com', '+1 555-0116', 'Startup', '123 Startup Blvd, San Francisco, CA', 0.00, 'inactive');

-- =====================
-- CRM LEADS
-- =====================
INSERT INTO public.crm_leads (id, display_id, name, contact_name, contact_email, contact_phone, industry, source, status) VALUES
  ('55555555-5555-5555-5555-555555555551', 'LEAD-001', 'NextGen Robotics', 'Robert Chen', 'rchen@nextgenrobotics.com', '+1 555-0121', 'Robotics', 'Referral', 'warm'),
  ('55555555-5555-5555-5555-555555555552', 'LEAD-002', 'HealthTech Solutions', 'Dr. Amanda Lee', 'alee@healthtech.com', '+1 555-0122', 'Healthcare', 'Website', 'cold'),
  ('55555555-5555-5555-5555-555555555553', 'LEAD-003', 'EcoEnergy Corp', 'James Green', 'jgreen@ecoenergy.com', '+1 555-0123', 'Energy', 'Conference', 'hot');

-- =====================
-- QUOTES (Deals)
-- =====================
INSERT INTO public.quotes (id, display_id, title, description, company_name, client_id, contact_name, contact_email, value, status, stage, valid_until, notes, last_activity) VALUES
  ('66666666-6666-6666-6666-666666666661', 'QTE-001', 'Enterprise Package Quote', 'Full enterprise implementation with custom integrations and dedicated support', 'TechStart Inc', '44444444-4444-4444-4444-444444444442', 'Sarah Johnson', 'sarah@techstart.io', 45000.00, 'sent', 60, '2024-12-31', 'Client has requested a 10% discount for annual payment. Pending approval from management.', '2024-12-09'),
  ('66666666-6666-6666-6666-666666666662', 'QTE-002', 'Annual Contract Renewal', 'Renewal of annual support and maintenance contract with expanded scope', 'DataFlow Ltd', '44444444-4444-4444-4444-444444444444', 'David Miller', 'david@dataflow.io', 28000.00, 'negotiating', 75, '2025-01-15', 'Client wants to add priority support this year. Previous contract was $22,000.', '2024-12-08'),
  ('66666666-6666-6666-6666-666666666663', 'QTE-003', 'Extended Support Package', '24/7 premium support with guaranteed 1-hour response time', 'Acme Corporation', '44444444-4444-4444-4444-444444444441', 'John Smith', 'john@acmecorp.com', 18500.00, 'draft', 25, '2024-12-20', 'Draft - needs review before sending to client.', '2024-12-05'),
  ('66666666-6666-6666-6666-666666666664', 'QTE-004', 'Cloud Migration Project', 'Complete migration of on-premise infrastructure to cloud with training', 'Global Solutions Ltd', '44444444-4444-4444-4444-444444444443', 'Emma Williams', 'emma@globalsol.com', 72000.00, 'accepted', 100, '2024-11-30', 'Contract signed on Nov 25. Implementation begins Dec 1.', '2024-11-25'),
  ('66666666-6666-6666-6666-666666666665', 'QTE-005', 'Custom Integration Development', 'API development and third-party system integrations', 'CloudNine Systems', '44444444-4444-4444-4444-444444444445', 'Lisa Chen', 'lisa@cloudnine.io', 35000.00, 'sent', 50, '2025-01-05', 'Awaiting client feedback on scope of integrations.', '2024-12-02'),
  ('66666666-6666-6666-6666-666666666666', 'QTE-006', 'Mobile App Development', 'Native iOS and Android app development with backend integration', 'StartupXYZ', '44444444-4444-4444-4444-444444444446', 'Mike Johnson', 'mike@startupxyz.com', 55000.00, 'rejected', 0, '2024-10-15', 'Lost to competitor - pricing issue', '2024-11-05'),
  ('66666666-6666-6666-6666-666666666667', 'QTE-007', 'Healthcare Data Platform', 'Secure healthcare data management with HIPAA compliance', 'HealthTech Solutions', NULL, 'Dr. Amanda Lee', 'alee@healthtech.com', 85000.00, 'draft', 10, '2025-03-01', 'Initial discovery call completed. High potential deal.', '2024-12-05'),
  ('66666666-6666-6666-6666-666666666668', 'QTE-008', 'Green Energy Monitoring System', 'Real-time energy monitoring dashboard with analytics', 'EcoEnergy Corp', NULL, 'James Green', 'jgreen@ecoenergy.com', 120000.00, 'negotiating', 85, '2024-12-20', 'Legal review of contract terms. Very close to signing.', '2024-12-09');

-- =====================
-- CRM ACTIVITIES
-- =====================
INSERT INTO public.crm_activities (id, display_id, quote_id, type, description, duration, activity_date) VALUES
  ('77777777-7777-7777-7777-777777777771', 'ACT-001', '66666666-6666-6666-6666-666666666661', 'call', 'Contract discussion call with Sarah', '45 min', '2024-12-09'),
  ('77777777-7777-7777-7777-777777777772', 'ACT-002', '66666666-6666-6666-6666-666666666661', 'email', 'Sent revised pricing proposal', '', '2024-12-08'),
  ('77777777-7777-7777-7777-777777777773', 'ACT-003', '66666666-6666-6666-6666-666666666662', 'meeting', 'Product demo with stakeholders', '1 hr', '2024-12-07'),
  ('77777777-7777-7777-7777-777777777774', 'ACT-004', '66666666-6666-6666-6666-666666666663', 'call', 'Discovery call - requirements gathering', '30 min', '2024-12-08'),
  ('77777777-7777-7777-7777-777777777775', 'ACT-005', '66666666-6666-6666-6666-666666666668', 'email', 'Contract sent for legal review', '', '2024-12-09'),
  ('77777777-7777-7777-7777-777777777776', 'ACT-006', '66666666-6666-6666-6666-666666666661', 'note', 'Client requested additional features in scope', '', '2024-12-06'),
  ('77777777-7777-7777-7777-777777777777', 'ACT-007', '66666666-6666-6666-6666-666666666664', 'meeting', 'Final contract signing meeting', '30 min', '2024-11-25'),
  ('77777777-7777-7777-7777-777777777778', 'ACT-008', '66666666-6666-6666-6666-666666666667', 'call', 'Initial discovery call with Dr. Lee', '45 min', '2024-12-05');

-- =====================
-- CRM TASKS
-- =====================
INSERT INTO public.crm_tasks (id, display_id, quote_id, title, due_date, completed, priority) VALUES
  ('88888888-8888-8888-8888-888888888881', 'TSK-001', '66666666-6666-6666-6666-666666666661', 'Send final contract', '2024-12-12', false, 'high'),
  ('88888888-8888-8888-8888-888888888882', 'TSK-002', '66666666-6666-6666-6666-666666666662', 'Follow up on budget approval', '2024-12-15', false, 'medium'),
  ('88888888-8888-8888-8888-888888888883', 'TSK-003', '66666666-6666-6666-6666-666666666663', 'Prepare demo environment', '2024-12-14', false, 'high'),
  ('88888888-8888-8888-8888-888888888884', 'TSK-004', '66666666-6666-6666-6666-666666666668', 'Schedule final negotiation call', '2024-12-11', true, 'high'),
  ('88888888-8888-8888-8888-888888888885', 'TSK-005', '66666666-6666-6666-6666-666666666667', 'Send case studies', '2024-12-10', false, 'low'),
  ('88888888-8888-8888-8888-888888888886', 'TSK-006', '66666666-6666-6666-6666-666666666665', 'Prepare integration documentation', '2024-12-18', false, 'medium');

-- =====================
-- FEEDBACK
-- =====================
INSERT INTO public.feedback (id, display_id, title, description, project_id, project_name, sentiment, category, status, source, from_contact, notes) VALUES
  ('99999999-9999-9999-9999-999999999991', 'FBK-001', 'Dashboard loading speed issue', 'The main dashboard takes too long to load when there are many projects. Sometimes up to 10 seconds.', '22222222-2222-2222-2222-222222222223', 'Global Solutions', 'negative', 'performance', 'investigating', 'email', 'emma@globalsol.com', 'Engineering team is looking into database query optimization.'),
  ('99999999-9999-9999-9999-999999999992', 'FBK-002', 'Positive feedback on new UI', 'The new interface is much cleaner and easier to navigate. Great job on the redesign!', '22222222-2222-2222-2222-222222222223', 'Global Solutions', 'positive', 'ui-ux', 'acknowledged', 'email', 'mike@globalsol.com', 'Thanked customer and shared with design team.'),
  ('99999999-9999-9999-9999-999999999993', 'FBK-003', 'Search functionality improvements needed', 'Search results are not always relevant. Would be great to have filters and advanced search options.', '22222222-2222-2222-2222-222222222221', 'Acme Corp', 'neutral', 'feature', 'under-review', 'call', 'john@acmecorp.com', 'Added to feature backlog for Q1 2025.'),
  ('99999999-9999-9999-9999-999999999994', 'FBK-004', 'Mobile experience is excellent', 'Used the app on my phone during travel and it worked perfectly. Very responsive design.', '22222222-2222-2222-2222-222222222222', 'TechStart Inc', 'positive', 'mobile', 'acknowledged', 'email', 'sarah@techstart.io', ''),
  ('99999999-9999-9999-9999-999999999995', 'FBK-005', 'Report generation needs work', 'Reports sometimes show incorrect totals. Also, the export to PDF feature is missing some charts.', '22222222-2222-2222-2222-222222222224', 'DataFlow Ltd', 'negative', 'bug', 'in-progress', 'support', 'david@dataflow.io', 'Bug confirmed. Fix scheduled for next release.');

-- =====================
-- FEATURE REQUESTS
-- =====================
INSERT INTO public.feature_requests (id, display_id, title, description, priority, status, requested_by, client_name, added_to_roadmap, notes) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'FTR-001', 'Add export functionality to reports', 'Users want to export reports in PDF and Excel formats for offline analysis. This should include custom formatting options and the ability to schedule automated exports.', 'high', 'in-review', 'john@acmecorp.com', 'John Smith', false, 'Engineering reviewed - estimated 2 sprints of work.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', 'FTR-002', 'Integration with Salesforce CRM', 'Sync customer data automatically between our platform and Salesforce. Need bi-directional sync with conflict resolution.', 'low', 'backlog', 'sarah@acmecorp.com', 'Sarah Johnson', false, ''),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaccc', 'FTR-003', 'Mobile app feature request', 'Native mobile app for iOS and Android with offline capabilities. Should support push notifications and biometric authentication.', 'medium', 'planned', 'mike@techstart.io', 'Mike Chen', true, 'Added to Q1 2025 roadmap.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaddd', 'FTR-004', 'Advanced analytics dashboard', 'Custom widgets and drag-and-drop dashboard builder. Users should be able to save multiple dashboard layouts.', 'medium', 'in-progress', 'emma@globalsol.com', 'Emma Williams', true, 'Currently in development - 60% complete.'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaeee', 'FTR-005', 'Multi-language support', 'Support for Spanish, French, and German languages. Should include RTL support for future Arabic/Hebrew additions.', 'low', 'backlog', 'david@dataflow.io', 'David Brown', false, '');

-- =====================
-- FEATURE REQUEST PROJECTS (Junction)
-- =====================
INSERT INTO public.feature_request_projects (feature_request_id, project_id) VALUES
  -- FTR-001: Export functionality for Acme Corp and Global Solutions
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222221'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222223'),
  -- FTR-002: Salesforce integration for Acme Corp
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaabb', '22222222-2222-2222-2222-222222222221'),
  -- FTR-003: Mobile app for TechStart, Global Solutions, CloudNine
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaccc', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaccc', '22222222-2222-2222-2222-222222222223'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaccc', '22222222-2222-2222-2222-222222222225'),
  -- FTR-004: Analytics for Global Solutions
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaddd', '22222222-2222-2222-2222-222222222223'),
  -- FTR-005: Multi-language for DataFlow and CloudNine
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaeee', '22222222-2222-2222-2222-222222222224'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaeee', '22222222-2222-2222-2222-222222222225');
