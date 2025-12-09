import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const projects = [
  {
    name: "Acme Corp",
    status: "active",
    progress: 75,
    tickets: 12,
    value: "$45,000",
  },
  {
    name: "TechStart Inc",
    status: "active",
    progress: 40,
    tickets: 8,
    value: "$28,000",
  },
  {
    name: "Global Solutions",
    status: "active",
    progress: 90,
    tickets: 5,
    value: "$62,000",
  },
  {
    name: "DataFlow Ltd",
    status: "pending",
    progress: 15,
    tickets: 3,
    value: "$35,000",
  },
];

const statusStyles = {
  active: "bg-chart-2 text-background",
  pending: "bg-chart-4 text-foreground",
  completed: "bg-primary text-primary-foreground",
};

export function ProjectsOverview() {
  return (
    <Card className="border-2 border-border shadow-sm">
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-lg font-bold uppercase tracking-wider">Active Projects</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y-2 divide-border">
          {projects.map((project) => (
            <div
              key={project.name}
              className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{project.name}</h4>
                  <span className="text-sm text-muted-foreground">{project.tickets} open tickets</span>
                </div>
                <div className="text-right">
                  <div className="font-bold font-mono">{project.value}</div>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-bold uppercase ${
                      statusStyles[project.status as keyof typeof statusStyles]
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={project.progress} className="h-2 flex-1" />
                <span className="text-sm font-mono font-medium w-12 text-right">{project.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
