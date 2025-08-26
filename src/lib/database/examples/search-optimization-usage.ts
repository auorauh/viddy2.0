/**
 * Example usage of Search and Optimization services
 * This file demonstrates how to use the new search and query optimization features
 */

import { ObjectId } from 'mongodb';
import { DatabaseService } from '../services';
import { ContentType, ScriptStatus } from '../types';

/**
 * Example: Using the Search Service for advanced text search
 */
export async function exampleGlobalSearch() {
  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    // Example user ID (in real usage, this would come from authentication)
    const userId = new ObjectId('507f1f77bcf86cd799439011');
    
    // Perform global search across scripts and projects
    const searchResults = await searchService.globalSearch(userId, 'marketing strategy', {
      limit: 20,
      includeScripts: true,
      includeProjects: true,
      contentType: ContentType.TIKTOK,
      status: ScriptStatus.DRAFT
    });
    
    console.log('Global Search Results:');
    console.log(`Found ${searchResults.totalResults} total results`);
    console.log(`Scripts: ${searchResults.scripts.length}`);
    console.log(`Projects: ${searchResults.projects.length}`);
    
    // Display first few script results
    searchResults.scripts.slice(0, 3).forEach((script, index) => {
      console.log(`Script ${index + 1}: ${script.title}`);
      console.log(`  Content Type: ${script.metadata.contentType}`);
      console.log(`  Status: ${script.metadata.status}`);
      console.log(`  Tags: ${script.metadata.tags.join(', ')}`);
    });
    
    return searchResults;
  } catch (error) {
    console.error('Global search failed:', error);
    throw error;
  }
}

/**
 * Example: Advanced script search with multiple filters
 */
export async function exampleAdvancedScriptSearch() {
  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    const userId = new ObjectId('507f1f77bcf86cd799439011');
    
    // Advanced search with date range and tags
    const advancedResults = await searchService.searchScriptsAdvanced(
      userId,
      'content creation tips',
      {
        contentType: ContentType.YOUTUBE,
        status: ScriptStatus.FINAL,
        tags: ['tutorial', 'tips'],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-12-31')
        },
        limit: 10
      }
    );
    
    console.log('Advanced Script Search Results:');
    console.log(`Found ${advancedResults.length} matching scripts`);
    
    advancedResults.forEach((script, index) => {
      console.log(`${index + 1}. ${script.title}`);
      console.log(`   Created: ${script.createdAt.toDateString()}`);
      console.log(`   Tags: ${script.metadata.tags.join(', ')}`);
    });
    
    return advancedResults;
  } catch (error) {
    console.error('Advanced script search failed:', error);
    throw error;
  }
}

/**
 * Example: Getting search suggestions for autocomplete
 */
export async function exampleSearchSuggestions() {
  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    const userId = new ObjectId('507f1f77bcf86cd799439011');
    
    // Get search suggestions for partial text
    const suggestions = await searchService.getSearchSuggestions(userId, 'mark', 10);
    
    console.log('Search Suggestions:');
    console.log('Script Titles:', suggestions.scriptTitles);
    console.log('Project Titles:', suggestions.projectTitles);
    console.log('Tags:', suggestions.tags);
    
    return suggestions;
  } catch (error) {
    console.error('Getting search suggestions failed:', error);
    throw error;
  }
}

/**
 * Example: Getting comprehensive user statistics
 */
export async function exampleUserStatistics() {
  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    const userId = new ObjectId('507f1f77bcf86cd799439011');
    
    // Get comprehensive user statistics
    const stats = await searchService.getUserStatistics(userId);
    
    console.log('User Statistics:');
    console.log('Overview:');
    console.log(`  Total Projects: ${stats.overview.totalProjects}`);
    console.log(`  Total Scripts: ${stats.overview.totalScripts}`);
    console.log(`  Total Folders: ${stats.overview.totalFolders}`);
    console.log(`  Recent Activity: ${stats.overview.recentActivity?.toDateString() || 'None'}`);
    
    console.log('Script Statistics:');
    console.log('  By Status:');
    Object.entries(stats.scriptStats.byStatus).forEach(([status, count]) => {
      console.log(`    ${status}: ${count}`);
    });
    
    console.log('  By Content Type:');
    Object.entries(stats.scriptStats.byContentType).forEach(([type, count]) => {
      console.log(`    ${type}: ${count}`);
    });
    
    console.log(`  Average per Project: ${stats.scriptStats.averagePerProject}`);
    
    console.log('Project Statistics:');
    console.log(`  Average Folders per Project: ${stats.projectStats.averageFoldersPerProject}`);
    console.log(`  Average Scripts per Project: ${stats.projectStats.averageScriptsPerProject}`);
    
    if (stats.projectStats.mostActiveProject) {
      console.log(`  Most Active Project: ${stats.projectStats.mostActiveProject.title} (${stats.projectStats.mostActiveProject.scriptCount} scripts)`);
    }
    
    console.log('Activity Statistics:');
    console.log(`  Scripts Created (Last 30 Days): ${stats.activityStats.scriptsCreatedLast30Days}`);
    console.log(`  Projects Created (Last 30 Days): ${stats.activityStats.projectsCreatedLast30Days}`);
    
    return stats;
  } catch (error) {
    console.error('Getting user statistics failed:', error);
    throw error;
  }
}

/**
 * Example: Analyzing project folder statistics
 */
export async function exampleProjectFolderStats() {
  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    const projectId = new ObjectId('507f1f77bcf86cd799439012');
    
    // Get folder statistics for a project
    const folderStats = await searchService.getProjectFolderStats(projectId);
    
    console.log('Project Folder Statistics:');
    console.log(`Total Folders: ${folderStats.totalFolders}`);
    console.log(`Folder Depth: ${folderStats.folderDepth}`);
    
    console.log('Scripts per Folder:');
    folderStats.scriptsPerFolder.forEach(folder => {
      console.log(`  ${folder.folderName}: ${folder.scriptCount} scripts`);
    });
    
    if (folderStats.emptyFolders.length > 0) {
      console.log('Empty Folders:');
      folderStats.emptyFolders.forEach(folder => {
        console.log(`  - ${folder.folderName}`);
      });
    }
    
    return folderStats;
  } catch (error) {
    console.error('Getting project folder stats failed:', error);
    throw error;
  }
}

/**
 * Example: Database optimization and performance analysis
 */
export async function exampleDatabaseOptimization() {
  try {
    const dbService = await DatabaseService.getInstance();
    const optimizationService = dbService.getOptimizationService();
    
    // Create optimized indexes
    console.log('Creating optimized indexes...');
    const indexResult = await optimizationService.createOptimizedIndexes();
    
    console.log('Index Creation Results:');
    console.log(`Created: ${indexResult.created.length} indexes`);
    indexResult.created.forEach(index => {
      console.log(`  ✓ ${index}`);
    });
    
    if (indexResult.errors.length > 0) {
      console.log(`Errors: ${indexResult.errors.length}`);
      indexResult.errors.forEach(error => {
        console.log(`  ✗ ${error.index}: ${error.error}`);
      });
    }
    
    // Analyze query performance
    console.log('\nAnalyzing query performance...');
    const performance = await optimizationService.analyzeQueryPerformance();
    
    console.log('Query Performance Analysis:');
    performance.queries.forEach(query => {
      console.log(`${query.name}:`);
      console.log(`  Collection: ${query.collection}`);
      console.log(`  Execution Time: ${query.executionTimeMs}ms`);
      console.log(`  Docs Examined: ${query.docsExamined}`);
      console.log(`  Docs Returned: ${query.docsReturned}`);
      console.log(`  Efficient: ${query.efficient ? '✓' : '✗'}`);
      console.log(`  Indexes Used: ${query.indexesUsed.join(', ') || 'None'}`);
    });
    
    // Get optimization suggestions
    console.log('\nGetting optimization suggestions...');
    const suggestions = await optimizationService.optimizeCollectionPerformance('scripts');
    
    console.log('Optimization Suggestions for Scripts Collection:');
    console.log(`Current Indexes: ${suggestions.currentIndexes.join(', ')}`);
    console.log(`Estimated Improvement: ${suggestions.estimatedImprovement}`);
    
    if (suggestions.suggestions.length > 0) {
      console.log('Recommendations:');
      suggestions.suggestions.forEach(suggestion => {
        console.log(`  [${suggestion.impact.toUpperCase()}] ${suggestion.type}: ${suggestion.description}`);
      });
    }
    
    return {
      indexResult,
      performance,
      suggestions
    };
  } catch (error) {
    console.error('Database optimization failed:', error);
    throw error;
  }
}

/**
 * Example: Monitoring index usage
 */
export async function exampleIndexUsageMonitoring() {
  try {
    const dbService = await DatabaseService.getInstance();
    const optimizationService = dbService.getOptimizationService();
    
    // Get index usage statistics
    const indexStats = await optimizationService.getIndexUsageStats();
    
    console.log('Index Usage Statistics:');
    indexStats.collections.forEach(collection => {
      console.log(`\n${collection.name} Collection:`);
      collection.indexes.forEach(index => {
        console.log(`  ${index.name}:`);
        console.log(`    Usage Count: ${index.usageCount}`);
        console.log(`    Last Used: ${index.lastUsed?.toDateString() || 'Never'}`);
        console.log(`    Size: ${index.size} fields`);
      });
    });
    
    return indexStats;
  } catch (error) {
    console.error('Index usage monitoring failed:', error);
    throw error;
  }
}

/**
 * Example: Complete workflow demonstrating all features
 */
export async function exampleCompleteWorkflow() {
  console.log('=== Search and Optimization Complete Workflow ===\n');
  
  try {
    // 1. Database optimization
    console.log('1. Setting up database optimization...');
    await exampleDatabaseOptimization();
    
    // 2. Search functionality
    console.log('\n2. Demonstrating search functionality...');
    await exampleGlobalSearch();
    await exampleAdvancedScriptSearch();
    await exampleSearchSuggestions();
    
    // 3. Analytics and statistics
    console.log('\n3. Generating analytics and statistics...');
    await exampleUserStatistics();
    await exampleProjectFolderStats();
    
    // 4. Performance monitoring
    console.log('\n4. Monitoring performance...');
    await exampleIndexUsageMonitoring();
    
    console.log('\n=== Workflow completed successfully! ===');
  } catch (error) {
    console.error('Workflow failed:', error);
    throw error;
  }
}

// Export all examples for easy usage
export const searchOptimizationExamples = {
  globalSearch: exampleGlobalSearch,
  advancedScriptSearch: exampleAdvancedScriptSearch,
  searchSuggestions: exampleSearchSuggestions,
  userStatistics: exampleUserStatistics,
  projectFolderStats: exampleProjectFolderStats,
  databaseOptimization: exampleDatabaseOptimization,
  indexUsageMonitoring: exampleIndexUsageMonitoring,
  completeWorkflow: exampleCompleteWorkflow
};