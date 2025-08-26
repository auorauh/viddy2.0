/**
 * Project hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectService } from '@/lib/api';
import type {
  Project,
  FolderNode,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  ProjectQueryParams,
  ProjectStats,
} from '@/lib/api/types';

// Query keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (params?: ProjectQueryParams) => [...projectKeys.lists(), params] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
  stats: (id: string) => [...projectKeys.detail(id), 'stats'] as const,
  folders: (id: string) => [...projectKeys.detail(id), 'folders'] as const,
  recent: () => [...projectKeys.all, 'recent'] as const,
};

/**
 * Hook to get user projects with pagination and filtering
 */
export function useProjects(params?: ProjectQueryParams) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => projectService.getUserProjects(params),
  });
}

/**
 * Hook to get a specific project by ID
 */
export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => projectService.getProjectById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get project statistics
 */
export function useProjectStats(id: string) {
  return useQuery({
    queryKey: projectKeys.stats(id),
    queryFn: () => projectService.getProjectStats(id),
    enabled: !!id,
  });
}

/**
 * Hook to get project folders
 */
export function useProjectFolders(id: string) {
  return useQuery({
    queryKey: projectKeys.folders(id),
    queryFn: () => projectService.getProjectFolders(id),
    enabled: !!id,
  });
}

/**
 * Hook to get recent projects
 */
export function useRecentProjects(limit?: number) {
  return useQuery({
    queryKey: projectKeys.recent(),
    queryFn: () => projectService.getRecentProjects(limit),
  });
}

/**
 * Hook to search projects
 */
export function useSearchProjects(query: string, params?: ProjectQueryParams) {
  return useQuery({
    queryKey: [...projectKeys.lists(), 'search', query, params],
    queryFn: () => projectService.searchProjects(query, params),
    enabled: !!query.trim(),
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectData: CreateProjectRequest) => projectService.createProject(projectData),
    onSuccess: () => {
      // Invalidate project lists to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.recent() });
    },
  });
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectRequest }) =>
      projectService.updateProject(id, data),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject._id), updatedProject);
      // Invalidate project lists to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.recent() });
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => projectService.deleteProject(id),
    onSuccess: (_, id) => {
      // Remove the project from cache
      queryClient.removeQueries({ queryKey: projectKeys.detail(id) });
      // Invalidate project lists to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.invalidateQueries({ queryKey: projectKeys.recent() });
    },
  });
}

/**
 * Hook to create a folder in a project
 */
export function useCreateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: CreateFolderRequest }) =>
      projectService.createFolder(projectId, data),
    onSuccess: (_, { projectId }) => {
      // Invalidate project details and folders to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.folders(projectId) });
    },
  });
}

/**
 * Hook to update a folder
 */
export function useUpdateFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      folderId,
      data,
    }: {
      projectId: string;
      folderId: string;
      data: UpdateFolderRequest;
    }) => projectService.updateFolder(projectId, folderId, data),
    onSuccess: (_, { projectId }) => {
      // Invalidate project details and folders to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.folders(projectId) });
    },
  });
}

/**
 * Hook to delete a folder
 */
export function useDeleteFolder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, folderId }: { projectId: string; folderId: string }) =>
      projectService.deleteFolder(projectId, folderId),
    onSuccess: (_, { projectId }) => {
      // Invalidate project details and folders to refetch
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(projectId) });
      queryClient.invalidateQueries({ queryKey: projectKeys.folders(projectId) });
    },
  });
}

/**
 * Hook to share a project
 */
export function useShareProject() {
  return useMutation({
    mutationFn: ({
      projectId,
      data,
    }: {
      projectId: string;
      data: { userEmail: string; permission: string };
    }) => projectService.shareProject(projectId, data),
  });
}

/**
 * Hook to update collaboration settings
 */
export function useUpdateCollaborationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      projectId,
      settings,
    }: {
      projectId: string;
      settings: { allowCollaboration?: boolean; isPublic?: boolean };
    }) => projectService.updateCollaborationSettings(projectId, settings),
    onSuccess: (updatedProject) => {
      // Update the specific project in cache
      queryClient.setQueryData(projectKeys.detail(updatedProject._id), updatedProject);
    },
  });
}