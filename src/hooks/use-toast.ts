import { create } from "@/lib/tiny-store";
import { uid } from "@/lib/utils";

export type ToastVariant = "default" | "success" | "error" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastState {
  toasts: ToastItem[];
}

export const toastStore = create<ToastState>({ toasts: [] });

export function toast(input: Omit<ToastItem, "id">): void {
  const item: ToastItem = { id: uid("toast"), ...input };
  toastStore.setState((s) => ({ toasts: [...s.toasts, item] }));
  setTimeout(() => {
    toastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== item.id) }));
  }, 4000);
}

export function dismissToast(id: string): void {
  toastStore.setState((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
}
