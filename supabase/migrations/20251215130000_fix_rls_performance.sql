-- =============================================
-- Fix RLS Performance Issues
-- 1. Wrap auth.uid() calls in (SELECT ...) to prevent per-row re-evaluation
-- 2. Remove duplicate permissive policies
-- =============================================

-- =============================================
-- PART 1: Remove duplicate policies
-- =============================================

-- team_members: Remove duplicates for anon role
DROP POLICY IF EXISTS "Allow public insert team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public update team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public delete team_members" ON public.team_members;
DROP POLICY IF EXISTS "Allow public read team_members" ON public.team_members;

-- business_costs: Remove duplicates
DROP POLICY IF EXISTS "business_costs_all" ON public.business_costs;

-- client_contacts: Remove duplicates
DROP POLICY IF EXISTS "client_contacts_delete_org" ON public.client_contacts;
DROP POLICY IF EXISTS "client_contacts_insert_org" ON public.client_contacts;
DROP POLICY IF EXISTS "client_contacts_select_org" ON public.client_contacts;
DROP POLICY IF EXISTS "client_contacts_update_org" ON public.client_contacts;

-- contacts: Remove duplicates
DROP POLICY IF EXISTS "contacts_all" ON public.contacts;

-- crm_activities: Remove duplicates
DROP POLICY IF EXISTS "crm_activities_all" ON public.crm_activities;

-- crm_clients: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete crm_clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Allow public insert crm_clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Allow public read crm_clients" ON public.crm_clients;
DROP POLICY IF EXISTS "Allow public update crm_clients" ON public.crm_clients;

-- crm_leads: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Allow public insert crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Allow public read crm_leads" ON public.crm_leads;
DROP POLICY IF EXISTS "Allow public update crm_leads" ON public.crm_leads;

-- crm_tasks: Remove duplicates
DROP POLICY IF EXISTS "crm_tasks_all" ON public.crm_tasks;

-- email_accounts: Remove duplicates
DROP POLICY IF EXISTS "email_accounts_all" ON public.email_accounts;

-- emails: Remove duplicates
DROP POLICY IF EXISTS "Allow public insert" ON public.emails;
DROP POLICY IF EXISTS "Allow public read" ON public.emails;
DROP POLICY IF EXISTS "Allow public update" ON public.emails;

-- expense_templates: Remove duplicates
DROP POLICY IF EXISTS "expense_templates_all" ON public.expense_templates;
DROP POLICY IF EXISTS "Allow public delete expense_templates" ON public.expense_templates;
DROP POLICY IF EXISTS "Allow public insert expense_templates" ON public.expense_templates;
DROP POLICY IF EXISTS "Allow public read expense_templates" ON public.expense_templates;
DROP POLICY IF EXISTS "Allow public update expense_templates" ON public.expense_templates;

-- feature_request_projects: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete feature_request_projects" ON public.feature_request_projects;
DROP POLICY IF EXISTS "Allow public insert feature_request_projects" ON public.feature_request_projects;
DROP POLICY IF EXISTS "Allow public read feature_request_projects" ON public.feature_request_projects;

-- feature_requests: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete feature_requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Allow public insert feature_requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Allow public read feature_requests" ON public.feature_requests;
DROP POLICY IF EXISTS "Allow public update feature_requests" ON public.feature_requests;

-- feedback: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow public insert feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow public read feedback" ON public.feedback;
DROP POLICY IF EXISTS "Allow public update feedback" ON public.feedback;

-- invitations: Remove duplicates
DROP POLICY IF EXISTS "invitations_update" ON public.invitations;

-- organizations: Remove duplicates
DROP POLICY IF EXISTS "Allow signup function to insert orgs" ON public.organizations;

-- payments: Remove duplicates
DROP POLICY IF EXISTS "payments_all" ON public.payments;

-- project_contracts: Remove duplicates
DROP POLICY IF EXISTS "project_contracts_all" ON public.project_contracts;
DROP POLICY IF EXISTS "project_contracts_delete_org" ON public.project_contracts;
DROP POLICY IF EXISTS "project_contracts_insert_org" ON public.project_contracts;
DROP POLICY IF EXISTS "project_contracts_select_org" ON public.project_contracts;
DROP POLICY IF EXISTS "project_contracts_update_org" ON public.project_contracts;

-- project_costs: Remove duplicates
DROP POLICY IF EXISTS "project_costs_all" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_delete_org" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_insert_org" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_select_org" ON public.project_costs;
DROP POLICY IF EXISTS "project_costs_update_org" ON public.project_costs;

-- project_external_members: Remove duplicates
DROP POLICY IF EXISTS "project_external_members_all" ON public.project_external_members;
DROP POLICY IF EXISTS "project_external_members_delete_org" ON public.project_external_members;
DROP POLICY IF EXISTS "project_external_members_insert_org" ON public.project_external_members;
DROP POLICY IF EXISTS "project_external_members_select_org" ON public.project_external_members;
DROP POLICY IF EXISTS "project_external_members_update_org" ON public.project_external_members;

-- project_invoices: Remove duplicates
DROP POLICY IF EXISTS "project_invoices_all" ON public.project_invoices;
DROP POLICY IF EXISTS "project_invoices_delete_org" ON public.project_invoices;
DROP POLICY IF EXISTS "project_invoices_insert_org" ON public.project_invoices;
DROP POLICY IF EXISTS "project_invoices_select_org" ON public.project_invoices;
DROP POLICY IF EXISTS "project_invoices_update_org" ON public.project_invoices;

-- project_milestones: Remove duplicates
DROP POLICY IF EXISTS "project_milestones_all" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_delete_org" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_insert_org" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_select_org" ON public.project_milestones;
DROP POLICY IF EXISTS "project_milestones_update_org" ON public.project_milestones;

-- project_tasks: Remove duplicates
DROP POLICY IF EXISTS "project_tasks_all" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_delete_org" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_insert_org" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_select_org" ON public.project_tasks;
DROP POLICY IF EXISTS "project_tasks_update_org" ON public.project_tasks;

-- project_team_members: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete project_team_members" ON public.project_team_members;
DROP POLICY IF EXISTS "Allow public insert project_team_members" ON public.project_team_members;
DROP POLICY IF EXISTS "Allow public read project_team_members" ON public.project_team_members;
DROP POLICY IF EXISTS "Allow public update project_team_members" ON public.project_team_members;

-- projects: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public insert projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public update projects" ON public.projects;

-- quotes: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow public insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow public read quotes" ON public.quotes;
DROP POLICY IF EXISTS "Allow public update quotes" ON public.quotes;

-- roles: Remove duplicates
DROP POLICY IF EXISTS "Allow signup function to insert roles" ON public.roles;

-- tickets: Remove duplicates
DROP POLICY IF EXISTS "Allow public delete tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public insert tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public read tickets" ON public.tickets;
DROP POLICY IF EXISTS "Allow public update tickets" ON public.tickets;

-- time_entries: Remove duplicates
DROP POLICY IF EXISTS "time_entries_all" ON public.time_entries;

-- =============================================
-- PART 2: Fix auth_rls_initplan warnings by recreating policies with (SELECT ...)
-- =============================================

-- team_members policies
DROP POLICY IF EXISTS "team_delete" ON public.team_members;
DROP POLICY IF EXISTS "team_insert" ON public.team_members;
DROP POLICY IF EXISTS "team_members_update_own" ON public.team_members;
DROP POLICY IF EXISTS "team_update" ON public.team_members;

CREATE POLICY "team_delete" ON public.team_members FOR DELETE
USING (organization_id = (SELECT public.auth_get_user_org_id()) AND (SELECT public.auth_has_permission('team', 'delete')));

CREATE POLICY "team_insert" ON public.team_members FOR INSERT
WITH CHECK (organization_id = (SELECT public.auth_get_user_org_id()) AND (SELECT public.auth_has_permission('team', 'create')));

CREATE POLICY "team_members_update_own" ON public.team_members FOR UPDATE
USING (auth_user_id = (SELECT auth.uid()));

CREATE POLICY "team_update" ON public.team_members FOR UPDATE
USING (organization_id = (SELECT public.auth_get_user_org_id()) AND (SELECT public.auth_has_permission('team', 'edit')));

-- invitations policies
DROP POLICY IF EXISTS "invitations_select_policy" ON public.invitations;
CREATE POLICY "invitations_select_policy" ON public.invitations FOR SELECT
USING (organization_id = (SELECT public.auth_get_user_org_id()) OR email = (SELECT auth.email()));

-- user_sessions policies
DROP POLICY IF EXISTS "Users can revoke their own sessions" ON public.user_sessions;
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.user_sessions;

CREATE POLICY "Users can revoke their own sessions" ON public.user_sessions FOR DELETE
USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can view their own sessions" ON public.user_sessions FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- email_accounts policies
DROP POLICY IF EXISTS "Users can delete email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can insert email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can update email accounts" ON public.email_accounts;
DROP POLICY IF EXISTS "Users can view email accounts in their org" ON public.email_accounts;

CREATE POLICY "Users can delete email accounts" ON public.email_accounts FOR DELETE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can insert email accounts" ON public.email_accounts FOR INSERT
WITH CHECK (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can update email accounts" ON public.email_accounts FOR UPDATE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can view email accounts in their org" ON public.email_accounts FOR SELECT
USING (organization_id = (SELECT public.auth_get_user_org_id()));

-- contacts policies
DROP POLICY IF EXISTS "Users can create contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts in their organization" ON public.contacts;
DROP POLICY IF EXISTS "Users can view contacts in their organization" ON public.contacts;

CREATE POLICY "Users can create contacts in their organization" ON public.contacts FOR INSERT
WITH CHECK (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can delete contacts in their organization" ON public.contacts FOR DELETE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can update contacts in their organization" ON public.contacts FOR UPDATE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can view contacts in their organization" ON public.contacts FOR SELECT
USING (organization_id = (SELECT public.auth_get_user_org_id()));

-- project_invoices policies
DROP POLICY IF EXISTS "Users can create invoices in their organization" ON public.project_invoices;
DROP POLICY IF EXISTS "Users can delete invoices in their organization" ON public.project_invoices;
DROP POLICY IF EXISTS "Users can update invoices in their organization" ON public.project_invoices;
DROP POLICY IF EXISTS "Users can view invoices in their organization" ON public.project_invoices;

CREATE POLICY "Users can create invoices in their organization" ON public.project_invoices FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete invoices in their organization" ON public.project_invoices FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update invoices in their organization" ON public.project_invoices FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view invoices in their organization" ON public.project_invoices FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- project_tasks policies
DROP POLICY IF EXISTS "Users can create tasks in their organization" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.project_tasks;
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.project_tasks;

CREATE POLICY "Users can create tasks in their organization" ON public.project_tasks FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete tasks in their organization" ON public.project_tasks FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update tasks in their organization" ON public.project_tasks FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view tasks in their organization" ON public.project_tasks FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- project_milestones policies
DROP POLICY IF EXISTS "Users can create milestones in their organization" ON public.project_milestones;
DROP POLICY IF EXISTS "Users can delete milestones in their organization" ON public.project_milestones;
DROP POLICY IF EXISTS "Users can update milestones in their organization" ON public.project_milestones;
DROP POLICY IF EXISTS "Users can view milestones in their organization" ON public.project_milestones;

CREATE POLICY "Users can create milestones in their organization" ON public.project_milestones FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete milestones in their organization" ON public.project_milestones FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update milestones in their organization" ON public.project_milestones FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view milestones in their organization" ON public.project_milestones FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- project_costs policies
DROP POLICY IF EXISTS "Users can create costs in their organization" ON public.project_costs;
DROP POLICY IF EXISTS "Users can delete costs in their organization" ON public.project_costs;
DROP POLICY IF EXISTS "Users can update costs in their organization" ON public.project_costs;
DROP POLICY IF EXISTS "Users can view costs in their organization" ON public.project_costs;

CREATE POLICY "Users can create costs in their organization" ON public.project_costs FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete costs in their organization" ON public.project_costs FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update costs in their organization" ON public.project_costs FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view costs in their organization" ON public.project_costs FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- client_contacts policies
DROP POLICY IF EXISTS "Users can create client_contacts in their organization" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can delete client_contacts in their organization" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can update client_contacts in their organization" ON public.client_contacts;
DROP POLICY IF EXISTS "Users can view client_contacts via their organization" ON public.client_contacts;

CREATE POLICY "Users can create client_contacts in their organization" ON public.client_contacts FOR INSERT
WITH CHECK (client_id IN (SELECT id FROM public.crm_clients WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete client_contacts in their organization" ON public.client_contacts FOR DELETE
USING (client_id IN (SELECT id FROM public.crm_clients WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update client_contacts in their organization" ON public.client_contacts FOR UPDATE
USING (client_id IN (SELECT id FROM public.crm_clients WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view client_contacts via their organization" ON public.client_contacts FOR SELECT
USING (client_id IN (SELECT id FROM public.crm_clients WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- project_contracts policies
DROP POLICY IF EXISTS "Users can create contracts in their organization" ON public.project_contracts;
DROP POLICY IF EXISTS "Users can delete contracts in their organization" ON public.project_contracts;
DROP POLICY IF EXISTS "Users can update contracts in their organization" ON public.project_contracts;
DROP POLICY IF EXISTS "Users can view contracts in their organization" ON public.project_contracts;

CREATE POLICY "Users can create contracts in their organization" ON public.project_contracts FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete contracts in their organization" ON public.project_contracts FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update contracts in their organization" ON public.project_contracts FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view contracts in their organization" ON public.project_contracts FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- project_external_members policies
DROP POLICY IF EXISTS "Users can create external members in their organization" ON public.project_external_members;
DROP POLICY IF EXISTS "Users can delete external members in their organization" ON public.project_external_members;
DROP POLICY IF EXISTS "Users can update external members in their organization" ON public.project_external_members;
DROP POLICY IF EXISTS "Users can view external members in their organization" ON public.project_external_members;

CREATE POLICY "Users can create external members in their organization" ON public.project_external_members FOR INSERT
WITH CHECK (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete external members in their organization" ON public.project_external_members FOR DELETE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update external members in their organization" ON public.project_external_members FOR UPDATE
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view external members in their organization" ON public.project_external_members FOR SELECT
USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- notifications policies
DROP POLICY IF EXISTS "Service can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;

CREATE POLICY "Service can insert notifications" ON public.notifications FOR INSERT
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM public.team_members
        WHERE auth_user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE
USING (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE
USING (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = (SELECT auth.uid())
    )
);

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
USING (
    recipient_id IN (
        SELECT id FROM public.team_members
        WHERE auth_user_id = (SELECT auth.uid())
    )
);

-- tags policies
DROP POLICY IF EXISTS "Users can create tags in their organization" ON public.tags;
DROP POLICY IF EXISTS "Users can delete tags in their organization" ON public.tags;
DROP POLICY IF EXISTS "Users can update tags in their organization" ON public.tags;
DROP POLICY IF EXISTS "Users can view tags in their organization" ON public.tags;

CREATE POLICY "Users can create tags in their organization" ON public.tags FOR INSERT
WITH CHECK (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can delete tags in their organization" ON public.tags FOR DELETE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can update tags in their organization" ON public.tags FOR UPDATE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can view tags in their organization" ON public.tags FOR SELECT
USING (organization_id = (SELECT public.auth_get_user_org_id()));

-- contact_tags policies
DROP POLICY IF EXISTS "Users can create contact_tags in their organization" ON public.contact_tags;
DROP POLICY IF EXISTS "Users can delete contact_tags in their organization" ON public.contact_tags;
DROP POLICY IF EXISTS "Users can view contact_tags in their organization" ON public.contact_tags;

CREATE POLICY "Users can create contact_tags in their organization" ON public.contact_tags FOR INSERT
WITH CHECK (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete contact_tags in their organization" ON public.contact_tags FOR DELETE
USING (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view contact_tags in their organization" ON public.contact_tags FOR SELECT
USING (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- contact_custom_fields policies
DROP POLICY IF EXISTS "Users can create custom_fields in their organization" ON public.contact_custom_fields;
DROP POLICY IF EXISTS "Users can delete custom_fields in their organization" ON public.contact_custom_fields;
DROP POLICY IF EXISTS "Users can update custom_fields in their organization" ON public.contact_custom_fields;
DROP POLICY IF EXISTS "Users can view custom_fields in their organization" ON public.contact_custom_fields;

CREATE POLICY "Users can create custom_fields in their organization" ON public.contact_custom_fields FOR INSERT
WITH CHECK (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can delete custom_fields in their organization" ON public.contact_custom_fields FOR DELETE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can update custom_fields in their organization" ON public.contact_custom_fields FOR UPDATE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can view custom_fields in their organization" ON public.contact_custom_fields FOR SELECT
USING (organization_id = (SELECT public.auth_get_user_org_id()));

-- contact_custom_field_values policies
DROP POLICY IF EXISTS "Users can create custom_field_values in their organization" ON public.contact_custom_field_values;
DROP POLICY IF EXISTS "Users can delete custom_field_values in their organization" ON public.contact_custom_field_values;
DROP POLICY IF EXISTS "Users can update custom_field_values in their organization" ON public.contact_custom_field_values;
DROP POLICY IF EXISTS "Users can view custom_field_values in their organization" ON public.contact_custom_field_values;

CREATE POLICY "Users can create custom_field_values in their organization" ON public.contact_custom_field_values FOR INSERT
WITH CHECK (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can delete custom_field_values in their organization" ON public.contact_custom_field_values FOR DELETE
USING (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can update custom_field_values in their organization" ON public.contact_custom_field_values FOR UPDATE
USING (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

CREATE POLICY "Users can view custom_field_values in their organization" ON public.contact_custom_field_values FOR SELECT
USING (contact_id IN (SELECT id FROM public.contacts WHERE organization_id = (SELECT public.auth_get_user_org_id())));

-- contact_activities policies
DROP POLICY IF EXISTS "Users can create contact_activities in their organization" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can delete contact_activities in their organization" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can update contact_activities in their organization" ON public.contact_activities;
DROP POLICY IF EXISTS "Users can view contact_activities in their organization" ON public.contact_activities;

CREATE POLICY "Users can create contact_activities in their organization" ON public.contact_activities FOR INSERT
WITH CHECK (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can delete contact_activities in their organization" ON public.contact_activities FOR DELETE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can update contact_activities in their organization" ON public.contact_activities FOR UPDATE
USING (organization_id = (SELECT public.auth_get_user_org_id()));

CREATE POLICY "Users can view contact_activities in their organization" ON public.contact_activities FOR SELECT
USING (organization_id = (SELECT public.auth_get_user_org_id()));
