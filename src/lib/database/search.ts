import { ObjectId, Db, Collection } from 'mongodb';
import { Script, Project, User, ContentType, ScriptStatus } from './types';
import { DatabaseError, ValidationError } from './errors';

/**
 * Advanced search and aggregation service for MongoDB operations
 * Provides optimized search functionality and user statistics
 */
export class SearchService {
  private db: Db;
  private scriptsCollection: Collection<Script>;
  private projectsCollection: Collection<Project>;
  private usersCollection: Collection<User>;

  constructor(db: Db) {
    this.db = db;
    this.scriptsCollection = db.collection<Script>('scripts');
    this.projectsCollection = db.collection<Project>('projects');
    this.usersCollection = db.collection<User>('users');
    this.ensureSearchIndexes();
  }

  /**
   * Ensure search-optimized indexes are created
   */
  private async ensureSearchIndexes(): Promise<void> {
    try {
      // Enhanced text search indexes with weights
      await this.scriptsCollection.createIndex(
        { 
          title: 'text', 
          content: 'text',
          'metadata.tags': 'text'
        },
        {
          weights: {
            title: 10,
            content: 5,
            'metadata.tags': 3
          },
          name: 'script_text_search'
        }
      );

      await this.projectsCollection.createIndex(
        { 
          title: 'text', 
          description: 'text' 
        },
        {
          weights: {
            title: 10,
            description: 5
          },
          name: 'project_text_search'
        }
      );

      // Compound indexes for efficient filtering and sorting
      await this.scriptsCollection.createIndex(
        { userId: 1, 'metadata.status': 1, updatedAt: -1 },
        { name: 'user_status_updated' }
      );

      await this.scriptsCollection.createIndex(
        { userId: 1, 'metadata.contentType': 1, updatedAt: -1 },
        { name: 'user_contenttype_updated' }
      );

      await this.scriptsCollection.createIndex(
        { projectId: 1, folderId: 1, updatedAt: -1 },
        { name: 'project_folder_updated' }
      );

      // Aggregation-optimized indexes
      await this.scriptsCollection.createIndex(
        { userId: 1, createdAt: 1 },
        { name: 'user_created_agg' }
      );

      await this.projectsCollection.createIndex(
        { userId: 1, 'stats.lastActivity': -1 },
        { name: 'user_activity_agg' }
      );

    } catch (error) {
      console.warn('Failed to create search indexes:', error);
    }
  }

  /**
   * Advanced text search across scripts and projects
   */
  async globalSearch(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      limit?: number;
      skip?: number;
      includeScripts?: boolean;
      includeProjects?: boolean;
      contentType?: ContentType;
      status?: ScriptStatus;
      projectId?: string | ObjectId;
    }
  ): Promise<{
    scripts: Script[];
    projects: Project[];
    totalResults: number;
  }> {
    try {
      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const {
        limit = 20,
        skip = 0,
        includeScripts = true,
        includeProjects = true,
        contentType,
        status,
        projectId
      } = options || {};

      const results = await Promise.all([
        // Search scripts if enabled
        includeScripts ? this.searchScriptsAdvanced(userObjectId, searchText, {
          limit: Math.ceil(limit / 2),
          skip,
          contentType,
          status,
          projectId
        }) : Promise.resolve([]),
        
        // Search projects if enabled
        includeProjects ? this.searchProjectsAdvanced(userObjectId, searchText, {
          limit: Math.ceil(limit / 2),
          skip
        }) : Promise.resolve([])
      ]);

      const [scripts, projects] = results;
      
      return {
        scripts,
        projects,
        totalResults: scripts.length + projects.length
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to perform global search: ${error.message}`);
    }
  }

  /**
   * Advanced script search with multiple filters and scoring
   */
  async searchScriptsAdvanced(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      limit?: number;
      skip?: number;
      contentType?: ContentType;
      status?: ScriptStatus;
      projectId?: string | ObjectId;
      dateRange?: { start: Date; end: Date };
      tags?: string[];
    }
  ): Promise<Script[]> {
    try {
      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const {
        limit = 20,
        skip = 0,
        contentType,
        status,
        projectId,
        dateRange,
        tags
      } = options || {};

      // Build aggregation pipeline
      const pipeline: any[] = [
        // Match user and text search
        {
          $match: {
            userId: userObjectId,
            $text: { $search: searchText }
          }
        },
        
        // Add text score for sorting
        {
          $addFields: {
            textScore: { $meta: 'textScore' }
          }
        }
      ];

      // Add additional filters
      const additionalFilters: any = {};
      
      if (contentType) {
        additionalFilters['metadata.contentType'] = contentType;
      }
      
      if (status) {
        additionalFilters['metadata.status'] = status;
      }
      
      if (projectId) {
        const projectObjectId = typeof projectId === 'string' ? new ObjectId(projectId) : projectId;
        additionalFilters.projectId = projectObjectId;
      }
      
      if (dateRange) {
        additionalFilters.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }
      
      if (tags && tags.length > 0) {
        additionalFilters['metadata.tags'] = { $in: tags };
      }

      if (Object.keys(additionalFilters).length > 0) {
        pipeline.push({ $match: additionalFilters });
      }

      // Sort by text score and recency
      pipeline.push({
        $sort: {
          textScore: -1,
          updatedAt: -1
        }
      });

      // Pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      const scripts = await this.scriptsCollection.aggregate(pipeline).toArray();
      return scripts;
    } catch (error: any) {
      throw new DatabaseError(`Failed to search scripts: ${error.message}`);
    }
  }

  /**
   * Advanced project search with scoring
   */
  async searchProjectsAdvanced(
    userId: string | ObjectId,
    searchText: string,
    options?: {
      limit?: number;
      skip?: number;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<Project[]> {
    try {
      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const { limit = 20, skip = 0, dateRange } = options || {};

      const pipeline: any[] = [
        {
          $match: {
            userId: userObjectId,
            $text: { $search: searchText }
          }
        },
        {
          $addFields: {
            textScore: { $meta: 'textScore' }
          }
        }
      ];

      if (dateRange) {
        pipeline.push({
          $match: {
            createdAt: {
              $gte: dateRange.start,
              $lte: dateRange.end
            }
          }
        });
      }

      pipeline.push(
        {
          $sort: {
            textScore: -1,
            'stats.lastActivity': -1
          }
        },
        { $skip: skip },
        { $limit: limit }
      );

      const projects = await this.projectsCollection.aggregate(pipeline).toArray();
      return projects;
    } catch (error: any) {
      throw new DatabaseError(`Failed to search projects: ${error.message}`);
    }
  }  /*
*
   * Get comprehensive user statistics using aggregation pipelines
   */
  async getUserStatistics(userId: string | ObjectId): Promise<{
    overview: {
      totalProjects: number;
      totalScripts: number;
      totalFolders: number;
      recentActivity: Date | null;
    };
    scriptStats: {
      byStatus: Record<ScriptStatus, number>;
      byContentType: Record<ContentType, number>;
      byMonth: Array<{ month: string; count: number }>;
      averagePerProject: number;
    };
    projectStats: {
      averageFoldersPerProject: number;
      averageScriptsPerProject: number;
      mostActiveProject: { projectId: ObjectId; title: string; scriptCount: number } | null;
      recentProjects: Array<{ projectId: ObjectId; title: string; lastActivity: Date }>;
    };
    activityStats: {
      scriptsCreatedLast30Days: number;
      projectsCreatedLast30Days: number;
      dailyActivity: Array<{ date: string; scripts: number; projects: number }>;
    };
  }> {
    try {
      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Run multiple aggregation pipelines in parallel
      const [
        overviewStats,
        scriptStatusStats,
        scriptContentTypeStats,
        scriptMonthlyStats,
        projectStats,
        recentActivity,
        dailyActivityStats
      ] = await Promise.all([
        this.getOverviewStats(userObjectId),
        this.getScriptStatusStats(userObjectId),
        this.getScriptContentTypeStats(userObjectId),
        this.getScriptMonthlyStats(userObjectId),
        this.getProjectStats(userObjectId),
        this.getRecentActivityStats(userObjectId, thirtyDaysAgo),
        this.getDailyActivityStats(userObjectId, thirtyDaysAgo)
      ]);

      return {
        overview: overviewStats,
        scriptStats: {
          byStatus: scriptStatusStats,
          byContentType: scriptContentTypeStats,
          byMonth: scriptMonthlyStats,
          averagePerProject: overviewStats.totalProjects > 0 
            ? Math.round((overviewStats.totalScripts / overviewStats.totalProjects) * 100) / 100
            : 0
        },
        projectStats: projectStats,
        activityStats: {
          scriptsCreatedLast30Days: recentActivity.scriptsCreated,
          projectsCreatedLast30Days: recentActivity.projectsCreated,
          dailyActivity: dailyActivityStats
        }
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to get user statistics: ${error.message}`);
    }
  }

  /**
   * Get folder statistics for a project using aggregation
   */
  async getProjectFolderStats(projectId: string | ObjectId): Promise<{
    totalFolders: number;
    folderDepth: number;
    scriptsPerFolder: Array<{ folderId: string; folderName: string; scriptCount: number }>;
    emptyFolders: Array<{ folderId: string; folderName: string }>;
  }> {
    try {
      const projectObjectId = typeof projectId === 'string' ? new ObjectId(projectId) : projectId;

      // Get project to access folder structure
      const project = await this.projectsCollection.findOne({ _id: projectObjectId });
      if (!project) {
        throw new ValidationError('Project not found');
      }

      // Get script counts per folder using aggregation
      const scriptCounts = await this.scriptsCollection.aggregate([
        { $match: { projectId: projectObjectId } },
        {
          $group: {
            _id: '$folderId',
            count: { $sum: 1 }
          }
        }
      ]).toArray();

      const scriptCountMap = new Map(
        scriptCounts.map(item => [item._id, item.count])
      );

      // Analyze folder structure
      const folderStats = this.analyzeFolderStructure(project.folders, scriptCountMap);

      return folderStats;
    } catch (error: any) {
      throw new DatabaseError(`Failed to get project folder stats: ${error.message}`);
    }
  }

  /**
   * Get search suggestions based on user's content
   */
  async getSearchSuggestions(
    userId: string | ObjectId,
    partialText: string,
    limit: number = 10
  ): Promise<{
    scriptTitles: string[];
    projectTitles: string[];
    tags: string[];
  }> {
    try {
      const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;
      const regex = new RegExp(partialText, 'i');

      const [scriptSuggestions, projectSuggestions, tagSuggestions] = await Promise.all([
        // Script title suggestions
        this.scriptsCollection.aggregate([
          { $match: { userId: userObjectId, title: regex } },
          { $group: { _id: '$title' } },
          { $limit: limit },
          { $project: { _id: 0, title: '$_id' } }
        ]).toArray(),

        // Project title suggestions
        this.projectsCollection.aggregate([
          { $match: { userId: userObjectId, title: regex } },
          { $group: { _id: '$title' } },
          { $limit: limit },
          { $project: { _id: 0, title: '$_id' } }
        ]).toArray(),

        // Tag suggestions
        this.scriptsCollection.aggregate([
          { $match: { userId: userObjectId } },
          { $unwind: '$metadata.tags' },
          { $match: { 'metadata.tags': regex } },
          { $group: { _id: '$metadata.tags' } },
          { $limit: limit },
          { $project: { _id: 0, tag: '$_id' } }
        ]).toArray()
      ]);

      return {
        scriptTitles: scriptSuggestions.map(s => s.title),
        projectTitles: projectSuggestions.map(p => p.title),
        tags: tagSuggestions.map(t => t.tag)
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to get search suggestions: ${error.message}`);
    }
  }

  // Private helper methods for aggregation pipelines

  private async getOverviewStats(userId: ObjectId): Promise<{
    totalProjects: number;
    totalScripts: number;
    totalFolders: number;
    recentActivity: Date | null;
  }> {
    const [projectCount, scriptCount, projectsWithFolders, lastActivity] = await Promise.all([
      this.projectsCollection.countDocuments({ userId }),
      this.scriptsCollection.countDocuments({ userId }),
      this.projectsCollection.aggregate([
        { $match: { userId } },
        { $project: { folderCount: { $size: '$folders' } } },
        { $group: { _id: null, totalFolders: { $sum: '$folderCount' } } }
      ]).toArray(),
      this.scriptsCollection.findOne(
        { userId },
        { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } }
      )
    ]);

    return {
      totalProjects: projectCount,
      totalScripts: scriptCount,
      totalFolders: projectsWithFolders[0]?.totalFolders || 0,
      recentActivity: lastActivity?.updatedAt || null
    };
  }

  private async getScriptStatusStats(userId: ObjectId): Promise<Record<ScriptStatus, number>> {
    const statusStats = await this.scriptsCollection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$metadata.status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const result: Record<ScriptStatus, number> = {
      [ScriptStatus.DRAFT]: 0,
      [ScriptStatus.REVIEW]: 0,
      [ScriptStatus.FINAL]: 0,
      [ScriptStatus.PUBLISHED]: 0
    };

    statusStats.forEach(stat => {
      if (stat._id in result) {
        result[stat._id as ScriptStatus] = stat.count;
      }
    });

    return result;
  }

  private async getScriptContentTypeStats(userId: ObjectId): Promise<Record<ContentType, number>> {
    const contentTypeStats = await this.scriptsCollection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$metadata.contentType',
          count: { $sum: 1 }
        }
      }
    ]).toArray();

    const result: Record<ContentType, number> = {
      [ContentType.TIKTOK]: 0,
      [ContentType.INSTAGRAM]: 0,
      [ContentType.YOUTUBE]: 0,
      [ContentType.GENERAL]: 0
    };

    contentTypeStats.forEach(stat => {
      if (stat._id in result) {
        result[stat._id as ContentType] = stat.count;
      }
    });

    return result;
  }

  private async getScriptMonthlyStats(userId: ObjectId): Promise<Array<{ month: string; count: number }>> {
    const monthlyStats = await this.scriptsCollection.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': -1, '_id.month': -1 }
      },
      { $limit: 12 }
    ]).toArray();

    return monthlyStats.map(stat => ({
      month: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      count: stat.count
    }));
  }

  private async getProjectStats(userId: ObjectId): Promise<{
    averageFoldersPerProject: number;
    averageScriptsPerProject: number;
    mostActiveProject: { projectId: ObjectId; title: string; scriptCount: number } | null;
    recentProjects: Array<{ projectId: ObjectId; title: string; lastActivity: Date }>;
  }> {
    const [folderStats, scriptStats, mostActive, recent] = await Promise.all([
      // Average folders per project
      this.projectsCollection.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            avgFolders: { $avg: { $size: '$folders' } }
          }
        }
      ]).toArray(),

      // Average scripts per project
      this.projectsCollection.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            avgScripts: { $avg: '$stats.totalScripts' }
          }
        }
      ]).toArray(),

      // Most active project
      this.projectsCollection.findOne(
        { userId },
        { sort: { 'stats.totalScripts': -1 }, projection: { title: 1, 'stats.totalScripts': 1 } }
      ),

      // Recent projects
      this.projectsCollection.find(
        { userId },
        { 
          sort: { 'stats.lastActivity': -1 }, 
          limit: 5,
          projection: { title: 1, 'stats.lastActivity': 1 }
        }
      ).toArray()
    ]);

    return {
      averageFoldersPerProject: Math.round((folderStats[0]?.avgFolders || 0) * 100) / 100,
      averageScriptsPerProject: Math.round((scriptStats[0]?.avgScripts || 0) * 100) / 100,
      mostActiveProject: mostActive ? {
        projectId: mostActive._id,
        title: mostActive.title,
        scriptCount: mostActive.stats.totalScripts
      } : null,
      recentProjects: recent.map(p => ({
        projectId: p._id,
        title: p.title,
        lastActivity: p.stats.lastActivity
      }))
    };
  }

  private async getRecentActivityStats(userId: ObjectId, since: Date): Promise<{
    scriptsCreated: number;
    projectsCreated: number;
  }> {
    const [scriptsCreated, projectsCreated] = await Promise.all([
      this.scriptsCollection.countDocuments({
        userId,
        createdAt: { $gte: since }
      }),
      this.projectsCollection.countDocuments({
        userId,
        createdAt: { $gte: since }
      })
    ]);

    return { scriptsCreated, projectsCreated };
  }

  private async getDailyActivityStats(userId: ObjectId, since: Date): Promise<Array<{
    date: string;
    scripts: number;
    projects: number;
  }>> {
    const [scriptActivity, projectActivity] = await Promise.all([
      this.scriptsCollection.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]).toArray(),

      this.projectsCollection.aggregate([
        {
          $match: {
            userId,
            createdAt: { $gte: since }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        }
      ]).toArray()
    ]);

    // Merge the results by date
    const activityMap = new Map<string, { scripts: number; projects: number }>();
    
    scriptActivity.forEach(item => {
      activityMap.set(item._id, { scripts: item.count, projects: 0 });
    });

    projectActivity.forEach(item => {
      const existing = activityMap.get(item._id) || { scripts: 0, projects: 0 };
      activityMap.set(item._id, { ...existing, projects: item.count });
    });

    return Array.from(activityMap.entries())
      .map(([date, activity]) => ({ date, ...activity }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private analyzeFolderStructure(
    folders: any[],
    scriptCountMap: Map<string, number>,
    depth: number = 0
  ): {
    totalFolders: number;
    folderDepth: number;
    scriptsPerFolder: Array<{ folderId: string; folderName: string; scriptCount: number }>;
    emptyFolders: Array<{ folderId: string; folderName: string }>;
  } {
    let totalFolders = folders.length;
    let maxDepth = depth;
    const scriptsPerFolder: Array<{ folderId: string; folderName: string; scriptCount: number }> = [];
    const emptyFolders: Array<{ folderId: string; folderName: string }> = [];

    folders.forEach(folder => {
      const scriptCount = scriptCountMap.get(folder.id) || 0;
      
      scriptsPerFolder.push({
        folderId: folder.id,
        folderName: folder.name,
        scriptCount
      });

      if (scriptCount === 0) {
        emptyFolders.push({
          folderId: folder.id,
          folderName: folder.name
        });
      }

      if (folder.children && folder.children.length > 0) {
        const childStats = this.analyzeFolderStructure(
          folder.children,
          scriptCountMap,
          depth + 1
        );
        totalFolders += childStats.totalFolders;
        maxDepth = Math.max(maxDepth, childStats.folderDepth);
        scriptsPerFolder.push(...childStats.scriptsPerFolder);
        emptyFolders.push(...childStats.emptyFolders);
      }
    });

    return {
      totalFolders,
      folderDepth: maxDepth,
      scriptsPerFolder,
      emptyFolders
    };
  }
}