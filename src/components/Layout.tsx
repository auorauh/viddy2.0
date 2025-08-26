import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [customLogo, setCustomLogo] = useState<string | null>(null);
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Check for custom logo in localStorage
    const savedLogo = localStorage.getItem('customLogo');
    setCustomLogo(savedLogo);
  }, []);

  // Don't show header on auth pages
  const isAuthPage = ['/login', '/signup'].includes(location.pathname);
  const showHeader = isAuthenticated && !isAuthPage;

  return (
    <div className="min-h-screen flex flex-col w-full bg-background">
      {showHeader && (
        <header className="h-12 flex items-center justify-end border-b border-border bg-background">
          <img 
            src={customLogo || "/lovable-uploads/20fb152d-90aa-49ea-bd19-32203eb8fc67.png"} 
            alt={customLogo ? "Custom Logo" : "Viddy Studio"} 
            className="mr-4 h-8 object-contain"
          />
        </header>
      )}
      
      <main className={showHeader ? "flex-1" : "min-h-screen"}>
        {children}
      </main>
    </div>
  );
}