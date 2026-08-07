import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { Toaster } from "@/components/ui/toaster";
import { storage } from "@/lib/storage";

const COLLAPSE_KEY = "tai:sidebar_collapsed";

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => storage.get(COLLAPSE_KEY, false));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      storage.set(COLLAPSE_KEY, next);
      return next;
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy-950">
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </div>
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-panel-border bg-navy-900 px-4 py-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-slate-200 hover:bg-navy-800"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <p className="font-display text-base font-bold uppercase tracking-wide">
            Tai <span className="text-brand-light">Project</span>
          </p>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
