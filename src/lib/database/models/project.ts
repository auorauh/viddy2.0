import {ObjectId, Collection, Db} from "mongodb";
import {v4 as uuidv4} from "uuid";
import {Project, ProjectInput, ProjectUpdateInput, FolderNode} from "../types";
import {validateProject, validateCreateProjectInput, validateUpdateProjectInput, validateFolderHierarchy, findFolderById} from "../validation";
import {DatabaseError, ValidationError, NotFoundError} from "../errors";

export class ProjectModel {
  private collection: Collection<Project>;

  constructor(db: Db) {
    this.collection = db.collection<Project>("projects");
    this.ensureIndexes();
  }

  /**
   * Ensure proper indexes are created for the projects collection
   */
  private async ensureIndexes(): Promise<void> {
    const safeCreate = async (keys: any, options: any = {}) => {
      try {
        await this.collection.createIndex(keys, options);
      } catch (error: any) {
        if (error?.code === 85 || error?.codeName === "IndexOptionsConflict" || /Index already exists/i.test(error?.message || "")) {
          return; // silently ignore idempotent conflicts
        }
        console.warn("Failed to create project index:", error);
      }
    };

    // Compound index for user's projects sorted by update time
    await safeCreate({userId: 1, updatedAt: -1}, {name: "projects_by_user_updatedAt"});

    // Text index for project search - match existing name to avoid conflicts
    await safeCreate({title: "text", description: "text"}, {name: "projects_text_search"});

    // Index on userId for user's projects
    await safeCreate({userId: 1}, {name: "projects_by_user"});

    // Index on createdAt for sorting
    await safeCreate({createdAt: -1}, {name: "projects_by_createdAt"});
  }

  /**
   * Create a new project with default folder structure
   */
  async createProject(
    projectData: Omit<ProjectInput, "folders"> & {
      folders?: FolderNode[];
    },
  ): Promise<Project> {
    try {
      const now = new Date();

      // Create default folder structure if none provided
      const defaultFolders: FolderNode[] = projectData.folders || [
        {
          id: uuidv4(),
          name: "Scripts",
          scriptCount: 0,
          createdAt: now,
        },
      ];

      // Validate folder hierarchy
      if (!validateFolderHierarchy(defaultFolders)) {
        throw new ValidationError("Invalid folder hierarchy structure");
      }

      // Prepare project data with defaults
      const projectInput: ProjectInput = {
        userId: projectData.userId,
        title: projectData.title.trim(),
        description: projectData.description?.trim(),
        folders: defaultFolders,
        settings: projectData.settings || {
          isPublic: false,
          allowCollaboration: false,
        },
        stats: projectData.stats || {
          totalScripts: 0,
          lastActivity: now,
        },
      };

      // Validate input
      try {
        validateCreateProjectInput(projectInput);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Create project document
      const project: Project = {
        _id: new ObjectId(),
        ...projectInput,
        createdAt: now,
        updatedAt: now,
      };

      // Validate complete project object
      try {
        validateProject(project);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Insert into database
      const result = await this.collection.insertOne(project);

      if (!result.acknowledged) {
        throw new DatabaseError("Failed to create project");
      }

      return project;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Find project by ID
   */
  async findById(id: string | ObjectId): Promise<Project | null> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const project = await this.collection.findOne({_id: objectId});

      return project;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid project ID format");
      }
      throw new DatabaseError(`Failed to find project by ID: ${error.message}`);
    }
  }

  /**
   * Find projects by user ID
   */
  async findByUserId(
    userId: string | ObjectId,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: "createdAt" | "updatedAt" | "title";
      sortOrder?: 1 | -1;
    },
  ): Promise<Project[]> {
    try {
      const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;

      const {limit = 50, skip = 0, sortBy = "updatedAt", sortOrder = -1} = options || {};

      const projects = await this.collection
        .find({userId: objectId})
        .sort({[sortBy]: sortOrder})
        .skip(skip)
        .limit(limit)
        .toArray();

      return projects;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid user ID format");
      }
      throw new DatabaseError(`Failed to find projects by user ID: ${error.message}`);
    }
  }

  /**
   * Update project information
   */
  async updateProject(id: string | ObjectId, updateData: ProjectUpdateInput): Promise<Project> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      // Prepare update document
      const updateDoc: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Normalize title if provided
      if (updateDoc.title) {
        updateDoc.title = updateDoc.title.trim();
      }
      if (updateDoc.description) {
        updateDoc.description = updateDoc.description.trim();
      }

      // Validate folder hierarchy if folders are being updated
      if (updateDoc.folders && !validateFolderHierarchy(updateDoc.folders)) {
        throw new ValidationError("Invalid folder hierarchy structure");
      }

      // Validate update data
      try {
        validateUpdateProjectInput(updateDoc);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Update project
      const result = await this.collection.findOneAndUpdate({_id: objectId}, {$set: updateDoc}, {returnDocument: "after"});

      if (!result) {
        throw new NotFoundError("Project", objectId.toString());
      }

      return result;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError(`Failed to update project: ${error.message}`);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(id: string | ObjectId): Promise<void> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const result = await this.collection.deleteOne({_id: objectId});

      if (result.deletedCount === 0) {
        throw new NotFoundError("Project", objectId.toString());
      }
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Add a new folder to a project
   */
  async addFolder(projectId: string | ObjectId, folderName: string, parentId?: string): Promise<FolderNode> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      // Find the project
      const project = await this.findById(objectId);
      if (!project) {
        throw new NotFoundError("Project", objectId.toString());
      }

      // Create new folder
      const newFolder: FolderNode = {
        id: uuidv4(),
        name: folderName.trim(),
        ...(parentId && {parentId}), // Only set parentId if it's defined
        scriptCount: 0,
        createdAt: new Date(),
      };

      // Validate parent exists if specified
      if (parentId) {
        const parentFolder = findFolderById(project.folders, parentId);
        if (!parentFolder) {
          throw new ValidationError(`Parent folder with ID ${parentId} not found`);
        }
      }

      // Add folder to the appropriate location
      const updatedFolders = this.addFolderToHierarchy(project.folders, newFolder, parentId);

      // Validate the updated hierarchy
      if (!validateFolderHierarchy(updatedFolders)) {
        throw new ValidationError("Adding folder would create invalid hierarchy");
      }

      // Update project with new folder structure
      await this.collection.updateOne(
        {_id: objectId},
        {
          $set: {
            folders: updatedFolders,
            updatedAt: new Date(),
          },
        },
      );

      return newFolder;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to add folder: ${error.message}`);
    }
  }

  /**
   * Update folder information
   */
  async updateFolder(projectId: string | ObjectId, folderId: string, updates: {name?: string}): Promise<FolderNode> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      // Find the project
      const project = await this.findById(objectId);
      if (!project) {
        throw new NotFoundError("Project", objectId.toString());
      }

      // Find and update the folder
      const updatedFolders = this.updateFolderInHierarchy(project.folders, folderId, updates);
      const updatedFolder = findFolderById(updatedFolders, folderId);

      if (!updatedFolder) {
        throw new NotFoundError("Folder", folderId);
      }

      // Update project with modified folder structure
      await this.collection.updateOne(
        {_id: objectId},
        {
          $set: {
            folders: updatedFolders,
            updatedAt: new Date(),
          },
        },
      );

      return updatedFolder;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update folder: ${error.message}`);
    }
  }

  /**
   * Delete a folder and all its children
   */
  async deleteFolder(projectId: string | ObjectId, folderId: string): Promise<void> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      // Find the project
      const project = await this.findById(objectId);
      if (!project) {
        throw new NotFoundError("Project", objectId.toString());
      }

      // Check if folder exists
      const folderToDelete = findFolderById(project.folders, folderId);
      if (!folderToDelete) {
        throw new NotFoundError("Folder", folderId);
      }

      // Remove folder and all its children from hierarchy
      const updatedFolders = this.removeFolderFromHierarchy(project.folders, folderId);

      // Update project with modified folder structure
      await this.collection.updateOne(
        {_id: objectId},
        {
          $set: {
            folders: updatedFolders,
            updatedAt: new Date(),
          },
        },
      );
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete folder: ${error.message}`);
    }
  }

  /**
   * Update script count for a folder
   */
  async updateFolderScriptCount(projectId: string | ObjectId, folderId: string, delta: number): Promise<void> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      // Find the project
      const project = await this.findById(objectId);
      if (!project) {
        throw new NotFoundError("Project", objectId.toString());
      }

      // Update script count in folder hierarchy
      const updatedFolders = this.updateScriptCountInHierarchy(project.folders, folderId, delta);

      // Calculate total scripts
      const totalScripts = this.calculateTotalScripts(updatedFolders);

      // Update project
      await this.collection.updateOne(
        {_id: objectId},
        {
          $set: {
            folders: updatedFolders,
            "stats.totalScripts": totalScripts,
            "stats.lastActivity": new Date(),
            updatedAt: new Date(),
          },
        },
      );
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update folder script count: ${error.message}`);
    }
  }

  /**
   * Search projects by text
   */
  async searchProjects(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      limit?: number;
      skip?: number;
    },
  ): Promise<Project[]> {
    try {
      const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
      const {limit = 20, skip = 0} = options || {};

      const projects = await this.collection
        .find({
          userId: objectId,
          $text: {$search: searchText},
        })
        .sort({score: {$meta: "textScore"}})
        .skip(skip)
        .limit(limit)
        .toArray();

      return projects;
    } catch (error: any) {
      throw new DatabaseError(`Failed to search projects: ${error.message}`);
    }
  }

  // Private helper methods for folder hierarchy manipulation

  private addFolderToHierarchy(folders: FolderNode[], newFolder: FolderNode, parentId?: string): FolderNode[] {
    if (!parentId) {
      // Add to root level
      return [...folders, newFolder];
    }

    // Add to parent's children
    return folders.map((folder) => {
      if (folder.id === parentId) {
        return {
          ...folder,
          children: [...(folder.children || []), newFolder],
        };
      }

      if (folder.children) {
        return {
          ...folder,
          children: this.addFolderToHierarchy(folder.children, newFolder, parentId),
        };
      }

      return folder;
    });
  }

  private updateFolderInHierarchy(folders: FolderNode[], folderId: string, updates: {name?: string}): FolderNode[] {
    return folders.map((folder) => {
      if (folder.id === folderId) {
        return {
          ...folder,
          ...updates,
        };
      }

      if (folder.children) {
        return {
          ...folder,
          children: this.updateFolderInHierarchy(folder.children, folderId, updates),
        };
      }

      return folder;
    });
  }

  private removeFolderFromHierarchy(folders: FolderNode[], folderId: string): FolderNode[] {
    return folders
      .filter((folder) => folder.id !== folderId)
      .map((folder) => {
        if (folder.children) {
          return {
            ...folder,
            children: this.removeFolderFromHierarchy(folder.children, folderId),
          };
        }
        return folder;
      });
  }

  private updateScriptCountInHierarchy(folders: FolderNode[], folderId: string, delta: number): FolderNode[] {
    return folders.map((folder) => {
      if (folder.id === folderId) {
        return {
          ...folder,
          scriptCount: Math.max(0, folder.scriptCount + delta),
        };
      }

      if (folder.children) {
        return {
          ...folder,
          children: this.updateScriptCountInHierarchy(folder.children, folderId, delta),
        };
      }

      return folder;
    });
  }

  private calculateTotalScripts(folders: FolderNode[]): number {
    return folders.reduce((total, folder) => {
      let folderTotal = folder.scriptCount;
      if (folder.children) {
        folderTotal += this.calculateTotalScripts(folder.children);
      }
      return total + folderTotal;
    }, 0);
  }
}
