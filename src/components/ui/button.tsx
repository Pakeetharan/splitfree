import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "ghost"
    | "danger"
    | "outline"
    | "default";
  size?: "sm" | "md" | "lg";
  /** Shows a spinner and disables the button, without shifting layout */
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading || undefined}
        className={cn(
          "relative inline-flex items-center justify-center rounded-lg font-medium transition-[background-color,color,border-color,transform,box-shadow] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
          {
            "bg-accent text-white hover:bg-accent-hover":
              variant === "primary" || variant === "default",
            "bg-surface-secondary text-text-primary hover:bg-gray-200 dark:hover:bg-gray-700":
              variant === "secondary",
            "text-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800":
              variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700": variant === "danger",
            "border border-border-primary bg-white text-text-secondary hover:bg-gray-50 dark:bg-transparent dark:hover:bg-gray-800":
              variant === "outline",
          },
          {
            "h-8 px-3 text-sm": size === "sm",
            "h-10 px-4 text-sm": size === "md",
            "h-12 px-6 text-base": size === "lg",
          },
          className,
        )}
        {...props}
      >
        <span
          className={cn(
            "inline-flex items-center justify-center gap-1.5",
            isLoading && "invisible",
          )}
        >
          {children}
        </span>
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = "Button";
export { Button };
