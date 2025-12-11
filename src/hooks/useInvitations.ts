import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export type Invitation = Tables<"invitations">;
export type InvitationInsert = TablesInsert<"invitations">;

// Extended invitation type with role details
export type InvitationWithRole = Invitation & {
  role: { name: string } | null;
  inviter: { name: string } | null;
};

// Generate a secure random token
function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

// Fetch all invitations for the current organization
export function useInvitations() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["invitations", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          role:roles(name),
          inviter:team_members!invitations_invited_by_fkey(name)
        `)
        .eq("organization_id", organization.id)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as InvitationWithRole[];
    },
    enabled: !!organization?.id,
  });
}

// Fetch pending invitations count
export function usePendingInvitationsCount() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["invitations", organization?.id, "count"],
    queryFn: async () => {
      if (!organization?.id) return 0;

      const { count, error } = await supabase
        .from("invitations")
        .select("*", { count: "exact", head: true })
        .eq("organization_id", organization.id)
        .is("accepted_at", null)
        .gt("expires_at", new Date().toISOString());

      if (error) throw error;
      return count || 0;
    },
    enabled: !!organization?.id,
  });
}

// Create a new invitation
export function useCreateInvitation() {
  const queryClient = useQueryClient();
  const { organization, member } = useAuth();

  return useMutation({
    mutationFn: async ({ email, roleId }: { email: string; roleId: string }) => {
      if (!organization?.id) throw new Error("No organization found");
      if (!member?.id) throw new Error("No member found");

      // Check if email already has an account in this org
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("email", email)
        .single();

      if (existingMember) {
        throw new Error("This email is already a member of your organization");
      }

      // Check for existing pending invitation
      const { data: existingInvite } = await supabase
        .from("invitations")
        .select("id")
        .eq("organization_id", organization.id)
        .eq("email", email)
        .is("accepted_at", null)
        .single();

      if (existingInvite) {
        throw new Error("An invitation has already been sent to this email");
      }

      // Create invitation (expires in 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from("invitations")
        .insert({
          organization_id: organization.id,
          email: email.toLowerCase(),
          role_id: roleId,
          invited_by: member.id,
          token: generateToken(),
          expires_at: expiresAt.toISOString(),
        })
        .select(`
          *,
          role:roles(name),
          inviter:team_members!invitations_invited_by_fkey(name)
        `)
        .single();

      if (error) throw error;
      return data as InvitationWithRole;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      // Generate the invite link
      const inviteLink = `${window.location.origin}/invite/${data.token}`;
      toast.success(
        `Invitation sent to ${data.email}. Share this link: ${inviteLink}`,
        { duration: 10000 }
      );
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

// Resend invitation (generate new token and extend expiry)
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { data, error } = await supabase
        .from("invitations")
        .update({
          token: generateToken(),
          expires_at: expiresAt.toISOString(),
        })
        .eq("id", invitationId)
        .select()
        .single();

      if (error) throw error;
      return data as Invitation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      const inviteLink = `${window.location.origin}/invite/${data.token}`;
      toast.success(`Invitation resent. New link: ${inviteLink}`, { duration: 10000 });
    },
    onError: (error) => {
      toast.error("Failed to resend invitation: " + error.message);
    },
  });
}

// Cancel/delete an invitation
export function useDeleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from("invitations")
        .delete()
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invitations"] });
      toast.success("Invitation cancelled");
    },
    onError: (error) => {
      toast.error("Failed to cancel invitation: " + error.message);
    },
  });
}

// Get invitation by token (for accept invite page)
export function useInvitationByToken(token: string | undefined) {
  return useQuery({
    queryKey: ["invitations", "token", token],
    queryFn: async () => {
      if (!token) return null;

      const { data, error } = await supabase
        .from("invitations")
        .select(`
          *,
          organization:organizations(name, slug),
          role:roles(name)
        `)
        .eq("token", token)
        .is("accepted_at", null)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!token,
  });
}
