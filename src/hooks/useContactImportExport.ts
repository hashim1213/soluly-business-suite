import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Contact } from "./useContacts";
import { ContactImportRow, ImportResult, SocialProfiles } from "@/types/crm";

/**
 * Parse CSV content into array of objects
 */
export function parseCSV(content: string): ContactImportRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];

  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  const rows: ContactImportRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length !== headers.length) continue;

    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx]?.trim() || "";
    });

    // Map common field variations
    rows.push({
      name: row.name || row.full_name || row.contact_name || "",
      email: row.email || row.email_address || "",
      phone: row.phone || row.phone_number || row.telephone || "",
      job_title: row.job_title || row.title || row.position || "",
      company: row.company || row.company_name || row.organization || "",
      address: row.address || row.mailing_address || "",
      notes: row.notes || row.description || row.comments || "",
      tags: row.tags || row.categories || row.labels || "",
      linkedin_url: row.linkedin_url || row.linkedin || "",
      twitter_url: row.twitter_url || row.twitter || "",
      facebook_url: row.facebook_url || row.facebook || "",
      website_url: row.website_url || row.website || row.url || "",
    });
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map((v) => v.replace(/^"|"$/g, ""));
}

/**
 * Generate next display ID for contacts
 */
async function generateDisplayId(organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from("contacts")
    .select("display_id")
    .eq("organization_id", organizationId)
    .order("display_id", { ascending: false })
    .limit(1);

  if (error) throw error;

  if (!data || data.length === 0) {
    return "CON-001";
  }

  const lastId = data[0].display_id;
  const match = lastId.match(/CON-(\d+)/);
  if (!match) {
    return "CON-001";
  }

  const nextNum = parseInt(match[1], 10) + 1;
  return `CON-${nextNum.toString().padStart(3, "0")}`;
}

/**
 * Hook to import contacts from CSV
 */
export function useImportContacts() {
  const queryClient = useQueryClient();
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (rows: ContactImportRow[]): Promise<ImportResult> => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      const result: ImportResult = {
        total: rows.length,
        successful: 0,
        failed: 0,
        errors: [],
      };

      // Get company name to ID mapping
      const { data: clients } = await supabase
        .from("crm_clients")
        .select("id, name")
        .eq("organization_id", organization.id);

      const companyMap = new Map(clients?.map((c) => [c.name.toLowerCase(), c.id]) || []);

      // Get tag name to ID mapping
      const { data: tags } = await supabase
        .from("tags")
        .select("id, name")
        .eq("organization_id", organization.id);

      const tagMap = new Map(tags?.map((t) => [t.name.toLowerCase(), t.id]) || []);

      // Process each row
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        try {
          if (!row.name) {
            throw new Error("Name is required");
          }

          const displayId = await generateDisplayId(organization.id);

          // Build social profiles
          const socialProfiles: SocialProfiles = {};
          if (row.linkedin_url) socialProfiles.linkedin_url = row.linkedin_url;
          if (row.twitter_url) socialProfiles.twitter_url = row.twitter_url;
          if (row.facebook_url) socialProfiles.facebook_url = row.facebook_url;
          if (row.website_url) socialProfiles.website_url = row.website_url;

          // Find company ID
          const companyId = row.company
            ? companyMap.get(row.company.toLowerCase()) || null
            : null;

          // Insert contact
          const { data: contact, error } = await supabase
            .from("contacts")
            .insert({
              organization_id: organization.id,
              display_id: displayId,
              name: row.name,
              email: row.email || null,
              phone: row.phone || null,
              job_title: row.job_title || null,
              company_id: companyId,
              address: row.address || null,
              notes: row.notes || null,
              social_profiles: Object.keys(socialProfiles).length > 0 ? socialProfiles : {},
            })
            .select()
            .single();

          if (error) throw error;

          // Add tags if specified
          if (row.tags && contact) {
            const tagNames = row.tags.split(";").map((t) => t.trim().toLowerCase());
            const tagIds = tagNames
              .map((name) => tagMap.get(name))
              .filter((id): id is string => !!id);

            if (tagIds.length > 0) {
              await supabase.from("contact_tags").insert(
                tagIds.map((tagId) => ({
                  contact_id: contact.id,
                  tag_id: tagId,
                }))
              );
            }
          }

          result.successful++;
        } catch (err) {
          result.failed++;
          result.errors.push({
            row: i + 2, // +2 for 1-indexed and header row
            error: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      return result;
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      if (result.failed === 0) {
        toast.success(`Successfully imported ${result.successful} contacts`);
      } else {
        toast.warning(
          `Imported ${result.successful} contacts, ${result.failed} failed`
        );
      }
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
}

/**
 * Hook to export contacts to CSV
 */
export function useExportContacts() {
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (contacts: Contact[]): Promise<string> => {
      if (!organization?.id) {
        throw new Error("No organization found");
      }

      // Define CSV headers
      const headers = [
        "Name",
        "Email",
        "Phone",
        "Job Title",
        "Company",
        "Address",
        "Notes",
        "Tags",
        "LinkedIn URL",
        "Twitter URL",
        "Facebook URL",
        "Website URL",
        "Created At",
      ];

      // Build CSV content
      const rows = contacts.map((contact) => {
        const tags = contact.tags?.map((ct) => ct.tag?.name).filter(Boolean).join("; ") || "";
        const socialProfiles = contact.social_profiles || {};

        return [
          contact.name,
          contact.email || "",
          contact.phone || "",
          contact.job_title || "",
          contact.company?.name || "",
          contact.address || "",
          contact.notes || "",
          tags,
          socialProfiles.linkedin_url || "",
          socialProfiles.twitter_url || "",
          socialProfiles.facebook_url || "",
          socialProfiles.website_url || "",
          contact.created_at,
        ]
          .map((value) => {
            // Escape values that contain commas or quotes
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",");
      });

      return [headers.join(","), ...rows].join("\n");
    },
    onSuccess: (csvContent) => {
      // Create and download file
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `contacts-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Contacts exported successfully");
    },
    onError: (error) => {
      toast.error(`Export failed: ${error.message}`);
    },
  });
}

/**
 * Generate a sample CSV template for import
 */
export function generateImportTemplate(): string {
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Job Title",
    "Company",
    "Address",
    "Notes",
    "Tags",
    "LinkedIn URL",
    "Twitter URL",
    "Facebook URL",
    "Website URL",
  ];

  const sampleRow = [
    "John Doe",
    "john@example.com",
    "+1-555-0123",
    "CEO",
    "Example Corp",
    "123 Main St, City, Country",
    "Important client",
    "VIP; Client",
    "https://linkedin.com/in/johndoe",
    "https://twitter.com/johndoe",
    "",
    "https://example.com",
  ];

  return [headers.join(","), sampleRow.join(",")].join("\n");
}
