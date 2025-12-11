import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useUploadOrgLogo() {
  const queryClient = useQueryClient();
  const { organization, refreshUserData } = useAuth();

  return useMutation({
    mutationFn: async (file: File) => {
      if (!organization?.id) throw new Error("No organization found");

      // Validate file type
      const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
      if (!allowedTypes.includes(file.type)) {
        throw new Error("Invalid file type. Please upload a JPEG, PNG, GIF, WebP, or SVG image.");
      }

      // Validate file size (2MB max)
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("File too large. Maximum size is 2MB.");
      }

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${organization.id}/logo-${Date.now()}.${fileExt}`;

      // Delete old logo if exists
      if (organization.logo_url) {
        const oldPath = organization.logo_url.split("/org-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("org-logos").remove([oldPath]);
        }
      }

      // Upload new logo
      const { error: uploadError } = await supabase.storage
        .from("org-logos")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("org-logos")
        .getPublicUrl(fileName);

      // Update organization with logo URL
      const { error: updateError } = await supabase
        .from("organizations")
        .update({ logo_url: publicUrl })
        .eq("id", organization.id);

      if (updateError) throw updateError;

      return publicUrl;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      refreshUserData();
      toast.success("Logo uploaded successfully");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}

export function useRemoveOrgLogo() {
  const queryClient = useQueryClient();
  const { organization, refreshUserData } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!organization?.id) throw new Error("No organization found");

      // Delete logo from storage if exists
      if (organization.logo_url) {
        const oldPath = organization.logo_url.split("/org-logos/")[1];
        if (oldPath) {
          await supabase.storage.from("org-logos").remove([oldPath]);
        }
      }

      // Clear logo URL in database
      const { error } = await supabase
        .from("organizations")
        .update({ logo_url: null })
        .eq("id", organization.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      refreshUserData();
      toast.success("Logo removed");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
