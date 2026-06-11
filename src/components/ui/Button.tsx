import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-colors rounded-md disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-syndicate-blue text-white hover:bg-syndicate-blue-dark":
              variant === "primary",
            "border border-syndicate-slate text-syndicate-slate hover:bg-syndicate-light-gray":
              variant === "secondary",
            "text-syndicate-slate hover:bg-syndicate-light-gray":
              variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "px-3 py-1.5 text-xs": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
