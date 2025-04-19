import * as React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "outline" | "solid";
}

export function Badge({ className = "", variant = "outline", ...props }: BadgeProps) {
  return (
    <span
      className={
        `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border ` +
        (variant === "outline"
          ? "border-primary/30 bg-primary/10 text-primary "
          : "bg-primary text-white border-transparent ") +
        className
      }
      {...props}
    />
  );
} 