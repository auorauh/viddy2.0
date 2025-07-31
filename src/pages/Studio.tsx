import { useState } from "react";
import { MainContent } from "@/components/studio/MainContent";
import { ScriptEditor } from "@/components/studio/ScriptEditor";
import { CameraSync } from "@/components/studio/CameraSync";
import { TeleprompterMode } from "@/components/studio/TeleprompterMode";

export interface ScriptBoard {
  id: string;
  title: string;
  content: string;
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'boards' | 'editor' | 'camera-sync' | 'teleprompter';

const Studio = () => {
  const [scripts, setScripts] = useState<ScriptBoard[]>([
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

  const handleNewProject = (folderId: string) => {
    const newScript: ScriptBoard = {
      id: Date.now().toString(),
      title: 'New Project',
      content: '',
      folderId: folderId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setScripts(prev => [...prev, newScript]);
  };

  const handleScriptSelect = (script: ScriptBoard) => {
    setActiveScript(script);
    setViewMode('editor');
  };

  const handleRecord = () => {
    setViewMode('camera-sync');
  };

  const handleCameraSync = () => {
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

  const folders = [
    { id: '1', name: 'All Scripts', isActive: true },
    { id: '2', name: 'TikTok' },
    { id: '3', name: 'Instagram' },
    { id: '5', name: 'Greater Creator' },
    { id: '6', name: 'Movements Series' },
  ];

  return (
    <div className="flex-1 flex flex-col">
      {viewMode === 'boards' && (
        <MainContent 
          scripts={filteredScripts}
          activeFolder={activeFolder}
          folders={folders}
          onScriptSelect={handleScriptSelect}
          onNewProject={handleNewProject}
          onFolderChange={setActiveFolder}
        />
      )}
      
      {viewMode === 'editor' && activeScript && (
        <ScriptEditor 
          script={activeScript}
          onRecord={handleRecord}
          onBack={handleBackToBoards}
        />
      )}
      
      {viewMode === 'camera-sync' && activeScript && (
        <CameraSync 
          onSync={handleCameraSync}
          onBack={handleBackToEditor}
        />
      )}
      
      {viewMode === 'teleprompter' && activeScript && (
        <TeleprompterMode 
          script={activeScript}
          onBack={handleBackToEditor}
        />
      )}
    </div>
  );
};

export default Studio;