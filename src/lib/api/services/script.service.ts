/**
 * Script API service
 */

import { apiClient } from '../client';
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
  PaginatedResponse,
} from '../types';

export class ScriptService {
  /**
   * Create a new script
   */
  async createScript(scriptData: CreateScriptRequest): Promise<Script> {
    const response = await apiClient.post<Script>('/scripts', scriptData);
    return response.data!;
  }

  /**
   * Get script by ID
   */
  async getScriptById(id: string): Promise<Script> {
    const response = await apiClient.get<Script>(`/scripts/${id}`);
    return response.data!;
  }

  /**
   * Get user's scripts with filtering and pagination
   */
  async getUserScripts(params?: ScriptQueryParams): Promise<PaginatedResponse<Script>> {
    const response = await apiClient.get<PaginatedResponse<Script>>('/scripts', params);
    return response.data!;
  }

  /**
   * Get scripts by project
   */
  async getProjectScripts(projectId: string, params?: ScriptQueryParams): Promise<PaginatedResponse<Script>> {
    const response = await apiClient.get<PaginatedResponse<Script>>(`/scripts/project/${projectId}`, params);
    return response.data!;
  }

  /**
   * Get scripts in a specific folder
   */
  async getFolderScripts(
    projectId: string,
    folderId: string,
    params?: ScriptQueryParams
  ): Promise<PaginatedResponse<Script>> {
    const response = await apiClient.get<PaginatedResponse<Script>>(
      `/scripts/project/${projectId}/folder/${folderId}`,
      params
    );
    return response.data!;
  }

  /**
   * Update script
   */
  async updateScript(id: string, updateData: UpdateScriptRequest): Promise<Script> {
    const response = await apiClient.put<Script>(`/scripts/${id}`, updateData);
    return response.data!;
  }

  /**
   * Update script content and create new version
   */
  async updateScriptContent(id: string, contentData: UpdateScriptContentRequest): Promise<Script> {
    const response = await apiClient.put<Script>(`/scripts/${id}/content`, contentData);
    return response.data!;
  }

  /**
   * Delete script
   */
  async deleteScript(id: string): Promise<void> {
    await apiClient.delete(`/scripts/${id}`);
  }

  /**
   * Move script to different project/folder
   */
  async moveScript(id: string, moveData: MoveScriptRequest): Promise<Script> {
    const response = await apiClient.put<Script>(`/scripts/${id}/move`, moveData);
    return response.data!;
  }

  /**
   * Search scripts
   */
  async searchScripts(params: SearchScriptParams): Promise<PaginatedResponse<Script>> {
    const response = await apiClient.get<PaginatedResponse<Script>>('/scripts/search', params);
    return response.data!;
  }

  /**
   * Get script version history
   */
  async getVersionHistory(id: string): Promise<ScriptVersion[]> {
    const response = await apiClient.get<ScriptVersion[]>(`/scripts/${id}/versions`);
    return response.data!;
  }

  /**
   * Revert script to a previous version
   */
  async revertToVersion(id: string, version: number): Promise<Script> {
    const response = await apiClient.post<Script>(`/scripts/${id}/revert`, { version });
    return response.data!;
  }

  /**
   * Bulk update script status
   */
  async bulkUpdateStatus(
    scriptIds: string[],
    status: 'draft' | 'review' | 'final' | 'published'
  ): Promise<{ updatedCount: number; totalRequested: number }> {
    const response = await apiClient.put<{ updatedCount: number; totalRequested: number }>(
      '/scripts/bulk-status',
      { scriptIds, status }
    );
    return response.data!;
  }

  /**
   * Get script statistics for the user
   */
  async getScriptStats(): Promise<ScriptStats> {
    const response = await apiClient.get<ScriptStats>('/scripts/stats');
    return response.data!;
  }

  /**
   * Get recent scripts for the user
   */
  async getRecentScripts(limit?: number): Promise<Script[]> {
    const params = limit ? { limit: limit.toString() } : undefined;
    const response = await apiClient.get<Script[]>('/scripts/recent', params);
    return response.data!;
  }
}

export const scriptService = new ScriptService();