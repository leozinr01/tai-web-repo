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
    <div
      className="flex h-screen w-screen overflow-hidden bg-navy-950"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(59, 130, 246, 0.15), rgba(0, 0, 0, 0) 45%), radial-gradient(circle at 85% 0%, rgba(45, 212, 191, 0.12), rgba(0, 0, 0, 0) 40%), linear-gradient(rgb(2, 6, 23) 0%, rgb(1, 11, 26) 100%)",
      }}
    >
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      </div>
      <MobileDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex items-center gap-3 border-b border-white/10 bg-navy-950/95 backdrop-blur-xl px-4 py-3 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            className="rounded-md p-2 text-slate-200 hover:bg-white/10"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <img src="/logo-tai-project.png" alt="Tai Project" className="h-6 w-auto object-contain" />
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 pb-6 pt-4 sm:p-5 md:p-8">
          <div className="mx-auto w-full max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
