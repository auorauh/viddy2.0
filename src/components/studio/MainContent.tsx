import { useState } from "react";
import { Search, ChevronLeft, ChevronRight, Plus, Home, User, Zap } from "lucide-react";
import { NavLink } from "react-router-dom";
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

export const MainContent = ({ scripts, activeFolder, folders, onScriptSelect, onNewProject, onFolderChange }: MainContentProps) => {
  const [currentPage, setCurrentPage] = useState(1);
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
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      {/* Desktop Header */}
      <header className="p-6 border-b border-border hidden md:block">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-studio-muted" />
              <Input 
                placeholder="Search"
                className="w-80 pl-10 pr-4 bg-studio-card border-border text-studio-text"
              />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-studio-text absolute left-1/2 transform -translate-x-1/2">{activeFolderName}</h1>
          
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="p-2 text-studio-text hover:text-studio-accent"
            >
              <NavLink to="/idea-pitch">
                <Zap className="h-4 w-4" />
              </NavLink>
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

      {/* Mobile Header */}
      <header className="px-4 py-3 space-y-3 border-b border-border md:hidden">
        {/* Folder name */}
        <div className="text-center">
          <h2 className="text-lg font-semibold text-studio-text">{activeFolderName}</h2>
        </div>
        
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-studio-muted" />
          <Input 
            placeholder="Search scripts..."
            className="w-full pl-10 pr-4 bg-studio-card border-border text-studio-text h-10"
          />
        </div>
        
        {/* Lightning bolt and pagination */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="h-8 w-8 p-0 text-studio-text hover:text-studio-accent"
          >
            <NavLink to="/idea-pitch">
              <Zap className="h-4 w-4" />
            </NavLink>
          </Button>
          <div className="flex items-center space-x-1 text-studio-muted">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handlePrevPage}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm px-2">{currentPage}/{totalPages || 1}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNextPage}
              disabled={currentPage === totalPages || totalPages === 0}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 py-3 md:p-6 overflow-auto">
        <div className="max-w-full mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 justify-items-center sm:justify-items-stretch">
            {currentScripts.map((script) => (
              <div
                key={script.id}
                className="bg-studio-card rounded-lg p-4 md:p-6 cursor-pointer hover:bg-accent transition-colors border border-border min-h-[120px] md:min-h-[140px] flex flex-col w-full max-w-sm sm:max-w-none"
                onClick={() => onScriptSelect(script)}
              >
                <h3 className="text-base md:text-lg font-semibold text-studio-text mb-2 md:mb-3 line-clamp-2">
                  {script.title}
                </h3>
                <p className="text-studio-muted text-sm line-clamp-3 flex-1">
                  {script.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="border-t border-border px-4 py-3 md:p-8 mt-4 md:mt-8 safe-area-pb">
        <div className="flex items-center justify-center space-x-4 md:space-x-8">
          <Button
            variant="ghost"
            size="lg"
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <Home className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-xs md:text-sm">Studio</span>
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            onClick={handleNewProject}
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            <span className="text-xs md:text-sm">New Project</span>
          </Button>

          
          <Button
            variant="ghost"
            size="lg"
            asChild
            className="flex items-center space-x-2 md:space-x-3 text-studio-text hover:text-studio-accent h-auto py-3 md:py-4 px-4 md:px-6"
          >
            <NavLink to="/profile">
              <User className="h-4 w-4 md:h-5 md:w-5" />
              <span className="text-xs md:text-sm">Profile</span>
            </NavLink>
          </Button>
        </div>
      </footer>
    </div>
  );
};