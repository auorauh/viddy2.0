import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"
import { MainContent } from "@/components/studio/MainContent";
import { ScriptEditor } from "@/components/studio/ScriptEditor";
import { CameraSync } from "@/components/studio/CameraSync";
import { TeleprompterMode } from "@/components/studio/TeleprompterMode";
import { Finish } from "@/components/studio/Finish";

export interface ScriptBoard {
  id: string;
  title: string;
  content: string[];
  folderId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ViewMode = 'boards' | 'editor' | 'camera-sync' | 'teleprompter' | 'finish';

const Studio = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.userInfo;
  const [scripts, setScripts] = useState<ScriptBoard[]>([
    {
      id: '1',
      title: 'How to Kickflip',
      content: ['Today I\'m going to teach you the secret to landing your first kickflip coming from a lifelong skateboarding vet OG.', 'This is going to be a comprehensive guide that breaks down every aspect of the kickflip technique.', '123456789. 12345678910.'],
      folderId: '4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '2',
      title: 'Origin Story',
      content: ['My journey into content creation started when I realized the power of storytelling through video. This is the story of how everything began.'],
      folderId: '4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '3',
      title: 'Casey Neistats tips for success',
      content: ['Point 1','Point 2'],
      folderId: '4',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
      useEffect(() => {
        //navigate to login page if no user is defined
        if (user === undefined) {
          navigate('/login');
        }
    }, []);

  const [activeFolder, setActiveFolder] = useState<string>('4');
  const [viewMode, setViewMode] = useState<ViewMode>('boards');
  const [activeScript, setActiveScript] = useState<ScriptBoard | null>(null);

  const handleNewProject = (folderId: string) => {
    const newScript: ScriptBoard = {
      id: Date.now().toString(),
      title: 'New Project',
      content: [''],
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
  const handleFinish = () => {
    setViewMode('finish');
  }

  const filteredScripts = scripts.filter(script => 
    activeFolder === '1' ? true : script.folderId === activeFolder
  );
  const logScript = (id: string, newContent: string[]) => {
  setScripts(prevScripts =>
    prevScripts.map(script =>
      script.id === id
        ? { ...script, content: newContent, updatedAt: new Date() } // update content
        : script
    )
  );
  }

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
          userInfo={user}
        />
      )}
      
      {viewMode === 'editor' && activeScript && (
        <ScriptEditor 
          script={activeScript}
          onScriptUpdate={logScript}
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
          onFinish={handleFinish}
        />
      )}
      {viewMode === 'finish' && activeScript && (
        <Finish 
          script={activeScript}
          onBack={handleBackToEditor}
        />
      )}
    </div>
  );
};

export default Studio;