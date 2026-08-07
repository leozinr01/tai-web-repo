import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
import { toastStore, dismissToast, type ToastVariant } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const variantConfig: Record<ToastVariant, { icon: typeof Info; classes: string }> = {
  default: { icon: Info, classes: "border-panel-border text-slate-100" },
  success: { icon: CheckCircle2, classes: "border-success/40 text-success-light" },
  error: { icon: AlertCircle, classes: "border-danger/40 text-danger-light" },
  warning: { icon: AlertTriangle, classes: "border-warning/40 text-warning-light" },
};

export function Toaster() {
  const { toasts } = toastStore.useStore();

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[92vw] max-w-sm flex-col gap-2">
      {toasts.map((t) => {
        const config = variantConfig[t.variant];
        const Icon = config.icon;
        return (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-lg border bg-navy-800 p-3 shadow-soft animate-in fade-in slide-in-from-bottom-2",
              config.classes,
            )}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-100">{t.title}</p>
              {t.description && <p className="mt-0.5 text-xs text-muted">{t.description}</p>}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-muted hover:text-slate-200"
              aria-label="Fechar notificacao"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
