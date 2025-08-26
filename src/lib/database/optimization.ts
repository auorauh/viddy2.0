import { Db, Collection, CreateIndexesOptions } from 'mongodb';
import { DatabaseError } from './errors';

/**
 * Database optimization service for managing indexes and query performance
 */
export class OptimizationService {
  private db: Db;

  constructor(db: Db) {
    this.db = db;
  }

  /**
   * Create all optimized indexes for the application
   */
  async createOptimizedIndexes(): Promise<{
    created: string[];
    errors: Array<{ index: string; error: string }>;
  }> {
    const created: string[] = [];
    const errors: Array<{ index: string; error: string }> = [];

    const indexDefinitions = [
      // Users collection indexes
      {
        collection: 'users',
        spec: { email: 1 },
        options: { unique: true, name: 'users_email_unique' }
      },
      {
        collection: 'users',
        spec: { username: 1 },
        options: { unique: true, name: 'users_username_unique' }
      },
      {
        collection: 'users',
        spec: { email: 1, username: 1 },
        options: { name: 'users_email_username_compound' }
      },

      // Projects collection indexes
      {
        collection: 'projects',
        spec: { userId: 1, updatedAt: -1 },
        options: { name: 'projects_user_updated' }
      },
      {
        collection: 'projects',
        spec: { userId: 1, 'stats.lastActivity': -1 },
        options: { name: 'projects_user_activity' }
      },
      {
        collection: 'projects',
        spec: { userId: 1, createdAt: -1 },
        options: { name: 'projects_user_created' }
      },
      {
        collection: 'projects',
        spec: { title: 'text', description: 'text' },
        options: { 
          name: 'projects_text_search',
          weights: { title: 10, description: 5 }
        }
      },

      // Scripts collection indexes
      {
        collection: 'scripts',
        spec: { userId: 1, updatedAt: -1 },
        options: { name: 'scripts_user_updated' }
      },
      {
        collection: 'scripts',
        spec: { userId: 1, projectId: 1, folderId: 1 },
        options: { name: 'scripts_user_project_folder' }
      },
      {
        collection: 'scripts',
        spec: { projectId: 1, folderId: 1, updatedAt: -1 },
        options: { name: 'scripts_project_folder_updated' }
      },
      {
        collection: 'scripts',
        spec: { userId: 1, 'metadata.status': 1, updatedAt: -1 },
        options: { name: 'scripts_user_status_updated' }
      },
      {
        collection: 'scripts',
        spec: { userId: 1, 'metadata.contentType': 1, updatedAt: -1 },
        options: { name: 'scripts_user_contenttype_updated' }
      },
      {
        collection: 'scripts',
        spec: { userId: 1, createdAt: -1 },
        options: { name: 'scripts_user_created' }
      },
      {
        collection: 'scripts',
        spec: { 
          title: 'text', 
          content: 'text', 
          'metadata.tags': 'text' 
        },
        options: { 
          name: 'scripts_text_search',
          weights: { title: 10, content: 5, 'metadata.tags': 3 }
        }
      },
      {
        collection: 'scripts',
        spec: { 'metadata.tags': 1 },
        options: { name: 'scripts_tags' }
      },
      {
        collection: 'scripts',
        spec: { projectId: 1, 'metadata.status': 1 },
        options: { name: 'scripts_project_status' }
      }
    ];

    for (const indexDef of indexDefinitions) {
      try {
        const collection = this.db.collection(indexDef.collection);
        await collection.createIndex(indexDef.spec, indexDef.options);
        created.push(`${indexDef.collection}.${indexDef.options.name}`);
      } catch (error: any) {
        errors.push({
          index: `${indexDef.collection}.${indexDef.options.name}`,
          error: error.message
        });
      }
    }

    return { created, errors };
  }

  /**
   * Analyze query performance for common operations
   */
  async analyzeQueryPerformance(): Promise<{
    queries: Array<{
      name: string;
      collection: string;
      executionTimeMs: number;
      indexesUsed: string[];
      docsExamined: number;
      docsReturned: number;
      efficient: boolean;
    }>;
  }> {
    const queries = [
      {
        name: 'Find user scripts by status',
        collection: 'scripts',
        operation: async (collection: Collection) => {
          return await collection.find({
            userId: { $exists: true },
            'metadata.status': 'draft'
          }).explain('executionStats');
        }
      },
      {
        name: 'Search scripts by text',
        collection: 'scripts',
        operation: async (collection: Collection) => {
          return await collection.find({
            $text: { $search: 'test script' }
          }).explain('executionStats');
        }
      },
      {
        name: 'Find user projects sorted by activity',
        collection: 'projects',
        operation: async (collection: Collection) => {
          return await collection.find({
            userId: { $exists: true }
          }).sort({ 'stats.lastActivity': -1 }).explain('executionStats');
        }
      },
      {
        name: 'Find scripts in project folder',
        collection: 'scripts',
        operation: async (collection: Collection) => {
          return await collection.find({
            projectId: { $exists: true },
            folderId: 'test-folder'
          }).explain('executionStats');
        }
      },
      {
        name: 'Aggregate user script stats',
        collection: 'scripts',
        operation: async (collection: Collection) => {
          return await collection.aggregate([
            { $match: { userId: { $exists: true } } },
            {
              $group: {
                _id: '$metadata.status',
                count: { $sum: 1 }
              }
            }
          ]).explain('executionStats');
        }
      }
    ];

    const results = [];

    for (const query of queries) {
      try {
        const collection = this.db.collection(query.collection);
        const explanation = await query.operation(collection);
        
        const executionStats = explanation.executionStats || explanation.stages?.[0]?.$cursor?.executionStats;
        
        if (executionStats) {
          results.push({
            name: query.name,
            collection: query.collection,
            executionTimeMs: executionStats.executionTimeMillis || 0,
            indexesUsed: this.extractIndexesUsed(explanation),
            docsExamined: executionStats.totalDocsExamined || 0,
            docsReturned: executionStats.totalDocsReturned || 0,
            efficient: this.isQueryEfficient(executionStats)
          });
        }
      } catch (error: any) {
        console.warn(`Failed to analyze query "${query.name}":`, error.message);
      }
    }

    return { queries: results };
  }

  /**
   * Get index usage statistics
   */
  async getIndexUsageStats(): Promise<{
    collections: Array<{
      name: string;
      indexes: Array<{
        name: string;
        size: number;
        usageCount: number;
        lastUsed: Date | null;
      }>;
    }>;
  }> {
    const collections = ['users', 'projects', 'scripts'];
    const results = [];

    for (const collectionName of collections) {
      try {
        const collection = this.db.collection(collectionName);
        
        // Get index stats
        const indexStats = await collection.aggregate([
          { $indexStats: {} }
        ]).toArray();

        const indexes = indexStats.map(stat => ({
          name: stat.name,
          size: stat.spec ? Object.keys(stat.spec).length : 0,
          usageCount: stat.accesses?.ops || 0,
          lastUsed: stat.accesses?.since || null
        }));

        results.push({
          name: collectionName,
          indexes
        });
      } catch (error: any) {
        console.warn(`Failed to get index stats for ${collectionName}:`, error.message);
      }
    }

    return { collections: results };
  }

  /**
   * Optimize collection performance by analyzing and suggesting improvements
   */
  async optimizeCollectionPerformance(collectionName: string): Promise<{
    currentIndexes: string[];
    suggestions: Array<{
      type: 'create_index' | 'drop_index' | 'modify_query';
      description: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    estimatedImprovement: string;
  }> {
    try {
      const collection = this.db.collection(collectionName);
      
      // Get current indexes
      const indexes = await collection.listIndexes().toArray();
      const currentIndexes = indexes.map(idx => idx.name);

      // Analyze collection stats
      const stats = await this.db.command({ collStats: collectionName });
      
      const suggestions = [];
      let estimatedImprovement = 'No optimization needed';

      // Check for missing compound indexes based on common query patterns
      if (collectionName === 'scripts') {
        const hasUserProjectFolderIndex = indexes.some(idx => 
          idx.key && idx.key.userId && idx.key.projectId && idx.key.folderId
        );
        
        if (!hasUserProjectFolderIndex) {
          suggestions.push({
            type: 'create_index',
            description: 'Create compound index on userId, projectId, folderId for faster folder queries',
            impact: 'high'
          });
        }

        const hasTextIndex = indexes.some(idx => idx.textIndexVersion);
        if (!hasTextIndex) {
          suggestions.push({
            type: 'create_index',
            description: 'Create text index on title and content for search functionality',
            impact: 'high'
          });
        }
      }

      if (collectionName === 'projects') {
        const hasUserActivityIndex = indexes.some(idx =>
          idx.key && idx.key.userId && idx.key['stats.lastActivity']
        );
        
        if (!hasUserActivityIndex) {
          suggestions.push({
            type: 'create_index',
            description: 'Create compound index on userId and stats.lastActivity for recent projects',
            impact: 'medium'
          });
        }
      }

      // Check for unused indexes
      const indexUsage = await collection.aggregate([{ $indexStats: {} }]).toArray();
      const unusedIndexes = indexUsage.filter(idx => 
        idx.name !== '_id_' && (idx.accesses?.ops || 0) === 0
      );

      unusedIndexes.forEach(idx => {
        suggestions.push({
          type: 'drop_index',
          description: `Consider dropping unused index: ${idx.name}`,
          impact: 'low'
        });
      });

      if (suggestions.length > 0) {
        const highImpactCount = suggestions.filter(s => s.impact === 'high').length;
        if (highImpactCount > 0) {
          estimatedImprovement = `High impact: ${highImpactCount} critical optimizations available`;
        } else {
          estimatedImprovement = `Medium impact: ${suggestions.length} optimizations available`;
        }
      }

      return {
        currentIndexes,
        suggestions,
        estimatedImprovement
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to optimize collection performance: ${error.message}`);
    }
  }

  /**
   * Monitor slow queries and provide optimization recommendations
   */
  async getSlowQueryAnalysis(): Promise<{
    slowQueries: Array<{
      operation: string;
      collection: string;
      duration: number;
      recommendation: string;
    }>;
    averageQueryTime: number;
    totalQueries: number;
  }> {
    try {
      // Enable profiling for slow operations (>100ms)
      await this.db.command({ profile: 2, slowms: 100 });

      // Get profiling data
      const profilingData = await this.db.collection('system.profile')
        .find({})
        .sort({ ts: -1 })
        .limit(100)
        .toArray();

      const slowQueries = profilingData.map(query => ({
        operation: query.command ? Object.keys(query.command)[0] : 'unknown',
        collection: query.ns ? query.ns.split('.')[1] : 'unknown',
        duration: query.millis || 0,
        recommendation: this.getQueryRecommendation(query)
      }));

      const totalQueries = profilingData.length;
      const averageQueryTime = totalQueries > 0 
        ? profilingData.reduce((sum, q) => sum + (q.millis || 0), 0) / totalQueries
        : 0;

      // Disable profiling to avoid performance impact
      await this.db.command({ profile: 0 });

      return {
        slowQueries,
        averageQueryTime,
        totalQueries
      };
    } catch (error: any) {
      // Disable profiling in case of error
      try {
        await this.db.command({ profile: 0 });
      } catch (e) {
        // Ignore cleanup errors
      }
      throw new DatabaseError(`Failed to analyze slow queries: ${error.message}`);
    }
  }

  // Private helper methods

  private extractIndexesUsed(explanation: any): string[] {
    const indexes: string[] = [];
    
    if (explanation.executionStats?.executionStages) {
      this.extractIndexesFromStage(explanation.executionStats.executionStages, indexes);
    }
    
    if (explanation.stages) {
      explanation.stages.forEach((stage: any) => {
        if (stage.$cursor?.executionStats?.executionStages) {
          this.extractIndexesFromStage(stage.$cursor.executionStats.executionStages, indexes);
        }
      });
    }

    return [...new Set(indexes)]; // Remove duplicates
  }

  private extractIndexesFromStage(stage: any, indexes: string[]): void {
    if (stage.indexName) {
      indexes.push(stage.indexName);
    }
    
    if (stage.inputStage) {
      this.extractIndexesFromStage(stage.inputStage, indexes);
    }
    
    if (stage.inputStages) {
      stage.inputStages.forEach((inputStage: any) => {
        this.extractIndexesFromStage(inputStage, indexes);
      });
    }
  }

  private isQueryEfficient(executionStats: any): boolean {
    const docsExamined = executionStats.totalDocsExamined || 0;
    const docsReturned = executionStats.totalDocsReturned || 0;
    const executionTime = executionStats.executionTimeMillis || 0;

    // Consider efficient if:
    // 1. Execution time is under 50ms
    // 2. Docs examined to returned ratio is reasonable (< 10:1)
    // 3. Uses an index (not a collection scan)
    
    const timeEfficient = executionTime < 50;
    const scanEfficient = docsReturned === 0 || (docsExamined / docsReturned) < 10;
    const usesIndex = executionStats.executionStages?.stage !== 'COLLSCAN';

    return timeEfficient && scanEfficient && usesIndex;
  }

  private getQueryRecommendation(query: any): string {
    const duration = query.millis || 0;
    const command = query.command;

    if (duration > 1000) {
      return 'Critical: Query taking over 1 second. Consider adding indexes or optimizing query structure.';
    }
    
    if (duration > 500) {
      return 'High: Query taking over 500ms. Review indexes and query patterns.';
    }
    
    if (command?.find && !command.hint) {
      return 'Medium: Consider adding appropriate indexes for this find operation.';
    }
    
    if (command?.aggregate && command.pipeline?.length > 5) {
      return 'Medium: Complex aggregation pipeline. Consider optimizing stages and adding indexes.';
    }

    return 'Low: Query performance is acceptable but could be optimized.';
  }
}