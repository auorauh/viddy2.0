import { Folder, Plus, Home, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  folders: Array<{ id: string; name: string; isActive?: boolean }>;
  activeFolder: string;
  onFolderSelect: (folderId: string) => void;
}

export const Sidebar = ({ folders, activeFolder, onFolderSelect }: SidebarProps) => {
  return (
    <div className="w-64 bg-studio-sidebar border-r border-border flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-studio-text">viddy studio</h1>
      </div>

      {/* Folders */}
      <div className="flex-1 p-4">
        <nav className="space-y-2">
          {folders.map((folder) => (
            <Button
              key={folder.id}
              variant="ghost"
              className={cn(
                "w-full justify-start text-left h-10 px-3 font-normal",
                activeFolder === folder.id 
                  ? "bg-studio-accent text-studio-bg font-medium" 
                  : "text-studio-muted hover:text-studio-text hover:bg-accent"
              )}
              onClick={() => onFolderSelect(folder.id)}
            >
              <Folder className="mr-3 h-4 w-4" />
              {folder.name}
            </Button>
          ))}
        </nav>
      </div>

      {/* Bottom navigation */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-center space-x-4">
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
            <Home className="h-5 w-5 text-studio-muted" />
          </Button>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 bg-studio-accent text-studio-bg">
            <Plus className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="sm" className="h-10 w-10 p-0">
            <User className="h-5 w-5 text-studio-muted" />
          </Button>
        </div>
      </div>
    </div>
  );
};