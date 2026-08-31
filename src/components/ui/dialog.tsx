import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  titleClassName?: string;
  descriptionClassName?: string;
  closeButtonClassName?: string;
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  icon,
  children,
  footer,
  size = "md",
  titleClassName,
  descriptionClassName,
  closeButtonClassName,
}: DialogProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex max-h-[86vh] w-[92vw] -translate-x-1/2 -translate-y-1/2 flex-col gap-6 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl",
            sizeClasses[size],
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {icon && <div className="rounded-2xl bg-brand/10 p-3 text-brand-light">{icon}</div>}
              <div>
                <RadixDialog.Title className={cn("text-xl font-bold text-white", titleClassName)}>
                  {title}
                </RadixDialog.Title>
                {description && (
                  <RadixDialog.Description className={cn("mt-0.5 text-sm text-muted", descriptionClassName)}>
                    {description}
                  </RadixDialog.Description>
                )}
              </div>
            </div>
            <RadixDialog.Close
              className={cn("text-muted hover:text-white", closeButtonClassName)}
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </RadixDialog.Close>
          </div>
          {children}
          {footer}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
