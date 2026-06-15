import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, icon, iconPosition = "right", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div
              className={cn(
                "absolute top-1/2 -translate-y-1/2 text-gray-400",
                iconPosition === "right" ? "right-3" : "left-3"
              )}
            >
              {icon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            className={cn(
              "flex h-11 w-full rounded-xl border bg-gray-50 px-4 py-2 text-sm outline-none transition-all file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400",
              "focus:border-primary-500 focus:bg-white focus:ring-2 focus:ring-primary-500/20",
              error && "border-danger focus:border-danger focus:ring-danger/20",
              icon && iconPosition === "right" && "pr-12",
              icon && iconPosition === "left" && "pl-12",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        {helperText && !error && <p className="text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
