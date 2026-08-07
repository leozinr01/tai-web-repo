import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          className={cn(
            "h-10 w-full rounded-lg border border-panel-border bg-navy-800 px-3 text-sm text-slate-100 placeholder:text-muted",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors",
            leftIcon && "pl-9",
            error && "border-danger focus:border-danger focus:ring-danger",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
      </div>
    );
  },
);
Input.displayName = "Input";

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-danger" role="alert">
      {message}
    </p>
  );
}

export function FieldLabel({
  children,
  htmlFor,
  required,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="label-caps mb-1.5 block">
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}
