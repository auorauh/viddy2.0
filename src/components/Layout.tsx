import { useEffect, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(null);

  useEffect(() => {
    // Check for custom logo in localStorage
    const savedLogo = localStorage.getItem('customLogo');
    setCustomLogo(savedLogo);
  }, []);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          <header className="h-12 flex items-center justify-between border-b border-border bg-background">
            <SidebarTrigger className="ml-4 text-foreground" />
            <img 
              src={customLogo || "/lovable-uploads/20fb152d-90aa-49ea-bd19-32203eb8fc67.png"} 
              alt={customLogo ? "Custom Logo" : "Viddy Studio"} 
              className="mr-4 h-8 object-contain"
            />
          </header>
          
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}