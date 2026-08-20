import * as RadixDialog from "@radix-ui/react-dialog";
import { Sidebar } from "@/components/layout/sidebar";

export function MobileDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60" />
        <RadixDialog.Content className="fixed inset-y-0 left-0 z-50 h-full w-72 outline-none">
          <RadixDialog.Title className="sr-only">Menu de navegação</RadixDialog.Title>
          <Sidebar collapsed={false} onToggleCollapsed={() => {}} onNavigate={() => onOpenChange(false)} />
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
