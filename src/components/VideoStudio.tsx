import { useState } from "react";
import { Sidebar } from "./studio/Sidebar";
import { MainContent } from "./studio/MainContent";
import { ScriptEditor } from "./studio/ScriptEditor";
import { TeleprompterMode } from "./studio/TeleprompterMode";

export interface ScriptBoard {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Folder {
  id: string;
  name: string;
  isActive?: boolean;
}

export type ViewMode = 'boards' | 'editor' | 'teleprompter';

const VideoStudio = () => {
  const [folders] = useState<Folder[]>([
    { id: '1', name: 'All Scripts', isActive: true },
    { id: '2', name: 'TikTok' },
    { id: '3', name: 'Instagram' },
    { id: '4', name: 'YouTube Videos' },
    { id: '5', name: 'Greater Creator' },
    { id: '6', name: 'Movements Series' },
  ]);

  const [scripts] = useState<ScriptBoard[]>([
    {
      id: '1',
      title: 'How to Kickflip',
      content: 'Today I\'m going to teach you the secret to landing your first kickflip coming from a lifelong skateboarding vet OG. This is going to be a comprehensive guide that breaks down every aspect of the kickflip technique.',
      folderId: '4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Origin Story',
      content: 'My journey into content creation started when I realized the power of storytelling through video. This is the story of how everything began.',
      folderId: '4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Casey Neistats tips for success',
      content: 'What I learned from studying the master of daily vlogs and how you can apply these principles to your own content creation journey.',
      folderId: '4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  const [activeFolder, setActiveFolder] = useState<string>('4');
  const [viewMode, setViewMode] = useState<ViewMode>('boards');
  const [activeScript, setActiveScript] = useState<ScriptBoard | null>(null);

  const handleScriptSelect = (script: ScriptBoard) => {
    setActiveScript(script);
    setViewMode('editor');
  };

  const handleRecord = () => {
    setViewMode('teleprompter');
  };

  const handleBackToEditor = () => {
    setViewMode('editor');
  };

  const handleBackToBoards = () => {
    setViewMode('boards');
    setActiveScript(null);
  };

  const filteredScripts = scripts.filter(script => 
    activeFolder === '1' ? true : script.folderId === activeFolder
  );

  return (
    <div className="min-h-screen bg-studio-bg flex">
      <Sidebar 
        folders={folders}
        activeFolder={activeFolder}
        onFolderSelect={setActiveFolder}
      />
      
      <div className="flex-1 flex flex-col">
        {viewMode === 'boards' && (
          <MainContent 
            scripts={filteredScripts}
            activeFolder={activeFolder}
            folders={folders}
            onScriptSelect={handleScriptSelect}
          />
        )}
        
        {viewMode === 'editor' && activeScript && (
          <ScriptEditor 
            script={activeScript}
            onRecord={handleRecord}
            onBack={handleBackToBoards}
          />
        )}
        
        {viewMode === 'teleprompter' && activeScript && (
          <TeleprompterMode 
            script={activeScript}
            onBack={handleBackToEditor}
          />
        )}
      </div>
    </div>
  );
};

export default VideoStudio;