import { Search, Mic, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ScriptBoard } from "../../pages/Studio";

interface Folder {
  id: string;
  name: string;
  isActive?: boolean;
}

interface MainContentProps {
  scripts: ScriptBoard[];
  activeFolder: string;
  folders: Array<Folder>;
  onScriptSelect: (script: ScriptBoard) => void;
}

export const MainContent = ({ scripts, activeFolder, folders, onScriptSelect }: MainContentProps) => {
  const activeFolderName = folders.find(f => f.id === activeFolder)?.name || 'All Scripts';

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-studio-muted" />
              <Input 
                placeholder="Search"
                className="w-80 pl-10 bg-studio-card border-border text-studio-text"
              />
              <Mic className="absolute right-3 top-3 h-4 w-4 text-studio-muted" />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-studio-text">{activeFolderName}</h1>
            <Button variant="ghost" size="sm" className="text-studio-muted">
              Team
            </Button>
            <div className="flex items-center space-x-2 text-studio-muted">
              <ChevronLeft className="h-4 w-4" />
              <span>1/3</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </header>

      {/* Content Grid */}
      <main className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scripts.map((script) => (
            <div
              key={script.id}
              className="bg-studio-card rounded-lg p-6 cursor-pointer hover:bg-accent transition-colors border border-border"
              onClick={() => onScriptSelect(script)}
            >
              <h3 className="text-lg font-semibold text-studio-text mb-3">
                {script.title}
              </h3>
              <p className="text-studio-muted text-sm line-clamp-3">
                {script.content}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};