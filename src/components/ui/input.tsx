import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onIconClick?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, leftIcon, rightIcon, onIconClick, ...props }, ref) => {
    return (
      <div className="relative">
        {leftIcon && onIconClick ? (
          <button
            type="button"
            tabIndex={-1}
            onClick={onIconClick}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand transition-colors hover:text-brand-light"
            aria-label="Abrir calendário"
          >
            {leftIcon}
          </button>
        ) : (
          leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leftIcon}
            </span>
          )
        )}
        <input
          ref={ref}
          className={cn(
            "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-white placeholder:text-muted",
            "focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition-colors",
            leftIcon && "pl-9",
            rightIcon && "pr-9",
            error && "border-danger focus:border-danger focus:ring-danger",
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-brand-light">
            {rightIcon}
          </span>
        )}
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
  className,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("label-caps mb-1.5 block", className)}>
      {children}
      {required && <span className="text-danger"> *</span>}
    </label>
  );
}
