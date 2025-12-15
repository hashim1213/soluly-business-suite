import { useAuth } from "@/contexts/AuthContext";
import { EyeOff } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface HiddenAmountProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Component that displays a monetary amount or hides it based on user permissions.
 * Uses the canViewAmounts permission from AuthContext.
 */
export function HiddenAmount({
  value,
  prefix = "$",
  suffix = "",
  className = "",
  showTooltip = true,
}: HiddenAmountProps) {
  const { canViewAmounts } = useAuth();

  if (canViewAmounts()) {
    return (
      <span className={className}>
        {prefix}
        {value.toLocaleString()}
        {suffix}
      </span>
    );
  }

  // User doesn't have permission to view amounts
  const hiddenContent = (
    <span className={`inline-flex items-center gap-1 text-muted-foreground ${className}`}>
      <EyeOff className="h-3 w-3" />
      <span>••••••</span>
    </span>
  );

  if (showTooltip) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{hiddenContent}</TooltipTrigger>
        <TooltipContent>
          <p>You don't have permission to view financial amounts</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return hiddenContent;
}

/**
 * Hook to check if amounts should be hidden
 */
export function useCanViewAmounts() {
  const { canViewAmounts } = useAuth();
  return canViewAmounts();
}
