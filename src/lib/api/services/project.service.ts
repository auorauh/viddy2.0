/**
 * Project API service
 */

import { apiClient } from "../client";
import type {
  Project,
  FolderNode,
  CreateProjectRequest,
  UpdateProjectRequest,
  CreateFolderRequest,
  UpdateFolderRequest,
  ProjectQueryParams,
  ProjectStats,
  PaginatedResponse,
} from "../types";

export class ProjectService {
  /**
   * Create a new project
   */
  async createProject(projectData: CreateProjectRequest): Promise<Project> {
    const response = await apiClient.post<Project>("/projects", projectData);
    if (!response || !response.data) {
      throw new Error("Invalid create project response from server");
    }
    return response.data;
  }

  /**
   * Get all projects for the authenticated user
   */
  async getUserProjects(params?: ProjectQueryParams): Promise<Project[]> {
    const response = await apiClient.get<{ projects: Project[]; total: number; page: number; limit: number }>("/projects", params);
    if (!response || !response.data) {
      throw new Error("Invalid get projects response from server");
    }

    // The backend returns { projects: Project[], total, page, limit }
    if (response.data.projects && Array.isArray(response.data.projects)) {
      return response.data.projects;
    }

    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error("Invalid get projects response format from server");
  }

  /**
   * Get a specific project by ID
   */
  async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    if (!response || !response.data) {
      throw new Error("Invalid get project response from server");
    }
    return response.data;
  }

  /**
   * Update a project
   */
  async updateProject(id: string, updateData: UpdateProjectRequest): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, updateData);
    if (!response || !response.data) {
      throw new Error("Invalid update project response from server");
    }
    return response.data;
  }

  /**
   * Delete a project
   */
  async deleteProject(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  }

  /**
   * Get project statistics
   */
  async getProjectStats(id: string): Promise<ProjectStats> {
    const response = await apiClient.get<ProjectStats>(`/projects/${id}/stats`);
    if (!response || !response.data) {
      throw new Error("Invalid project stats response from server");
    }
    return response.data;
  }

  /**
   * Get recent projects for the authenticated user
   */
  async getRecentProjects(limit?: number): Promise<Project[]> {
    const params = limit ? { limit: limit.toString() } : undefined;
    const response = await apiClient.get<Project[]>("/projects/recent", params);
    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid recent projects response from server");
    }
    return response.data;
  }

  /**
   * Search user projects
   */
  async searchProjects(query: string, params?: ProjectQueryParams): Promise<Project[]> {
    const searchParams = { ...params, search: query };
    const response = await apiClient.get<{ projects: Project[]; total: number; page: number; limit: number }>("/projects", searchParams);
    if (!response || !response.data) {
      throw new Error("Invalid search projects response from server");
    }

    // The backend returns { projects: Project[], total, page, limit }
    if (response.data.projects && Array.isArray(response.data.projects)) {
      return response.data.projects;
    }

    // Fallback for direct array response
    if (Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error("Invalid search projects response format from server");
  }

  /**
   * Create a new folder in a project
   */
  async createFolder(projectId: string, folderData: CreateFolderRequest): Promise<FolderNode> {
    const response = await apiClient.post<FolderNode>(`/projects/${projectId}/folders`, folderData);
    if (!response || !response.data) {
      throw new Error("Invalid create folder response from server");
    }
    return response.data;
  }

  /**
   * Update a folder in a project
   */
  async updateFolder(projectId: string, folderId: string, updateData: UpdateFolderRequest): Promise<FolderNode> {
    const response = await apiClient.put<FolderNode>(`/projects/${projectId}/folders/${folderId}`, updateData);
    if (!response || !response.data) {
      throw new Error("Invalid update folder response from server");
    }
    return response.data;
  }

  /**
   * Delete a folder from a project
   */
  async deleteFolder(projectId: string, folderId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/folders/${folderId}`);
  }

  /**
   * Get folder structure for a project
   */
  async getProjectFolders(projectId: string): Promise<FolderNode[]> {
    const response = await apiClient.get<FolderNode[]>(`/projects/${projectId}/folders`);
    if (!response || !response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid project folders response from server");
    }
    return response.data;
  }

  /**
   * Share a project with another user
   */
  async shareProject(
    projectId: string,
    shareData: { userEmail: string; permission: string },
  ): Promise<{ userEmail: string; permission: string; status: string }> {
    const response = await apiClient.post<{ userEmail: string; permission: string; status: string }>(`/projects/${projectId}/share`, shareData);
    if (!response || !response.data) {
      throw new Error("Invalid share project response from server");
    }
    return response.data;
  }

  /**
   * Update collaboration settings for a project
   */
  async updateCollaborationSettings(projectId: string, settings: { allowCollaboration?: boolean; isPublic?: boolean }): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${projectId}/collaboration`, settings);
    if (!response || !response.data) {
      throw new Error("Invalid collaboration settings response from server");
    }
    return response.data;
  }
}

export const projectService = new ProjectService();
