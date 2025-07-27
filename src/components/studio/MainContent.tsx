import { useState } from "react";
import { Search, Mic, ChevronLeft, ChevronRight, Grid3X3, List, Plus } from "lucide-react";
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
  onNewProject: (folderId: string) => void;
  onFolderChange: (folderId: string) => void;
}

type ViewType = 'card' | 'list';

export const MainContent = ({ scripts, activeFolder, folders, onScriptSelect, onNewProject, onFolderChange }: MainContentProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [viewType, setViewType] = useState<ViewType>('card');
  const scriptsPerPage = 6;
  
  const activeFolderName = folders.find(f => f.id === activeFolder)?.name || 'All Scripts';
  
  // Pagination logic
  const totalPages = Math.ceil(scripts.length / scriptsPerPage);
  const startIndex = (currentPage - 1) * scriptsPerPage;
  const endIndex = startIndex + scriptsPerPage;
  const currentScripts = scripts.slice(startIndex, endIndex);
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };
  
  const handleNewProject = () => {
    onNewProject(activeFolder);
  };

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
            <div className="flex items-center space-x-2">
              <Button
                variant={viewType === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('card')}
                className="p-2"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewType === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewType('list')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <h1 className="text-2xl font-bold text-studio-text">{activeFolderName}</h1>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-studio-muted"
              onClick={handleNewProject}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
            <Button variant="ghost" size="sm" className="text-studio-muted">
              Team
            </Button>
            <div className="flex items-center space-x-2 text-studio-muted">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handlePrevPage}
                disabled={currentPage === 1}
                className="p-1"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span>{currentPage}/{totalPages || 1}</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleNextPage}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 p-6">
        {viewType === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentScripts.map((script) => (
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
        ) : (
          <div className="space-y-4">
            {currentScripts.map((script) => (
              <div
                key={script.id}
                className="bg-studio-card rounded-lg p-4 cursor-pointer hover:bg-accent transition-colors border border-border flex items-center justify-between"
                onClick={() => onScriptSelect(script)}
              >
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-studio-text mb-1">
                    {script.title}
                  </h3>
                  <p className="text-studio-muted text-sm line-clamp-1">
                    {script.content}
                  </p>
                </div>
                <div className="text-xs text-studio-muted ml-4">
                  {script.createdAt.toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};