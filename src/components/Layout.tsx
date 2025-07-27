import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-studio-bg">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center border-b border-border bg-studio-bg">
            <SidebarTrigger className="ml-4 text-studio-text" />
            <h1 className="ml-4 text-xl font-bold text-studio-text">viddy studio</h1>
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}