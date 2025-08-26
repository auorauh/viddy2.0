import { describe, it, expect, vi } from 'vitest';
import { ObjectId } from 'mongodb';
import { SearchService } from '../search';
import { OptimizationService } from '../optimization';
import { ContentType, ScriptStatus } from '../types';

// Mock MongoDB database and collections
const mockCollection = {
  createIndex: vi.fn().mockResolvedValue({}),
  find: vi.fn().mockReturnValue({
    sort: vi.fn().mockReturnThis(),
    skip: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    toArray: vi.fn().mockResolvedValue([])
  }),
  findOne: vi.fn().mockResolvedValue(null),
  aggregate: vi.fn().mockReturnValue({
    toArray: vi.fn().mockResolvedValue([])
  }),
  countDocuments: vi.fn().mockResolvedValue(0),
  listIndexes: vi.fn().mockReturnValue({
    toArray: vi.fn().mockResolvedValue([
      { name: '_id_', key: { _id: 1 } }
    ])
  })
};

const mockDb = {
  collection: vi.fn().mockReturnValue(mockCollection),
  command: vi.fn().mockResolvedValue({}),
  admin: vi.fn().mockReturnValue({
    ping: vi.fn().mockResolvedValue({})
  })
};

describe('Search Service Unit Tests', () => {
  let searchService: SearchService;

  beforeEach(() => {
    vi.clearAllMocks();
    searchService = new SearchService(mockDb as any);
  });

  describe('Search Service Initialization', () => {
    it('should initialize with database instance', () => {
      expect(searchService).toBeInstanceOf(SearchService);
      expect(mockDb.collection).toHaveBeenCalledWith('scripts');
      expect(mockDb.collection).toHaveBeenCalledWith('projects');
      expect(mockDb.collection).toHaveBeenCalledWith('users');
    });

    it('should create search indexes on initialization', () => {
      expect(mockCollection.createIndex).toHaveBeenCalled();
    });
  });

  describe('Global Search', () => {
    it('should handle global search parameters correctly', async () => {
      const userId = new ObjectId();
      const searchText = 'test search';
      
      // Mock successful search results
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            userId,
            title: 'Test Script',
            content: 'Test content with search terms',
            textScore: 1.5
          }
        ])
      });

      const result = await searchService.globalSearch(userId, searchText, {
        limit: 10,
        includeScripts: true,
        includeProjects: true
      });

      expect(result).toHaveProperty('scripts');
      expect(result).toHaveProperty('projects');
      expect(result).toHaveProperty('totalResults');
      expect(Array.isArray(result.scripts)).toBe(true);
      expect(Array.isArray(result.projects)).toBe(true);
    });

    it('should handle search with filters', async () => {
      const userId = new ObjectId();
      const projectId = new ObjectId();
      
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      await searchService.globalSearch(userId, 'test', {
        contentType: ContentType.TIKTOK,
        status: ScriptStatus.DRAFT,
        projectId
      });

      expect(mockCollection.aggregate).toHaveBeenCalled();
    });
  });

  describe('Advanced Script Search', () => {
    it('should build correct aggregation pipeline for advanced search', async () => {
      const userId = new ObjectId();
      const searchText = 'marketing strategy';
      
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([])
      });

      await searchService.searchScriptsAdvanced(userId, searchText, {
        contentType: ContentType.YOUTUBE,
        status: ScriptStatus.FINAL,
        tags: ['marketing', 'strategy'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        }
      });

      expect(mockCollection.aggregate).toHaveBeenCalled();
      const aggregateCall = mockCollection.aggregate.mock.calls[0][0];
      
      // Verify pipeline structure
      expect(Array.isArray(aggregateCall)).toBe(true);
      expect(aggregateCall.length).toBeGreaterThan(0);
      
      // Should have match stage for user and text search
      const matchStage = aggregateCall.find((stage: any) => stage.$match);
      expect(matchStage).toBeDefined();
      expect(matchStage.$match.userId).toEqual(userId);
      expect(matchStage.$match.$text).toBeDefined();
    });
  });

  describe('Search Suggestions', () => {
    it('should generate search suggestions from user content', async () => {
      const userId = new ObjectId();
      
      // Mock suggestions data
      mockCollection.aggregate
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([
            { title: 'Marketing Script 1' },
            { title: 'Marketing Strategy Guide' }
          ])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([
            { title: 'Marketing Project' }
          ])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([
            { tag: 'marketing' },
            { tag: 'strategy' }
          ])
        });

      const suggestions = await searchService.getSearchSuggestions(userId, 'mark', 5);

      expect(suggestions).toHaveProperty('scriptTitles');
      expect(suggestions).toHaveProperty('projectTitles');
      expect(suggestions).toHaveProperty('tags');
      expect(Array.isArray(suggestions.scriptTitles)).toBe(true);
      expect(Array.isArray(suggestions.projectTitles)).toBe(true);
      expect(Array.isArray(suggestions.tags)).toBe(true);
    });
  });

  describe('User Statistics', () => {
    it('should generate comprehensive user statistics', async () => {
      const userId = new ObjectId();
      
      // Mock statistics data
      mockCollection.countDocuments
        .mockResolvedValueOnce(5) // project count
        .mockResolvedValueOnce(25) // script count
        .mockResolvedValueOnce(10) // recent scripts
        .mockResolvedValueOnce(2); // recent projects

      mockCollection.aggregate
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([{ totalFolders: 8 }])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([
            { _id: ScriptStatus.DRAFT, count: 10 },
            { _id: ScriptStatus.FINAL, count: 15 }
          ])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([
            { _id: ContentType.TIKTOK, count: 12 },
            { _id: ContentType.YOUTUBE, count: 13 }
          ])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([
            { _id: { year: 2024, month: 11 }, count: 15 },
            { _id: { year: 2024, month: 10 }, count: 10 }
          ])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([{ avgFolders: 2.5 }])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([{ avgScripts: 5.0 }])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([])
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue([])
        });

      mockCollection.findOne
        .mockResolvedValueOnce({ updatedAt: new Date() })
        .mockResolvedValueOnce({
          _id: new ObjectId(),
          title: 'Most Active Project',
          stats: { totalScripts: 20 }
        });

      mockCollection.find.mockReturnValue({
        sort: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        projection: vi.fn().mockReturnThis(),
        toArray: vi.fn().mockResolvedValue([
          {
            _id: new ObjectId(),
            title: 'Recent Project',
            stats: { lastActivity: new Date() }
          }
        ])
      });

      const stats = await searchService.getUserStatistics(userId);

      expect(stats).toHaveProperty('overview');
      expect(stats).toHaveProperty('scriptStats');
      expect(stats).toHaveProperty('projectStats');
      expect(stats).toHaveProperty('activityStats');
      
      expect(stats.overview).toHaveProperty('totalProjects');
      expect(stats.overview).toHaveProperty('totalScripts');
      expect(stats.overview).toHaveProperty('totalFolders');
      expect(stats.overview).toHaveProperty('recentActivity');
      
      expect(stats.scriptStats).toHaveProperty('byStatus');
      expect(stats.scriptStats).toHaveProperty('byContentType');
      expect(stats.scriptStats).toHaveProperty('byMonth');
      expect(stats.scriptStats).toHaveProperty('averagePerProject');
    });
  });
});

describe('Optimization Service Unit Tests', () => {
  let optimizationService: OptimizationService;

  beforeEach(() => {
    vi.clearAllMocks();
    optimizationService = new OptimizationService(mockDb as any);
  });

  describe('Index Creation', () => {
    it('should create optimized indexes successfully', async () => {
      mockCollection.createIndex.mockResolvedValue({});

      const result = await optimizationService.createOptimizedIndexes();

      expect(result).toHaveProperty('created');
      expect(result).toHaveProperty('errors');
      expect(Array.isArray(result.created)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(mockCollection.createIndex).toHaveBeenCalled();
    });

    it('should handle index creation errors gracefully', async () => {
      mockCollection.createIndex
        .mockResolvedValueOnce({}) // First index succeeds
        .mockRejectedValueOnce(new Error('Index creation failed')); // Second fails

      const result = await optimizationService.createOptimizedIndexes();

      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toHaveProperty('index');
      expect(result.errors[0]).toHaveProperty('error');
    });
  });

  describe('Query Performance Analysis', () => {
    it('should analyze query performance', async () => {
      // Mock explain results
      mockCollection.find.mockReturnValue({
        explain: vi.fn().mockResolvedValue({
          executionStats: {
            executionTimeMillis: 50,
            totalDocsExamined: 100,
            totalDocsReturned: 10
          }
        })
      });

      mockCollection.aggregate.mockReturnValue({
        explain: vi.fn().mockResolvedValue({
          stages: [{
            $cursor: {
              executionStats: {
                executionTimeMillis: 75,
                totalDocsExamined: 200,
                totalDocsReturned: 20
              }
            }
          }]
        })
      });

      const analysis = await optimizationService.analyzeQueryPerformance();

      expect(analysis).toHaveProperty('queries');
      expect(Array.isArray(analysis.queries)).toBe(true);
    });
  });

  describe('Collection Optimization', () => {
    it('should provide optimization suggestions', async () => {
      mockCollection.listIndexes.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { name: '_id_', key: { _id: 1 } },
          { name: 'user_updated', key: { userId: 1, updatedAt: -1 } }
        ])
      });

      mockDb.command.mockResolvedValue({
        count: 1000,
        size: 50000,
        avgObjSize: 500
      });

      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          { name: 'user_updated', accesses: { ops: 100 } }
        ])
      });

      const optimization = await optimizationService.optimizeCollectionPerformance('scripts');

      expect(optimization).toHaveProperty('currentIndexes');
      expect(optimization).toHaveProperty('suggestions');
      expect(optimization).toHaveProperty('estimatedImprovement');
      expect(Array.isArray(optimization.currentIndexes)).toBe(true);
      expect(Array.isArray(optimization.suggestions)).toBe(true);
    });
  });

  describe('Index Usage Statistics', () => {
    it('should get index usage statistics', async () => {
      mockCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([
          {
            name: 'user_updated',
            spec: { userId: 1, updatedAt: -1 },
            accesses: { ops: 150, since: new Date() }
          }
        ])
      });

      const stats = await optimizationService.getIndexUsageStats();

      expect(stats).toHaveProperty('collections');
      expect(Array.isArray(stats.collections)).toBe(true);
      
      if (stats.collections.length > 0) {
        const collection = stats.collections[0];
        expect(collection).toHaveProperty('name');
        expect(collection).toHaveProperty('indexes');
        expect(Array.isArray(collection.indexes)).toBe(true);
      }
    });
  });
});