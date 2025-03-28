"use client";

import * as React from "react";
import { cn } from "./utils";

// Use a type alias instead of an empty interface to avoid the TypeScript warning
export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  // This ensures we can add component-specific props in the future
  className?: string;
};

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
