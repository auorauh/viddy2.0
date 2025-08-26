import {ObjectId, Collection, Db} from "mongodb";
import {Script, ScriptInput, ScriptUpdateInput, ScriptVersion, ContentType, ScriptStatus} from "../types";
import {validateScript, validateCreateScriptInput, validateUpdateScriptInput} from "../validation";
import {DatabaseError, ValidationError, NotFoundError} from "../errors";

export class ScriptModel {
  private collection: Collection<Script>;

  constructor(db: Db) {
    this.collection = db.collection<Script>("scripts");
    this.ensureIndexes();
  }

  /**
   * Ensure proper indexes are created for the scripts collection
   */
  private async ensureIndexes(): Promise<void> {
    const safeCreate = async (keys: any, options: any = {}) => {
      try {
        await this.collection.createIndex(keys, options);
      } catch (error: any) {
        if (error?.code === 85 || error?.codeName === "IndexOptionsConflict" || /Index already exists/i.test(error?.message || "")) {
          return;
        }
        console.warn("Failed to create script index:", error);
      }
    };

    // Compound index for user's scripts sorted by update time
    await safeCreate({userId: 1, updatedAt: -1}, {name: "scripts_by_user_updatedAt"});

    // Compound index for project/folder contents
    await safeCreate({userId: 1, projectId: 1, folderId: 1}, {name: "scripts_by_user_project_folder"});

    // Text index for script search (use stable name to avoid conflicts)
    await safeCreate({title: "text", content: "text"}, {name: "scripts_text_search"});

    // Index on projectId for project queries
    await safeCreate({projectId: 1}, {name: "scripts_by_project"});

    // Index on metadata.status for status filtering
    await safeCreate({"metadata.status": 1}, {name: "scripts_by_status"});

    // Index on metadata.contentType for content type filtering
    await safeCreate({"metadata.contentType": 1}, {name: "scripts_by_contentType"});

    // Index on createdAt for sorting
    await safeCreate({createdAt: -1}, {name: "scripts_by_createdAt"});
  }

  /**
   * Create a new script with initial version
   */
  async createScript(scriptData: ScriptInput): Promise<Script> {
    try {
      const now = new Date();

      // Prepare script data with defaults
      const scriptInput: ScriptInput = {
        userId: scriptData.userId,
        projectId: scriptData.projectId,
        folderId: scriptData.folderId,
        title: scriptData.title.trim(),
        content: scriptData.content,
        metadata: {
          contentType: scriptData.metadata.contentType,
          duration: scriptData.metadata.duration,
          tags: scriptData.metadata.tags || [],
          status: scriptData.metadata.status || ScriptStatus.DRAFT,
        },
        versions: scriptData.versions || [],
      };

      // Validate input
      try {
        validateCreateScriptInput(scriptInput);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Create initial version if no versions provided
      const initialVersion: ScriptVersion = {
        version: 1,
        content: scriptInput.content,
        createdAt: now,
      };

      // Create script document
      const script: Script = {
        _id: new ObjectId(),
        ...scriptInput,
        versions: scriptInput.versions.length > 0 ? scriptInput.versions : [initialVersion],
        createdAt: now,
        updatedAt: now,
      };

      // Validate complete script object
      try {
        validateScript(script);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Insert into database
      const result = await this.collection.insertOne(script);

      if (!result.acknowledged) {
        throw new DatabaseError("Failed to create script");
      }

      return script;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new DatabaseError(`Failed to create script: ${error.message}`);
    }
  }

  /**
   * Find script by ID
   */
  async findById(id: string | ObjectId): Promise<Script | null> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const script = await this.collection.findOne({_id: objectId});

      return script;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid script ID format");
      }
      throw new DatabaseError(`Failed to find script by ID: ${error.message}`);
    }
  }

  /**
   * Find scripts by user ID
   */
  async findByUserId(
    userId: string | ObjectId,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: "createdAt" | "updatedAt" | "title";
      sortOrder?: 1 | -1;
      status?: ScriptStatus;
      contentType?: ContentType;
    },
  ): Promise<Script[]> {
    try {
      const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;

      const {limit = 50, skip = 0, sortBy = "updatedAt", sortOrder = -1, status, contentType} = options || {};

      // Build filter
      const filter: any = {userId: objectId};
      if (status) {
        filter["metadata.status"] = status;
      }
      if (contentType) {
        filter["metadata.contentType"] = contentType;
      }

      const scripts = await this.collection
        .find(filter)
        .sort({[sortBy]: sortOrder})
        .skip(skip)
        .limit(limit)
        .toArray();

      return scripts;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid user ID format");
      }
      throw new DatabaseError(`Failed to find scripts by user ID: ${error.message}`);
    }
  }

  /**
   * Find scripts by project ID
   */
  async findByProjectId(
    projectId: string | ObjectId,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: "createdAt" | "updatedAt" | "title";
      sortOrder?: 1 | -1;
      folderId?: string;
    },
  ): Promise<Script[]> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      const {limit = 50, skip = 0, sortBy = "updatedAt", sortOrder = -1, folderId} = options || {};

      // Build filter
      const filter: any = {projectId: objectId};
      if (folderId) {
        filter.folderId = folderId;
      }

      const scripts = await this.collection
        .find(filter)
        .sort({[sortBy]: sortOrder})
        .skip(skip)
        .limit(limit)
        .toArray();

      return scripts;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid project ID format");
      }
      throw new DatabaseError(`Failed to find scripts by project ID: ${error.message}`);
    }
  }

  /**
   * Find scripts by folder ID
   */
  async findByFolderId(
    projectId: string | ObjectId,
    folderId: string,
    options?: {
      limit?: number;
      skip?: number;
      sortBy?: "createdAt" | "updatedAt" | "title";
      sortOrder?: 1 | -1;
    },
  ): Promise<Script[]> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      const {limit = 50, skip = 0, sortBy = "updatedAt", sortOrder = -1} = options || {};

      const scripts = await this.collection
        .find({
          projectId: objectId,
          folderId: folderId,
        })
        .sort({[sortBy]: sortOrder})
        .skip(skip)
        .limit(limit)
        .toArray();

      return scripts;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid project ID format");
      }
      throw new DatabaseError(`Failed to find scripts by folder ID: ${error.message}`);
    }
  }
  /*
   *
   * Update script information
   */
  async updateScript(id: string | ObjectId, updateData: ScriptUpdateInput): Promise<Script> {
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

      // Validate update data
      try {
        validateUpdateScriptInput(updateDoc);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Update script
      const result = await this.collection.findOneAndUpdate({_id: objectId}, {$set: updateDoc}, {returnDocument: "after"});

      if (!result) {
        throw new NotFoundError("Script", objectId.toString());
      }

      return result;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError(`Failed to update script: ${error.message}`);
    }
  }

  /**
   * Update script content and create new version
   */
  async updateScriptContent(id: string | ObjectId, newContent: string, updateMetadata?: Partial<ScriptUpdateInput["metadata"]>): Promise<Script> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      // Find current script to get version info
      const currentScript = await this.findById(objectId);
      if (!currentScript) {
        throw new NotFoundError("Script", objectId.toString());
      }

      // Create new version
      const nextVersion = Math.max(...currentScript.versions.map((v) => v.version)) + 1;
      const newVersion: ScriptVersion = {
        version: nextVersion,
        content: newContent,
        createdAt: new Date(),
      };

      // Prepare update document
      const setDoc: any = {
        content: newContent,
        updatedAt: new Date(),
      };

      // Update metadata if provided
      if (updateMetadata) {
        Object.keys(updateMetadata).forEach((key) => {
          setDoc[`metadata.${key}`] = updateMetadata[key as keyof typeof updateMetadata];
        });
      }

      // Update script with new version
      const result = await this.collection.findOneAndUpdate(
        {_id: objectId},
        {
          $set: setDoc,
          $push: {versions: newVersion},
        },
        {returnDocument: "after"},
      );

      if (!result) {
        throw new NotFoundError("Script", objectId.toString());
      }

      return result;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError(`Failed to update script content: ${error.message}`);
    }
  }

  /**
   * Revert script to a previous version
   */
  async revertToVersion(id: string | ObjectId, version: number): Promise<Script> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      // Find current script
      const currentScript = await this.findById(objectId);
      if (!currentScript) {
        throw new NotFoundError("Script", objectId.toString());
      }

      // Find the target version
      const targetVersion = currentScript.versions.find((v) => v.version === version);
      if (!targetVersion) {
        throw new ValidationError(`Version ${version} not found`);
      }

      // Create new version based on target version
      const nextVersion = Math.max(...currentScript.versions.map((v) => v.version)) + 1;
      const revertVersion: ScriptVersion = {
        version: nextVersion,
        content: targetVersion.content,
        createdAt: new Date(),
      };

      // Update script with reverted content
      const result = await this.collection.findOneAndUpdate(
        {_id: objectId},
        {
          $set: {
            content: targetVersion.content,
            updatedAt: new Date(),
          },
          $push: {versions: revertVersion},
        },
        {returnDocument: "after"},
      );

      if (!result) {
        throw new NotFoundError("Script", objectId.toString());
      }

      return result;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }

      throw new DatabaseError(`Failed to revert script to version: ${error.message}`);
    }
  }

  /**
   * Delete script
   */
  async deleteScript(id: string | ObjectId): Promise<void> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const result = await this.collection.deleteOne({_id: objectId});

      if (result.deletedCount === 0) {
        throw new NotFoundError("Script", objectId.toString());
      }
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete script: ${error.message}`);
    }
  }

  /**
   * Move script to different project/folder
   */
  async moveScript(id: string | ObjectId, newProjectId: string | ObjectId, newFolderId: string): Promise<Script> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;
      const newProjectObjectId = typeof newProjectId === "string" ? new ObjectId(newProjectId) : newProjectId;

      const result = await this.collection.findOneAndUpdate(
        {_id: objectId},
        {
          $set: {
            projectId: newProjectObjectId,
            folderId: newFolderId,
            updatedAt: new Date(),
          },
        },
        {returnDocument: "after"},
      );

      if (!result) {
        throw new NotFoundError("Script", objectId.toString());
      }

      return result;
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to move script: ${error.message}`);
    }
  }

  /**
   * Search scripts by text
   */
  async searchScripts(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      limit?: number;
      skip?: number;
      projectId?: string | ObjectId;
      status?: ScriptStatus;
      contentType?: ContentType;
    },
  ): Promise<Script[]> {
    try {
      const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;
      const {limit = 20, skip = 0, projectId, status, contentType} = options || {};

      // Build filter
      const filter: any = {
        userId: objectId,
        $text: {$search: searchText},
      };

      if (projectId) {
        const projectObjectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;
        filter.projectId = projectObjectId;
      }

      if (status) {
        filter["metadata.status"] = status;
      }

      if (contentType) {
        filter["metadata.contentType"] = contentType;
      }

      const scripts = await this.collection
        .find(filter)
        .sort({score: {$meta: "textScore"}})
        .skip(skip)
        .limit(limit)
        .toArray();

      return scripts;
    } catch (error: any) {
      throw new DatabaseError(`Failed to search scripts: ${error.message}`);
    }
  }

  /**
   * Get script statistics for a user
   */
  async getScriptStats(userId: string | ObjectId): Promise<{
    totalScripts: number;
    scriptsByStatus: Record<ScriptStatus, number>;
    scriptsByContentType: Record<ContentType, number>;
    recentActivity: Date | null;
  }> {
    try {
      const objectId = typeof userId === "string" ? new ObjectId(userId) : userId;

      const pipeline = [
        {$match: {userId: objectId}},
        {
          $group: {
            _id: null,
            totalScripts: {$sum: 1},
            statusCounts: {
              $push: "$metadata.status",
            },
            contentTypeCounts: {
              $push: "$metadata.contentType",
            },
            lastActivity: {$max: "$updatedAt"},
          },
        },
      ];

      const result = await this.collection.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return {
          totalScripts: 0,
          scriptsByStatus: {
            [ScriptStatus.DRAFT]: 0,
            [ScriptStatus.REVIEW]: 0,
            [ScriptStatus.FINAL]: 0,
            [ScriptStatus.PUBLISHED]: 0,
          },
          scriptsByContentType: {
            [ContentType.TIKTOK]: 0,
            [ContentType.INSTAGRAM]: 0,
            [ContentType.YOUTUBE]: 0,
            [ContentType.GENERAL]: 0,
          },
          recentActivity: null,
        };
      }

      const stats = result[0];

      // Count by status
      const scriptsByStatus = Object.values(ScriptStatus).reduce((acc, status) => {
        acc[status] = stats.statusCounts.filter((s: ScriptStatus) => s === status).length;
        return acc;
      }, {} as Record<ScriptStatus, number>);

      // Count by content type
      const scriptsByContentType = Object.values(ContentType).reduce((acc, type) => {
        acc[type] = stats.contentTypeCounts.filter((t: ContentType) => t === type).length;
        return acc;
      }, {} as Record<ContentType, number>);

      return {
        totalScripts: stats.totalScripts,
        scriptsByStatus,
        scriptsByContentType,
        recentActivity: stats.lastActivity,
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to get script stats: ${error.message}`);
    }
  }

  /**
   * Get version history for a script
   */
  async getVersionHistory(id: string | ObjectId): Promise<ScriptVersion[]> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const script = await this.collection.findOne({_id: objectId}, {projection: {versions: 1}});

      if (!script) {
        throw new NotFoundError("Script", objectId.toString());
      }

      return script.versions.sort((a, b) => b.version - a.version);
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to get version history: ${error.message}`);
    }
  }

  /**
   * Count scripts in a folder
   */
  async countScriptsInFolder(projectId: string | ObjectId, folderId: string): Promise<number> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      const count = await this.collection.countDocuments({
        projectId: objectId,
        folderId: folderId,
      });

      return count;
    } catch (error: any) {
      throw new DatabaseError(`Failed to count scripts in folder: ${error.message}`);
    }
  }

  /**
   * Delete all scripts in a project (used when project is deleted)
   */
  async deleteScriptsByProjectId(projectId: string | ObjectId): Promise<number> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      const result = await this.collection.deleteMany({projectId: objectId});

      return result.deletedCount || 0;
    } catch (error: any) {
      throw new DatabaseError(`Failed to delete scripts by project ID: ${error.message}`);
    }
  }

  /**
   * Delete all scripts in a folder (used when folder is deleted)
   */
  async deleteScriptsByFolderId(projectId: string | ObjectId, folderId: string): Promise<number> {
    try {
      const objectId = typeof projectId === "string" ? new ObjectId(projectId) : projectId;

      const result = await this.collection.deleteMany({
        projectId: objectId,
        folderId: folderId,
      });

      return result.deletedCount || 0;
    } catch (error: any) {
      throw new DatabaseError(`Failed to delete scripts by folder ID: ${error.message}`);
    }
  }
}
