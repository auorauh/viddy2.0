import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainContent } from "@/components/studio/MainContent";
import { ScriptEditor } from "@/components/studio/ScriptEditor";
import { CameraSync } from "@/components/studio/CameraSync";
import { TeleprompterMode } from "@/components/studio/TeleprompterMode";
import { QueryWrapper } from "@/components/common/QueryWrapper";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects, useScripts, useCreateScript, useCreateProject, useProject } from "@/hooks/api";
import type { Script, Project } from "@/lib/api/types";
import { toast } from "sonner";

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
  const { isAuthenticated } = useAuth();
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const [activeProject, setActiveProject] = useState<string>(projectId || '');
  const [activeFolder, setActiveFolder] = useState<string>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('boards');
  const [activeScript, setActiveScript] = useState<Script | null>(null);

  // Fetch projects and scripts
  const {
    data: projectsData,
    isLoading: projectsLoading,
    error: projectsError,
    refetch: refetchProjects
  } = useProjects({ limit: 50 });

  // Fetch specific project if projectId is provided
  const {
    data: currentProjectData,
    isLoading: currentProjectLoading,
    error: currentProjectError
  } = useProject(projectId || '');

  const {
    data: scriptsData,
    isLoading: scriptsLoading,
    error: scriptsError,
    refetch: refetchScripts
  } = useScripts({ limit: 100 });

  // Mutations
  const createProjectMutation = useCreateProject();
  const createScriptMutation = useCreateScript();

  // Set project from URL parameter or default to first project
  useEffect(() => {
    if (projectId) {
      // If we have a projectId from URL, use it
      setActiveProject(projectId);
    } else if (projectsData?.length && !activeProject) {
      // Otherwise, default to first project and redirect to include project in URL
      const firstProjectId = projectsData[0]._id;
      setActiveProject(firstProjectId);
      navigate(`/studio/${firstProjectId}`, { replace: true });
    }
  }, [projectId, projectsData, activeProject, navigate]);

  // Show message if no projects exist
  if (!projectsLoading && (!projectsData || projectsData.length === 0)) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">No Projects Found</h2>
          <p className="text-muted-foreground mb-4">You need to create a project first before you can create scripts.</p>
          <p className="text-sm text-muted-foreground">Please go to the Dashboard to create your first project.</p>
        </div>
      </div>
    );
  }

  // Show message if specific project not found
  if (projectId && !currentProjectLoading && currentProjectError) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
          <p className="text-sm text-muted-foreground">Please select a different project or go back to the Dashboard.</p>
        </div>
      </div>
    );
  }

  // Convert API data to legacy format for existing components
  const convertScriptToScriptBoard = (script: Script): ScriptBoard => ({
    id: script._id,
    title: script.title,
    content: script.content,
    folderId: script.folderId,
    createdAt: new Date(script.createdAt),
    updatedAt: new Date(script.updatedAt),
  });

  const scripts = scriptsData?.items?.map(convertScriptToScriptBoard) || [];
  const projects = projectsData || [];

  // Use current project data if available, otherwise find from projects list
  const currentProject = currentProjectData || projects.find(p => p._id === activeProject);

  // Filter scripts by active project and folder
  const filteredScripts = scripts.filter(script => {
    if (!activeProject) return false;

    const scriptProject = scriptsData?.items?.find(s => s._id === script.id);
    if (!scriptProject || scriptProject.projectId !== activeProject) return false;

    if (activeFolder === 'all') return true;
    return script.folderId === activeFolder;
  });
  const folders = [
    { id: 'all', name: 'All Scripts', isActive: true },
    ...(currentProject?.folders?.map(folder => ({
      id: folder.id,
      name: folder.name,
      isActive: false,
    })) || [])
  ];

  const handleNewProject = async (folderId: string) => {
    if (!activeProject) {
      toast.error('Please select a project first');
      return;
    }

    // Determine the target folder ID
    let targetFolderId = folderId;
    if (folderId === 'all') {
      // If "all" is selected, use the first available folder
      if (currentProject?.folders && currentProject.folders.length > 0) {
        targetFolderId = currentProject.folders[0].id;
      } else {
        // If no folders exist, use a default folder ID (this should be handled by the backend)
        targetFolderId = 'default';
      }
    }

    if (!targetFolderId || targetFolderId === '') {
      toast.error('Unable to determine folder for script');
      return;
    }

    try {
      const newScript = await createScriptMutation.mutateAsync({
        projectId: activeProject,
        folderId: targetFolderId,
        title: 'New Script',
        content: '',
        metadata: {
          contentType: 'general',
          status: 'draft',
          tags: [],
        },
      });

      toast.success('New script created successfully');

      // Refetch scripts to update the list
      refetchScripts();

      // Automatically open the new script in the editor
      if (newScript) {
        setActiveScript(newScript);
        setViewMode('editor');
      }
    } catch (error) {
      console.error('Failed to create script:', error);
      toast.error('Failed to create new script. Please try again.');
    }
  };

  const handleScriptSelect = (script: ScriptBoard) => {
    const fullScript = scriptsData?.items?.find(s => s._id === script.id);
    if (fullScript) {
      setActiveScript(fullScript);
      setViewMode('editor');
    }
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

  const handleProjectChange = (projectId: string) => {
    setActiveProject(projectId);
    setActiveFolder('all');
  };

  // Show authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-muted-foreground">Please log in to access your projects and scripts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {viewMode === 'boards' && (
        <QueryWrapper
          isLoading={projectsLoading || scriptsLoading || currentProjectLoading}
          error={projectsError || scriptsError || currentProjectError}
          loadingMessage="Loading your projects and scripts..."
          onRetry={() => {
            refetchProjects();
            refetchScripts();
          }}
        >
          <MainContent
            scripts={filteredScripts}
            activeFolder={activeFolder}
            folders={folders}
            currentProject={currentProject}
            onScriptSelect={handleScriptSelect}
            onNewProject={handleNewProject}
            onFolderChange={setActiveFolder}
          />
        </QueryWrapper>
      )}

      {viewMode === 'editor' && activeScript && (
        <ScriptEditor
          script={convertScriptToScriptBoard(activeScript)}
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
          script={convertScriptToScriptBoard(activeScript)}
          onBack={handleBackToEditor}
        />
      )}
    </div>
  );
};

export default Studio;