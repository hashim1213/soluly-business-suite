import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      "peer inline-flex h-5 w-10 shrink-0 cursor-pointer items-center rounded-full border transition-colors data-[state=checked]:border-transparent data-[state=checked]:bg-primary data-[state=checked]:hover:bg-primary-hover data-[state=unchecked]:border-muted-foreground/60 data-[state=unchecked]:bg-transparent data-[state=unchecked]:hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-3.5 w-3.5 rounded-full shadow-xs ring-0 transition-transform data-[state=checked]:translate-x-[22px] data-[state=checked]:bg-primary-foreground data-[state=unchecked]:translate-x-[2px] data-[state=unchecked]:bg-muted-foreground",
      )}
    />
  </SwitchPrimitives.Root>
));
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
