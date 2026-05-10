import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium transition-all duration-150 ease-out",
  {
    variants: {
      variant: {
        default: "border-bpvp-border bg-bpvp-bg text-bpvp-text-secondary",
        primary: "border-emerald-500/30 bg-emerald-500/10 text-bpvp-primary",
        accent: "border-amber-500/30 bg-amber-500/10 text-bpvp-accent",
        danger: "border-rose-500/30 bg-rose-500/10 text-bpvp-danger",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
