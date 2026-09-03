import { useState } from "react";
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
  contentClassName?: string;
  /** Aviso dispensável exibido em um card separado, abaixo do card principal. */
  hint?: string;
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
  contentClassName,
  hint,
}: DialogProps) {
  const [hintVisible, setHintVisible] = useState(true);

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-navy-950/80 backdrop-blur-md data-[state=open]:animate-in data-[state=open]:fade-in" />
        <RadixDialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[92vw] max-h-[86vh] -translate-x-1/2 -translate-y-1/2 overflow-y-auto",
            sizeClasses[size],
          )}
        >
          <div
            className={cn(
              "flex flex-col gap-6 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl",
              contentClassName,
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
          </div>
          {hint && hintVisible && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-2xl backdrop-blur-xl">
              <p className="text-xs font-medium text-muted">{hint}</p>
              <button
                type="button"
                onClick={() => setHintVisible(false)}
                className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-muted transition-colors hover:text-white"
                aria-label="Fechar aviso"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
