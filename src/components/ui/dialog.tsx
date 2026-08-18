import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-3xl",
};

export function Dialog({ open, onOpenChange, title, description, children, footer, size = "md" }: DialogProps) {
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
            <div>
              <RadixDialog.Title className="text-xl font-bold text-white">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-0.5 text-sm text-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="text-muted hover:text-white" aria-label="Fechar">
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
