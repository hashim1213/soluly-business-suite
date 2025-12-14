import { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";
import {
  ArrowLeft,
  Download,
  Trash2,
  Search,
  Calendar,
  User,
  Mail,
  Building,
  Filter,
  BarChart3,
  Clock,
  TrendingUp,
  FileText,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { useFormByDisplayId } from "@/hooks/useForms";
import { useFormFields, FormField, FIELD_TYPE_CONFIG } from "@/hooks/useFormFields";
import {
  useFormResponses,
  useDeleteFormResponse,
  useFormAnalytics,
  exportResponsesToCSV,
  FormResponseWithLink,
} from "@/hooks/useFormResponses";
import { formStatusStyles } from "@/lib/styles";
import { format } from "date-fns";

export default function FormResponses() {
  const { displayId } = useParams<{ displayId: string }>();
  const { navigateOrg } = useOrgNavigation();
  const { data: form, isLoading: formLoading } = useFormByDisplayId(displayId);
  const { data: fields, isLoading: fieldsLoading } = useFormFields(form?.id);
  const { data: responses, isLoading: responsesLoading } = useFormResponses(form?.id);
  const { data: analytics, isLoading: analyticsLoading } = useFormAnalytics(form?.id, fields || []);

  const deleteResponse = useDeleteFormResponse();

  const [activeTab, setActiveTab] = useState("responses");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedResponse, setSelectedResponse] = useState<FormResponseWithLink | null>(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  // Filter responses
  const filteredResponses = useMemo(() => {
    if (!responses) return [];

    if (!searchQuery) return responses;

    const query = searchQuery.toLowerCase();
    return responses.filter((response) => {
      // Search in respondent info
      if (response.respondent_name?.toLowerCase().includes(query)) return true;
      if (response.respondent_email?.toLowerCase().includes(query)) return true;
      if (response.link?.recipient_name?.toLowerCase().includes(query)) return true;
      if (response.link?.recipient_email?.toLowerCase().includes(query)) return true;
      if (response.link?.recipient_company?.toLowerCase().includes(query)) return true;

      // Search in answers
      const answerText = Object.values(response.answers)
        .map((v) => (Array.isArray(v) ? v.join(" ") : String(v)))
        .join(" ")
        .toLowerCase();
      return answerText.includes(query);
    });
  }, [responses, searchQuery]);

  const handleDeleteResponse = async (id: string) => {
    if (!form) return;
    if (!confirm("Are you sure you want to delete this response?")) return;

    try {
      await deleteResponse.mutateAsync({ id, formId: form.id });
      setSelectedResponse(null);
    } catch {
      // Error handled by hook
    }
  };

  const handleExportCSV = () => {
    if (!responses || !fields || !form) return;
    exportResponsesToCSV(responses, fields, form.title);
  };

  const isLoading = formLoading || fieldsLoading || responsesLoading;

  if (isLoading || !form || !fields) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b-2 border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigateOrg(`forms/${displayId}`)}
                className="border-2 border-border"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold">{form.title} - Responses</h1>
                  <Badge className={formStatusStyles[form.status]}>
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {form.display_id} • {responses?.length || 0} responses
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={!responses || responses.length === 0}
                className="border-2 border-border"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                onClick={() => navigateOrg(`forms/${displayId}`)}
                className="border-2 border-border"
              >
                <FileText className="mr-2 h-4 w-4" />
                Edit Form
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="border-2 border-border">
            <TabsTrigger value="responses" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Responses
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              Analytics
            </TabsTrigger>
          </TabsList>

          {/* Responses Tab */}
          <TabsContent value="responses" className="mt-6">
            <div className="space-y-6">
              {/* Search */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search responses..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 border-2 border-border"
                  />
                </div>
              </div>

              {/* Responses Table */}
              <Card className="border-2 border-border">
                <CardContent className="p-0">
                  {filteredResponses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No responses yet</h3>
                      <p className="text-muted-foreground">
                        {responses?.length === 0
                          ? "Share your form link to start collecting responses"
                          : "No responses match your search"}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b-2 border-border">
                          <TableHead className="font-bold">Respondent</TableHead>
                          <TableHead className="font-bold">Link Type</TableHead>
                          <TableHead className="font-bold">Submitted</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredResponses.map((response) => (
                          <TableRow
                            key={response.id}
                            className="border-b border-border cursor-pointer hover:bg-accent/50"
                            onClick={() => setSelectedResponse(response)}
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-full">
                                  <User className="h-4 w-4" />
                                </div>
                                <div>
                                  <div className="font-medium">
                                    {response.respondent_name ||
                                      response.link?.recipient_name ||
                                      "Anonymous"}
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    {response.respondent_email ||
                                      response.link?.recipient_email ||
                                      "No email"}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={response.link?.link_type === "personal" ? "secondary" : "outline"}
                                className="text-xs"
                              >
                                {response.link?.link_type || "Direct"}
                              </Badge>
                              {response.link?.recipient_company && (
                                <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                  <Building className="h-3 w-3" />
                                  {response.link.recipient_company}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                {format(new Date(response.created_at), "MMM d, yyyy h:mm a")}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedResponse(response);
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteResponse(response.id);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="mt-6">
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : analytics ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-2 border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
                      <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{analytics.totalResponses}</div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Avg. Completion Time</CardTitle>
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics.averageCompletionTime
                          ? `${Math.round(analytics.averageCompletionTime)}s`
                          : "N/A"}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium">Fields</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{fields.length}</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Responses Over Time */}
                {analytics.responsesOverTime.length > 0 && (
                  <Card className="border-2 border-border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Responses Over Time
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-40 flex items-end gap-1">
                        {analytics.responsesOverTime.slice(-30).map((day, i) => {
                          const maxCount = Math.max(...analytics.responsesOverTime.map((d) => d.count));
                          const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-primary/20 hover:bg-primary/30 transition-colors rounded-t"
                              style={{ height: `${Math.max(height, 2)}%` }}
                              title={`${day.date}: ${day.count} responses`}
                            />
                          );
                        })}
                      </div>
                      <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                        {analytics.responsesOverTime.length > 0 && (
                          <>
                            <span>{analytics.responsesOverTime[0].date}</span>
                            <span>{analytics.responsesOverTime[analytics.responsesOverTime.length - 1].date}</span>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Field Analytics */}
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Field Analytics</h2>
                  {fields.map((field) => {
                    const fieldAnalytic = analytics.fieldAnalytics[field.id];
                    if (!fieldAnalytic) return null;

                    const isExpanded = expandedFieldId === field.id;

                    return (
                      <Card key={field.id} className="border-2 border-border">
                        <CardHeader
                          className="cursor-pointer"
                          onClick={() => setExpandedFieldId(isExpanded ? null : field.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <CardTitle className="text-base">{field.label}</CardTitle>
                              <CardDescription>
                                {FIELD_TYPE_CONFIG[field.field_type].label}
                              </CardDescription>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </CardHeader>
                        {isExpanded && (
                          <CardContent>
                            {/* Distribution Chart */}
                            {fieldAnalytic.distribution && fieldAnalytic.distribution.length > 0 && (
                              <div className="space-y-3">
                                {fieldAnalytic.distribution.map((item, i) => (
                                  <div key={i} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span>{item.value}</span>
                                      <span className="text-muted-foreground">
                                        {item.count} ({item.percentage}%)
                                      </span>
                                    </div>
                                    <Progress value={item.percentage} className="h-2" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Average for numeric fields */}
                            {fieldAnalytic.average !== undefined && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Average:</span>
                                <span className="font-bold text-lg">
                                  {fieldAnalytic.average.toFixed(1)}
                                </span>
                              </div>
                            )}

                            {/* Text responses */}
                            {fieldAnalytic.textResponses && fieldAnalytic.textResponses.length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                  Showing {Math.min(5, fieldAnalytic.textResponses.length)} of{" "}
                                  {fieldAnalytic.textResponses.length} responses
                                </p>
                                {fieldAnalytic.textResponses.slice(0, 5).map((text, i) => (
                                  <div
                                    key={i}
                                    className="p-3 bg-muted rounded-lg text-sm"
                                  >
                                    {text}
                                  </div>
                                ))}
                              </div>
                            )}
                          </CardContent>
                        )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="border-2 border-border">
                <CardContent className="py-12 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">No data yet</h3>
                  <p className="text-muted-foreground">
                    Analytics will appear once you receive responses
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Detail Dialog */}
      <Dialog open={!!selectedResponse} onOpenChange={() => setSelectedResponse(null)}>
        <DialogContent className="sm:max-w-[600px] border-2 border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Response Details</DialogTitle>
          </DialogHeader>
          {selectedResponse && (
            <div className="space-y-6">
              {/* Respondent Info */}
              <div className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground">Respondent</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedResponse.respondent_name ||
                        selectedResponse.link?.recipient_name ||
                        "Anonymous"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {selectedResponse.respondent_email ||
                        selectedResponse.link?.recipient_email ||
                        "No email"}
                    </span>
                  </div>
                  {selectedResponse.link?.recipient_company && (
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <span>{selectedResponse.link.recipient_company}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {format(new Date(selectedResponse.created_at), "MMM d, yyyy h:mm a")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Answers */}
              <div className="space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground">Answers</h3>
                {fields?.map((field) => {
                  const answer = selectedResponse.answers[field.id];
                  return (
                    <div key={field.id} className="space-y-1">
                      <Label className="text-muted-foreground">{field.label}</Label>
                      <div className="p-3 bg-muted rounded-lg">
                        {answer === undefined || answer === null || answer === "" ? (
                          <span className="text-muted-foreground italic">No answer</span>
                        ) : Array.isArray(answer) ? (
                          <div className="flex flex-wrap gap-1">
                            {answer.map((v, i) => (
                              <Badge key={i} variant="secondary">
                                {String(v)}
                              </Badge>
                            ))}
                          </div>
                        ) : field.field_type === "rating" ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <span
                                key={i}
                                className={
                                  i < Number(answer) ? "text-amber-500" : "text-muted-foreground"
                                }
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-sm">({answer})</span>
                          </div>
                        ) : field.field_type === "yes_no" ? (
                          <Badge variant={answer === true || answer === "yes" ? "default" : "secondary"}>
                            {answer === true || answer === "yes" ? "Yes" : "No"}
                          </Badge>
                        ) : (
                          <span>{String(answer)}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => handleDeleteResponse(selectedResponse.id)}
                  className="border-2 border-border text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Response
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
