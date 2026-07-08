import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium tracking-wide whitespace-nowrap",
  {
    variants: {
      variant: {
        neutral: "border-border bg-base-800 text-ink-300",
        active: "border-steel-700/60 bg-steel-900/50 text-steel-300",
        success: "border-moss-500/30 bg-moss-500/10 text-moss-400",
        warning: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        danger: "border-rose-500/30 bg-rose-500/10 text-rose-500",
        outline: "border-base-500 bg-transparent text-ink-400",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
