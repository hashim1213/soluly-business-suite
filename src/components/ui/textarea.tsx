import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-sm border border-input border-b-muted-foreground/50 bg-card px-3 py-2 text-sm transition-[border-color,box-shadow] placeholder:text-muted-foreground hover:border-muted-foreground/40 hover:border-b-muted-foreground/60 focus-visible:outline-none focus-visible:border-b-primary focus-visible:shadow-[inset_0_-1px_0_0_hsl(var(--ring))] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
