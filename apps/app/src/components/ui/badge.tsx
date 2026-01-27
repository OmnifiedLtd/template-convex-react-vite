import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-brand-primary/15 text-brand-secondary border border-brand-primary/30",
        secondary:
          "bg-muted text-muted-foreground",
        destructive:
          "bg-destructive/10 text-destructive",
        outline:
          "text-foreground border border-border bg-transparent",
        success:
          "bg-brand-accent/15 text-[#00875A]",
        warning:
          "bg-amber-100 text-amber-800",
        accent:
          "bg-brand-accent/15 text-[#00875A]",
        muted:
          "bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
