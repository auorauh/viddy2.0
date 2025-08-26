/**
 * Script hooks using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scriptService } from '@/lib/api';
import type {
  Script,
  ScriptVersion,
  CreateScriptRequest,
  UpdateScriptRequest,
  UpdateScriptContentRequest,
  MoveScriptRequest,
  ScriptQueryParams,
  SearchScriptParams,
  ScriptStats,
} from '@/lib/api/types';

// Query keys
export const scriptKeys = {
  all: ['scripts'] as const,
  lists: () => [...scriptKeys.all, 'list'] as const,
  list: (params?: ScriptQueryParams) => [...scriptKeys.lists(), params] as const,
  details: () => [...scriptKeys.all, 'detail'] as const,
  detail: (id: string) => [...scriptKeys.details(), id] as const,
  versions: (id: string) => [...scriptKeys.detail(id), 'versions'] as const,
  project: (projectId: string, params?: ScriptQueryParams) => 
    [...scriptKeys.all, 'project', projectId, params] as const,
  folder: (projectId: string, folderId: string, params?: ScriptQueryParams) => 
    [...scriptKeys.all, 'folder', projectId, folderId, params] as const,
  search: (params: SearchScriptParams) => [...scriptKeys.all, 'search', params] as const,
  stats: () => [...scriptKeys.all, 'stats'] as const,
  recent: () => [...scriptKeys.all, 'recent'] as const,
};

/**
 * Hook to get user scripts with pagination and filtering
 */
export function useScripts(params?: ScriptQueryParams) {
  return useQuery({
    queryKey: scriptKeys.list(params),
    queryFn: () => scriptService.getUserScripts(params),
  });
}

/**
 * Hook to get a specific script by ID
 */
export function useScript(id: string) {
  return useQuery({
    queryKey: scriptKeys.detail(id),
    queryFn: () => scriptService.getScriptById(id),
    enabled: !!id,
  });
}

/**
 * Hook to get scripts by project
 */
export function useProjectScripts(projectId: string, params?: ScriptQueryParams) {
  return useQuery({
    queryKey: scriptKeys.project(projectId, params),
    queryFn: () => scriptService.getProjectScripts(projectId, params),
    enabled: !!projectId,
  });
}

/**
 * Hook to get scripts in a specific folder
 */
export function useFolderScripts(
  projectId: string,
  folderId: string,
  params?: ScriptQueryParams
) {
  return useQuery({
    queryKey: scriptKeys.folder(projectId, folderId, params),
    queryFn: () => scriptService.getFolderScripts(projectId, folderId, params),
    enabled: !!projectId && !!folderId,
  });
}

/**
 * Hook to get script version history
 */
export function useScriptVersions(id: string) {
  return useQuery({
    queryKey: scriptKeys.versions(id),
    queryFn: () => scriptService.getVersionHistory(id),
    enabled: !!id,
  });
}

/**
 * Hook to search scripts
 */
export function useSearchScripts(params: SearchScriptParams) {
  return useQuery({
    queryKey: scriptKeys.search(params),
    queryFn: () => scriptService.searchScripts(params),
    enabled: !!params.q.trim(),
  });
}

/**
 * Hook to get script statistics
 */
export function useScriptStats() {
  return useQuery({
    queryKey: scriptKeys.stats(),
    queryFn: () => scriptService.getScriptStats(),
  });
}

/**
 * Hook to get recent scripts
 */
export function useRecentScripts(limit?: number) {
  return useQuery({
    queryKey: scriptKeys.recent(),
    queryFn: () => scriptService.getRecentScripts(limit),
  });
}

/**
 * Hook to create a new script
 */
export function useCreateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scriptData: CreateScriptRequest) => scriptService.createScript(scriptData),
    onSuccess: (newScript) => {
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: scriptKeys.project(newScript.projectId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: scriptKeys.folder(newScript.projectId, newScript.folderId) 
      });
      queryClient.invalidateQueries({ queryKey: scriptKeys.recent() });
      queryClient.invalidateQueries({ queryKey: scriptKeys.stats() });
    },
  });
}

/**
 * Hook to update a script
 */
export function useUpdateScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScriptRequest }) =>
      scriptService.updateScript(id, data),
    onSuccess: (updatedScript) => {
      // Update the specific script in cache
      queryClient.setQueryData(scriptKeys.detail(updatedScript._id), updatedScript);
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.lists() });
      queryClient.invalidateQueries({ 
        queryKey: scriptKeys.project(updatedScript.projectId) 
      });
      queryClient.invalidateQueries({ 
        queryKey: scriptKeys.folder(updatedScript.projectId, updatedScript.folderId) 
      });
    },
  });
}

/**
 * Hook to update script content
 */
export function useUpdateScriptContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScriptContentRequest }) =>
      scriptService.updateScriptContent(id, data),
    onSuccess: (updatedScript) => {
      // Update the specific script in cache
      queryClient.setQueryData(scriptKeys.detail(updatedScript._id), updatedScript);
      // Invalidate version history to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.versions(updatedScript._id) });
    },
  });
}

/**
 * Hook to delete a script
 */
export function useDeleteScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => scriptService.deleteScript(id),
    onSuccess: (_, id) => {
      // Remove the script from cache
      queryClient.removeQueries({ queryKey: scriptKeys.detail(id) });
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scriptKeys.all });
    },
  });
}

/**
 * Hook to move a script
 */
export function useMoveScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MoveScriptRequest }) =>
      scriptService.moveScript(id, data),
    onSuccess: (updatedScript) => {
      // Update the specific script in cache
      queryClient.setQueryData(scriptKeys.detail(updatedScript._id), updatedScript);
      // Invalidate relevant queries to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.lists() });
      queryClient.invalidateQueries({ queryKey: scriptKeys.all });
    },
  });
}

/**
 * Hook to revert script to a previous version
 */
export function useRevertScript() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) =>
      scriptService.revertToVersion(id, version),
    onSuccess: (updatedScript) => {
      // Update the specific script in cache
      queryClient.setQueryData(scriptKeys.detail(updatedScript._id), updatedScript);
      // Invalidate version history to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.versions(updatedScript._id) });
    },
  });
}

/**
 * Hook to bulk update script status
 */
export function useBulkUpdateScriptStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ 
      scriptIds, 
      status 
    }: { 
      scriptIds: string[]; 
      status: 'draft' | 'review' | 'final' | 'published' 
    }) => scriptService.bulkUpdateStatus(scriptIds, status),
    onSuccess: () => {
      // Invalidate all script queries to refetch
      queryClient.invalidateQueries({ queryKey: scriptKeys.all });
    },
  });
}