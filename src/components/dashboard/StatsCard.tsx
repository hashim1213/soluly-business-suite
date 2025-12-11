import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useOrgNavigation } from "@/hooks/useOrgNavigation";

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  href?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatsCard({ title, value, description, icon: Icon, href, trend }: StatsCardProps) {
  const { getOrgPath } = useOrgNavigation();
  const cardContent = (
    <Card className={`border-2 border-border shadow-sm hover:shadow-md transition-shadow ${href ? "cursor-pointer hover:border-primary" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
          {title}
        </CardTitle>
        <div className="h-8 w-8 border-2 border-border flex items-center justify-center bg-secondary">
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight">{value}</div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div className={`text-sm font-medium mt-2 ${trend.isPositive ? 'text-chart-2' : 'text-destructive'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link to={getOrgPath(href)}>{cardContent}</Link>;
  }

  return cardContent;
}
