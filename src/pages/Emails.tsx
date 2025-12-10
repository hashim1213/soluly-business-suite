import { useState, useEffect } from "react";
import { Mail, Inbox, Send, Archive, RefreshCw, Sparkles, Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Email {
  id: string;
  subject: string;
  sender_email: string;
  sender_name: string | null;
  body: string;
  received_at: string;
  processed_at: string | null;
  status: "pending" | "processed" | "failed";
  category: "feature_request" | "customer_quote" | "feedback" | "other" | null;
  confidence_score: number | null;
  ai_summary: string | null;
  extracted_data: Record<string, unknown> | null;
}

const categoryStyles: Record<string, string> = {
  feature_request: "bg-chart-4 text-foreground",
  customer_quote: "bg-chart-1 text-background",
  feedback: "bg-chart-2 text-background",
  other: "bg-muted text-muted-foreground",
};

const categoryLabels: Record<string, string> = {
  feature_request: "Feature Request",
  customer_quote: "Quote",
  feedback: "Feedback",
  other: "Other",
};

export default function Emails() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [processingAll, setProcessingAll] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState({
    subject: "",
    sender_email: "",
    sender_name: "",
    body: "",
  });

  const fetchEmails = async () => {
    const { data, error } = await supabase
      .from("emails")
      .select("*")
      .order("received_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch emails");
      console.error(error);
    } else {
      setEmails(data as Email[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEmails();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("emails-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "emails" },
        () => {
          fetchEmails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processEmail = async (email: Email) => {
    setProcessingId(email.id);
    try {
      const { data, error } = await supabase.functions.invoke("process-email", {
        body: {
          emailId: email.id,
          subject: email.subject,
          body: email.body,
          senderEmail: email.sender_email,
          senderName: email.sender_name,
        },
      });

      if (error) throw error;

      toast.success(`Email categorized as: ${categoryLabels[data.category] || data.category}`);
      fetchEmails();
    } catch (err) {
      console.error("Processing error:", err);
      toast.error("Failed to process email");
    } finally {
      setProcessingId(null);
    }
  };

  const processAllPending = async () => {
    const pendingEmails = emails.filter((e) => e.status === "pending");
    if (pendingEmails.length === 0) {
      toast.info("No pending emails to process");
      return;
    }

    setProcessingAll(true);
    let processed = 0;
    let failed = 0;

    for (const email of pendingEmails) {
      try {
        await supabase.functions.invoke("process-email", {
          body: {
            emailId: email.id,
            subject: email.subject,
            body: email.body,
            senderEmail: email.sender_email,
            senderName: email.sender_name,
          },
        });
        processed++;
      } catch {
        failed++;
      }
    }

    setProcessingAll(false);
    fetchEmails();
    toast.success(`Processed ${processed} emails${failed > 0 ? `, ${failed} failed` : ""}`);
  };

  const addEmail = async () => {
    if (!newEmail.subject || !newEmail.sender_email || !newEmail.body) {
      toast.error("Please fill in all required fields");
      return;
    }

    const { error } = await supabase.from("emails").insert({
      subject: newEmail.subject,
      sender_email: newEmail.sender_email,
      sender_name: newEmail.sender_name || null,
      body: newEmail.body,
    });

    if (error) {
      toast.error("Failed to add email");
      console.error(error);
    } else {
      toast.success("Email added successfully");
      setNewEmail({ subject: "", sender_email: "", sender_name: "", body: "" });
      setIsAddDialogOpen(false);
      fetchEmails();
    }
  };

  const unprocessedCount = emails.filter((e) => e.status === "pending").length;
  const processedCount = emails.filter((e) => e.status === "processed").length;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return "Yesterday";
    return `${diffDays} days ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Email Inbox</h1>
          <p className="text-muted-foreground">
            Process incoming emails with AI-powered categorization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="border-2"
            onClick={fetchEmails}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            className="border-2"
            onClick={processAllPending}
            disabled={processingAll || unprocessedCount === 0}
          >
            {processingAll ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Process All ({unprocessedCount})
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="border-2 shadow-sm hover:shadow-md transition-shadow">
                <Plus className="h-4 w-4 mr-2" />
                Add Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="sender_email">Sender Email *</Label>
                  <Input
                    id="sender_email"
                    placeholder="sender@example.com"
                    value={newEmail.sender_email}
                    onChange={(e) =>
                      setNewEmail({ ...newEmail, sender_email: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sender_name">Sender Name</Label>
                  <Input
                    id="sender_name"
                    placeholder="John Doe"
                    value={newEmail.sender_name}
                    onChange={(e) =>
                      setNewEmail({ ...newEmail, sender_name: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject"
                    value={newEmail.subject}
                    onChange={(e) =>
                      setNewEmail({ ...newEmail, subject: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Body *</Label>
                  <Textarea
                    id="body"
                    placeholder="Email content..."
                    rows={6}
                    value={newEmail.body}
                    onChange={(e) =>
                      setNewEmail({ ...newEmail, body: e.target.value })
                    }
                  />
                </div>
                <Button onClick={addEmail} className="w-full">
                  Add Email
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-secondary">
                <Inbox className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{emails.length}</div>
                <div className="text-sm text-muted-foreground">Total Emails</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-4">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-2xl font-bold">{unprocessedCount}</div>
                <div className="text-sm text-muted-foreground">To Process</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-2 border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 border-2 border-border flex items-center justify-center bg-chart-2">
                <Archive className="h-5 w-5 text-background" />
              </div>
              <div>
                <div className="text-2xl font-bold">{processedCount}</div>
                <div className="text-sm text-muted-foreground">Processed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 border-border shadow-sm">
        <CardHeader className="border-b-2 border-border">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-bold uppercase tracking-wider">
              Incoming Emails
            </CardTitle>
            <Badge variant="outline" className="font-mono">
              {unprocessedCount} pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {emails.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No emails yet. Add your first email to get started.</p>
            </div>
          ) : (
            <div className="divide-y-2 divide-border">
              {emails.map((email) => (
                <div
                  key={email.id}
                  className={`p-4 hover:bg-accent/50 transition-colors ${
                    email.status === "pending" ? "bg-secondary/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-10 w-10 border-2 border-border flex items-center justify-center shrink-0 ${
                        email.status === "processed" ? "bg-secondary" : "bg-chart-4"
                      }`}
                    >
                      <Mail className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span
                              className={`text-sm ${
                                email.status === "pending" ? "font-bold" : ""
                              }`}
                            >
                              {email.sender_name || email.sender_email}
                            </span>
                            {email.status === "processed" && email.category && (
                              <Badge className={categoryStyles[email.category]}>
                                {categoryLabels[email.category]}
                              </Badge>
                            )}
                            {email.confidence_score && (
                              <span className="text-xs text-muted-foreground">
                                ({Math.round(email.confidence_score * 100)}% confident)
                              </span>
                            )}
                            {email.status === "pending" && (
                              <Badge
                                variant="outline"
                                className="border-chart-4 text-chart-4"
                              >
                                Pending
                              </Badge>
                            )}
                          </div>
                          <h4
                            className={`${
                              email.status === "pending" ? "font-bold" : "font-medium"
                            }`}
                          >
                            {email.subject}
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {email.ai_summary || email.body.substring(0, 150) + "..."}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatDate(email.received_at)}
                          </span>
                          {email.status === "pending" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => processEmail(email)}
                              disabled={processingId === email.id}
                            >
                              {processingId === email.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
