import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { ObjectId } from 'mongodb';
import { getDatabase } from '../connection';
import { SearchService } from '../search';
import { OptimizationService } from '../optimization';
import { ScriptModel } from '../models/script';
import { ProjectModel } from '../models/project';
import { UserModel } from '../models/user';
import { ContentType, ScriptStatus, ProjectView, Theme } from '../types';

describe('Search and Query Performance Tests', () => {
  let searchService: SearchService;
  let optimizationService: OptimizationService;
  let scriptModel: ScriptModel;
  let projectModel: ProjectModel;
  let userModel: UserModel;
  let testUserId: ObjectId;
  let testProjectIds: ObjectId[] = [];
  let testScriptIds: ObjectId[] = [];

  beforeAll(async () => {
    const db = await getDatabase();
    searchService = new SearchService(db);
    optimizationService = new OptimizationService(db);
    scriptModel = new ScriptModel(db);
    projectModel = new ProjectModel(db);
    userModel = new UserModel(db);

    // Create test user
    const testUser = await userModel.createUser({
      email: 'search-test@example.com',
      username: 'searchtest',
      passwordHash: 'hashedpassword',
      profile: {
        firstName: 'Search',
        lastName: 'Test'
      },
      preferences: {
        defaultProjectView: ProjectView.GRID,
        theme: Theme.LIGHT
      }
    });
    testUserId = testUser._id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testScriptIds.length > 0) {
      await Promise.all(testScriptIds.map(id => 
        scriptModel.deleteScript(id).catch(() => {})
      ));
    }
    if (testProjectIds.length > 0) {
      await Promise.all(testProjectIds.map(id => 
        projectModel.deleteProject(id).catch(() => {})
      ));
    }
    if (testUserId) {
      await userModel.deleteUser(testUserId).catch(() => {});
    }
  });

  beforeEach(async () => {
    // Clean up any existing test data
    testScriptIds = [];
    testProjectIds = [];
  });

  describe('Search Performance', () => {
    it('should perform text search efficiently with large dataset', async () => {
      // Create test projects
      const projects = await Promise.all([
        projectModel.createProject({
          userId: testUserId,
          title: 'Video Marketing Project',
          description: 'Content for social media marketing campaigns',
          folders: [{
            id: 'folder-1',
            name: 'TikTok Scripts',
            scriptCount: 0,
            createdAt: new Date()
          }],
          settings: { isPublic: false, allowCollaboration: false },
          stats: { totalScripts: 0, lastActivity: new Date() }
        }),
        projectModel.createProject({
          userId: testUserId,
          title: 'Educational Content',
          description: 'Learning materials and tutorials',
          folders: [{
            id: 'folder-2',
            name: 'YouTube Scripts',
            scriptCount: 0,
            createdAt: new Date()
          }],
          settings: { isPublic: false, allowCollaboration: false },
          stats: { totalScripts: 0, lastActivity: new Date() }
        })
      ]);
      testProjectIds = projects.map(p => p._id);

      // Create test scripts with searchable content
      const scriptPromises = [];
      const searchTerms = [
        'marketing strategy for social media',
        'video content creation tips',
        'audience engagement techniques',
        'brand storytelling methods',
        'viral content strategies',
        'influencer collaboration guide',
        'content calendar planning',
        'analytics and metrics tracking'
      ];

      for (let i = 0; i < 50; i++) {
        const term = searchTerms[i % searchTerms.length];
        scriptPromises.push(
          scriptModel.createScript({
            userId: testUserId,
            projectId: projects[i % 2]._id,
            folderId: `folder-${(i % 2) + 1}`,
            title: `Script ${i + 1}: ${term}`,
            content: `This is a detailed script about ${term}. It covers various aspects and provides comprehensive guidance.`,
            metadata: {
              contentType: i % 2 === 0 ? ContentType.TIKTOK : ContentType.YOUTUBE,
              tags: term.split(' ').slice(0, 3),
              status: ScriptStatus.DRAFT
            }
          })
        );
      }

      const scripts = await Promise.all(scriptPromises);
      testScriptIds = scripts.map(s => s._id);

      // Performance test: Global search
      const startTime = Date.now();
      const searchResults = await searchService.globalSearch(testUserId, 'marketing strategy', {
        limit: 10
      });
      const searchDuration = Date.now() - startTime;

      expect(searchDuration).toBeLessThan(500); // Should complete within 500ms
      expect(searchResults.scripts.length).toBeGreaterThan(0);
      expect(searchResults.projects.length).toBeGreaterThan(0);
      expect(searchResults.totalResults).toBeGreaterThan(0);

      // Verify search relevance
      const firstScript = searchResults.scripts[0];
      expect(
        firstScript.title.toLowerCase().includes('marketing') ||
        firstScript.content.toLowerCase().includes('marketing')
      ).toBe(true);
    }, 10000);

    it('should handle advanced script search with multiple filters efficiently', async () => {
      // Create a project for this test
      const project = await projectModel.createProject({
        userId: testUserId,
        title: 'Advanced Search Test Project',
        description: 'Project for testing advanced search functionality',
        folders: [{
          id: 'advanced-folder',
          name: 'Test Scripts',
          scriptCount: 0,
          createdAt: new Date()
        }],
        settings: { isPublic: false, allowCollaboration: false },
        stats: { totalScripts: 0, lastActivity: new Date() }
      });
      testProjectIds.push(project._id);

      // Create scripts with different statuses and content types
      const scripts = await Promise.all([
        scriptModel.createScript({
          userId: testUserId,
          projectId: project._id,
          folderId: 'advanced-folder',
          title: 'TikTok Marketing Script',
          content: 'Advanced marketing techniques for TikTok platform',
          metadata: {
            contentType: ContentType.TIKTOK,
            tags: ['marketing', 'tiktok', 'social'],
            status: ScriptStatus.DRAFT
          }
        }),
        scriptModel.createScript({
          userId: testUserId,
          projectId: project._id,
          folderId: 'advanced-folder',
          title: 'YouTube Marketing Guide',
          content: 'Comprehensive marketing guide for YouTube creators',
          metadata: {
            contentType: ContentType.YOUTUBE,
            tags: ['marketing', 'youtube', 'guide'],
            status: ScriptStatus.FINAL
          }
        })
      ]);
      testScriptIds.push(...scripts.map(s => s._id));

      // Test advanced search with filters
      const startTime = Date.now();
      const results = await searchService.searchScriptsAdvanced(testUserId, 'marketing', {
        contentType: ContentType.TIKTOK,
        status: ScriptStatus.DRAFT,
        tags: ['marketing']
      });
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(200); // Should be very fast with proper indexes
      expect(results.length).toBe(1);
      expect(results[0].metadata.contentType).toBe(ContentType.TIKTOK);
      expect(results[0].metadata.status).toBe(ScriptStatus.DRAFT);
    });

    it('should provide search suggestions efficiently', async () => {
      // Create some content for suggestions
      const project = await projectModel.createProject({
        userId: testUserId,
        title: 'Suggestion Test Project',
        description: 'Project for testing search suggestions',
        folders: [{
          id: 'suggestion-folder',
          name: 'Suggestion Scripts',
          scriptCount: 0,
          createdAt: new Date()
        }],
        settings: { isPublic: false, allowCollaboration: false },
        stats: { totalScripts: 0, lastActivity: new Date() }
      });
      testProjectIds.push(project._id);

      const script = await scriptModel.createScript({
        userId: testUserId,
        projectId: project._id,
        folderId: 'suggestion-folder',
        title: 'Marketing Automation Script',
        content: 'Script about marketing automation tools',
        metadata: {
          contentType: ContentType.GENERAL,
          tags: ['marketing', 'automation', 'tools'],
          status: ScriptStatus.DRAFT
        }
      });
      testScriptIds.push(script._id);

      // Test search suggestions
      const startTime = Date.now();
      const suggestions = await searchService.getSearchSuggestions(testUserId, 'mark');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100); // Should be very fast
      expect(suggestions.scriptTitles.length).toBeGreaterThan(0);
      expect(suggestions.tags.length).toBeGreaterThan(0);
    });
  });

  describe('Aggregation Performance', () => {
    it('should generate user statistics efficiently', async () => {
      // Create test data for statistics
      const project = await projectModel.createProject({
        userId: testUserId,
        title: 'Statistics Test Project',
        description: 'Project for testing user statistics',
        folders: [{
          id: 'stats-folder',
          name: 'Stats Scripts',
          scriptCount: 0,
          createdAt: new Date()
        }],
        settings: { isPublic: false, allowCollaboration: false },
        stats: { totalScripts: 0, lastActivity: new Date() }
      });
      testProjectIds.push(project._id);

      // Create multiple scripts with different statuses and types
      const scriptPromises = [];
      for (let i = 0; i < 20; i++) {
        scriptPromises.push(
          scriptModel.createScript({
            userId: testUserId,
            projectId: project._id,
            folderId: 'stats-folder',
            title: `Stats Script ${i + 1}`,
            content: `Content for statistics script ${i + 1}`,
            metadata: {
              contentType: Object.values(ContentType)[i % 4],
              tags: [`tag${i % 3}`, `category${i % 2}`],
              status: Object.values(ScriptStatus)[i % 4]
            }
          })
        );
      }
      const scripts = await Promise.all(scriptPromises);
      testScriptIds.push(...scripts.map(s => s._id));

      // Test user statistics generation
      const startTime = Date.now();
      const stats = await searchService.getUserStatistics(testUserId);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(1000); // Should complete within 1 second
      expect(stats.overview.totalScripts).toBeGreaterThan(0);
      expect(stats.overview.totalProjects).toBeGreaterThan(0);
      expect(stats.scriptStats.byStatus).toBeDefined();
      expect(stats.scriptStats.byContentType).toBeDefined();
      expect(stats.projectStats).toBeDefined();
      expect(stats.activityStats).toBeDefined();
    });

    it('should analyze project folder statistics efficiently', async () => {
      // Create a project with nested folder structure
      const project = await projectModel.createProject({
        userId: testUserId,
        title: 'Folder Stats Test Project',
        description: 'Project for testing folder statistics',
        folders: [
          {
            id: 'parent-folder',
            name: 'Parent Folder',
            scriptCount: 0,
            createdAt: new Date(),
            children: [
              {
                id: 'child-folder-1',
                name: 'Child Folder 1',
                parentId: 'parent-folder',
                scriptCount: 0,
                createdAt: new Date()
              },
              {
                id: 'child-folder-2',
                name: 'Child Folder 2',
                parentId: 'parent-folder',
                scriptCount: 0,
                createdAt: new Date()
              }
            ]
          }
        ],
        settings: { isPublic: false, allowCollaboration: false },
        stats: { totalScripts: 0, lastActivity: new Date() }
      });
      testProjectIds.push(project._id);

      // Add scripts to different folders
      const scripts = await Promise.all([
        scriptModel.createScript({
          userId: testUserId,
          projectId: project._id,
          folderId: 'child-folder-1',
          title: 'Script in Child 1',
          content: 'Content for child folder 1',
          metadata: {
            contentType: ContentType.TIKTOK,
            tags: ['test'],
            status: ScriptStatus.DRAFT
          }
        }),
        scriptModel.createScript({
          userId: testUserId,
          projectId: project._id,
          folderId: 'child-folder-2',
          title: 'Script in Child 2',
          content: 'Content for child folder 2',
          metadata: {
            contentType: ContentType.YOUTUBE,
            tags: ['test'],
            status: ScriptStatus.DRAFT
          }
        })
      ]);
      testScriptIds.push(...scripts.map(s => s._id));

      // Test folder statistics
      const startTime = Date.now();
      const folderStats = await searchService.getProjectFolderStats(project._id);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(300); // Should be fast
      expect(folderStats.totalFolders).toBe(3); // Parent + 2 children
      expect(folderStats.folderDepth).toBe(1); // One level deep
      expect(folderStats.scriptsPerFolder.length).toBe(3);
      expect(folderStats.emptyFolders.length).toBe(1); // Parent folder is empty
    });
  });

  describe('Index Optimization', () => {
    it('should create optimized indexes successfully', async () => {
      const result = await optimizationService.createOptimizedIndexes();
      
      expect(result.created.length).toBeGreaterThan(0);
      expect(result.errors.length).toBe(0); // Should not have errors for valid indexes
      
      // Verify some key indexes were created
      const createdIndexNames = result.created.join(',');
      expect(createdIndexNames).toContain('scripts_text_search');
      expect(createdIndexNames).toContain('projects_text_search');
      expect(createdIndexNames).toContain('scripts_user_updated');
    });

    it('should analyze query performance accurately', async () => {
      const analysis = await optimizationService.analyzeQueryPerformance();
      
      expect(analysis.queries.length).toBeGreaterThan(0);
      
      // Check that analysis includes key metrics
      analysis.queries.forEach(query => {
        expect(query.name).toBeDefined();
        expect(query.collection).toBeDefined();
        expect(typeof query.executionTimeMs).toBe('number');
        expect(Array.isArray(query.indexesUsed)).toBe(true);
        expect(typeof query.docsExamined).toBe('number');
        expect(typeof query.docsReturned).toBe('number');
        expect(typeof query.efficient).toBe('boolean');
      });
    });

    it('should provide collection optimization suggestions', async () => {
      const optimization = await optimizationService.optimizeCollectionPerformance('scripts');
      
      expect(Array.isArray(optimization.currentIndexes)).toBe(true);
      expect(Array.isArray(optimization.suggestions)).toBe(true);
      expect(typeof optimization.estimatedImprovement).toBe('string');
      
      // Suggestions should have proper structure
      optimization.suggestions.forEach(suggestion => {
        expect(['create_index', 'drop_index', 'modify_query']).toContain(suggestion.type);
        expect(['high', 'medium', 'low']).toContain(suggestion.impact);
        expect(typeof suggestion.description).toBe('string');
      });
    });

    it('should monitor index usage statistics', async () => {
      const stats = await optimizationService.getIndexUsageStats();
      
      expect(Array.isArray(stats.collections)).toBe(true);
      expect(stats.collections.length).toBeGreaterThan(0);
      
      stats.collections.forEach(collection => {
        expect(typeof collection.name).toBe('string');
        expect(Array.isArray(collection.indexes)).toBe(true);
        
        collection.indexes.forEach(index => {
          expect(typeof index.name).toBe('string');
          expect(typeof index.size).toBe('number');
          expect(typeof index.usageCount).toBe('number');
        });
      });
    });
  });

  describe('Performance Benchmarks', () => {
    it('should meet performance benchmarks for common operations', async () => {
      // Create benchmark data
      const project = await projectModel.createProject({
        userId: testUserId,
        title: 'Benchmark Test Project',
        description: 'Project for performance benchmarking',
        folders: [{
          id: 'benchmark-folder',
          name: 'Benchmark Scripts',
          scriptCount: 0,
          createdAt: new Date()
        }],
        settings: { isPublic: false, allowCollaboration: false },
        stats: { totalScripts: 0, lastActivity: new Date() }
      });
      testProjectIds.push(project._id);

      // Create 100 scripts for benchmarking
      const scriptPromises = [];
      for (let i = 0; i < 100; i++) {
        scriptPromises.push(
          scriptModel.createScript({
            userId: testUserId,
            projectId: project._id,
            folderId: 'benchmark-folder',
            title: `Benchmark Script ${i + 1}`,
            content: `This is benchmark content for script ${i + 1}. It contains various keywords for testing search performance.`,
            metadata: {
              contentType: Object.values(ContentType)[i % 4],
              tags: [`benchmark${i % 10}`, `test${i % 5}`],
              status: Object.values(ScriptStatus)[i % 4]
            }
          })
        );
      }
      const scripts = await Promise.all(scriptPromises);
      testScriptIds.push(...scripts.map(s => s._id));

      // Benchmark: Text search
      const searchStart = Date.now();
      await searchService.globalSearch(testUserId, 'benchmark', { limit: 20 });
      const searchDuration = Date.now() - searchStart;
      expect(searchDuration).toBeLessThan(200); // Should be under 200ms

      // Benchmark: User statistics
      const statsStart = Date.now();
      await searchService.getUserStatistics(testUserId);
      const statsDuration = Date.now() - statsStart;
      expect(statsDuration).toBeLessThan(500); // Should be under 500ms

      // Benchmark: Advanced search with filters
      const advancedStart = Date.now();
      await searchService.searchScriptsAdvanced(testUserId, 'benchmark', {
        contentType: ContentType.TIKTOK,
        limit: 10
      });
      const advancedDuration = Date.now() - advancedStart;
      expect(advancedDuration).toBeLessThan(150); // Should be under 150ms
    });
  });
});