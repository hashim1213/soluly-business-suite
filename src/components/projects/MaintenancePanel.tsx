import { differenceInCalendarMonths, format, parseISO } from "date-fns";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useCanViewAmounts } from "@/components/HiddenAmount";
import { Project } from "@/hooks/useProjects";

const FREQUENCY_MONTHS: Record<string, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
};

const FREQUENCY_LABEL: Record<string, string> = {
  monthly: "month",
  quarterly: "quarter",
  yearly: "year",
};

function parse(value: string | null | undefined) {
  if (!value) return null;
  const d = parseISO(value);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Recurring-billing summary for a project in maintenance: the build is
 * delivered, the client pays e.g. $300/month for 2 years, and ongoing work
 * (costs, invoices) keeps accruing against the project.
 */
export function MaintenancePanel({ project }: { project: Project }) {
  const canViewAmounts = useCanViewAmounts();

  if (!project.has_maintenance && project.status !== "maintenance") return null;

  const money = (v: number) =>
    canViewAmounts
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 0,
        }).format(v)
      : "••••••";

  const perMonths = FREQUENCY_MONTHS[project.maintenance_frequency] ?? 1;
  const unit = FREQUENCY_LABEL[project.maintenance_frequency] ?? "month";
  const amount = project.maintenance_amount || 0;
  const start = parse(project.maintenance_start_date);
  const end = parse(project.maintenance_end_date);
  const today = new Date();

  // Periods are billed at the start of each cycle: month 0 counts as billed
  // once the term has begun.
  const totalPeriods =
    start && end ? Math.max(Math.floor(differenceInCalendarMonths(end, start) / perMonths), 1) : null;
  const elapsedPeriods = start
    ? Math.max(Math.floor(differenceInCalendarMonths(today, start) / perMonths) + 1, 0)
    : 0;
  const billedPeriods =
    totalPeriods !== null ? Math.min(elapsedPeriods, totalPeriods) : elapsedPeriods;
  const billedToDate = billedPeriods * amount;
  const totalContract = totalPeriods !== null ? totalPeriods * amount : null;
  const termProgress =
    totalPeriods !== null ? Math.min((billedPeriods / totalPeriods) * 100, 100) : null;

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Wrench className="h-4 w-4 text-chart-2" />
          <CardTitle className="text-base">Maintenance</CardTitle>
          <Badge className="bg-cyan-600 text-white ml-1">
            {project.status === "maintenance" ? "Active" : "Configured"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Recurring</p>
            <p className="text-lg font-semibold font-mono">
              {money(amount)}
              <span className="text-xs text-muted-foreground font-sans"> / {unit}</span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Term</p>
            <p className="text-sm font-medium mt-1">
              {start ? format(start, "MMM d, yyyy") : "Not set"}
              {" – "}
              {end ? format(end, "MMM d, yyyy") : "Ongoing"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Billed to date</p>
            <p className="text-lg font-semibold font-mono">{money(billedToDate)}</p>
            <p className="text-xs text-muted-foreground">
              {billedPeriods} {unit}
              {billedPeriods === 1 ? "" : "s"}
              {totalPeriods !== null ? ` of ${totalPeriods}` : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total contract</p>
            <p className="text-lg font-semibold font-mono">
              {totalContract !== null ? money(totalContract) : "Open-ended"}
            </p>
          </div>
        </div>
        {termProgress !== null && (
          <div className="flex items-center gap-3">
            <Progress value={termProgress} className="h-2 flex-1" />
            <span className="text-xs font-mono text-muted-foreground w-10 text-right">
              {Math.round(termProgress)}%
            </span>
          </div>
        )}
        {project.maintenance_notes && (
          <p className="text-sm text-muted-foreground border-t border-border pt-3">
            {project.maintenance_notes}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Ongoing work stays billable: add costs in the Costs tab and bill the client from the
          Invoices tab as usual.
        </p>
      </CardContent>
    </Card>
  );
}
