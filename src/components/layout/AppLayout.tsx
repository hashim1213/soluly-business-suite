import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { TrayTimerSync } from "@/components/TrayTimerSync";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  useDocumentTitle();

  return (
    <SidebarProvider>
      <TrayTimerSync />
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AppHeader />
          <main className="flex-1 p-3 sm:p-4 md:p-6 bg-secondary/30 overflow-x-hidden">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
