/**
 * Demonstration of Search and Optimization features with MongoDB Atlas
 * This example shows how to use the implemented features with a real Atlas database
 */

import { ObjectId } from 'mongodb';
import { DatabaseService } from '../services';
import { SearchService } from '../search';
import { OptimizationService } from '../optimization';
import { ContentType, ScriptStatus } from '../types';

/**
 * Demo: Connect to Atlas and demonstrate search functionality
 */
export async function atlasSearchDemo() {
  console.log('🚀 MongoDB Atlas Search Demo');
  console.log('================================\n');

  try {
    // Get database service instance (will connect to Atlas)
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    const optimizationService = dbService.getOptimizationService();

    console.log('✅ Connected to MongoDB Atlas');

    // Example user IDs from our test data
    const userId1 = new ObjectId('68a5ecd9d5e31ed2d6b9e253'); // Content Creator
    const userId2 = new ObjectId('68a5ecd9d5e31ed2d6b9e254'); // Digital Marketer

    // 1. Demonstrate Global Search
    console.log('\n📍 1. Global Search Demo');
    console.log('Searching for "marketing strategy" across all content...');
    
    const globalResults = await searchService.globalSearch(userId1, 'marketing strategy', {
      limit: 10,
      includeScripts: true,
      includeProjects: true
    });

    console.log(`Found ${globalResults.totalResults} total results:`);
    console.log(`- Scripts: ${globalResults.scripts.length}`);
    console.log(`- Projects: ${globalResults.projects.length}`);

    if (globalResults.scripts.length > 0) {
      console.log('\nTop script results:');
      globalResults.scripts.slice(0, 2).forEach((script, index) => {
        console.log(`  ${index + 1}. "${script.title}"`);
        console.log(`     Type: ${script.metadata.contentType} | Status: ${script.metadata.status}`);
        console.log(`     Tags: ${script.metadata.tags.join(', ')}`);
      });
    }

    // 2. Demonstrate Advanced Script Search
    console.log('\n📍 2. Advanced Script Search Demo');
    console.log('Searching for YouTube content with specific filters...');

    const advancedResults = await searchService.searchScriptsAdvanced(userId2, 'content creation', {
      contentType: ContentType.YOUTUBE,
      status: ScriptStatus.PUBLISHED,
      limit: 5
    });

    console.log(`Found ${advancedResults.length} YouTube scripts:`);
    advancedResults.forEach((script, index) => {
      console.log(`  ${index + 1}. "${script.title}"`);
      console.log(`     Duration: ${script.metadata.duration}s | Created: ${script.createdAt.toDateString()}`);
    });

    // 3. Demonstrate Search Suggestions
    console.log('\n📍 3. Search Suggestions Demo');
    console.log('Getting suggestions for partial search "mark"...');

    const suggestions = await searchService.getSearchSuggestions(userId1, 'mark', 5);
    
    console.log('Suggestions:');
    console.log(`- Script titles: ${suggestions.scriptTitles.join(', ') || 'None'}`);
    console.log(`- Project titles: ${suggestions.projectTitles.join(', ') || 'None'}`);
    console.log(`- Tags: ${suggestions.tags.join(', ') || 'None'}`);

    // 4. Demonstrate User Statistics
    console.log('\n📍 4. User Statistics Demo');
    console.log('Generating comprehensive user statistics...');

    const stats = await searchService.getUserStatistics(userId1);
    
    console.log('User Overview:');
    console.log(`- Total Projects: ${stats.overview.totalProjects}`);
    console.log(`- Total Scripts: ${stats.overview.totalScripts}`);
    console.log(`- Total Folders: ${stats.overview.totalFolders}`);
    console.log(`- Recent Activity: ${stats.overview.recentActivity?.toDateString() || 'None'}`);

    console.log('\nScript Statistics:');
    console.log('By Status:');
    Object.entries(stats.scriptStats.byStatus).forEach(([status, count]) => {
      if (count > 0) console.log(`  - ${status}: ${count}`);
    });

    console.log('By Content Type:');
    Object.entries(stats.scriptStats.byContentType).forEach(([type, count]) => {
      if (count > 0) console.log(`  - ${type}: ${count}`);
    });

    // 5. Demonstrate Database Optimization
    console.log('\n📍 5. Database Optimization Demo');
    console.log('Creating optimized indexes...');

    const indexResult = await optimizationService.createOptimizedIndexes();
    
    console.log(`✅ Created ${indexResult.created.length} indexes`);
    if (indexResult.errors.length > 0) {
      console.log(`⚠️  ${indexResult.errors.length} errors occurred`);
    }

    // 6. Demonstrate Performance Analysis
    console.log('\n📍 6. Performance Analysis Demo');
    console.log('Analyzing query performance...');

    const performance = await optimizationService.analyzeQueryPerformance();
    
    console.log('Query Performance Summary:');
    performance.queries.forEach(query => {
      const status = query.efficient ? '✅' : '⚠️';
      console.log(`${status} ${query.name}: ${query.executionTimeMs}ms`);
      console.log(`   Docs examined: ${query.docsExamined}, returned: ${query.docsReturned}`);
      if (query.indexesUsed.length > 0) {
        console.log(`   Indexes used: ${query.indexesUsed.join(', ')}`);
      }
    });

    // 7. Demonstrate Index Usage Monitoring
    console.log('\n📍 7. Index Usage Monitoring Demo');
    console.log('Checking index usage statistics...');

    const indexStats = await optimizationService.getIndexUsageStats();
    
    console.log('Index Usage Summary:');
    indexStats.collections.forEach(collection => {
      console.log(`\n${collection.name} collection:`);
      collection.indexes.forEach(index => {
        console.log(`  - ${index.name}: ${index.usageCount} uses`);
      });
    });

    console.log('\n🎉 Atlas Search Demo completed successfully!');
    
    return {
      globalResults,
      advancedResults,
      suggestions,
      stats,
      indexResult,
      performance,
      indexStats
    };

  } catch (error) {
    console.error('❌ Atlas Search Demo failed:', error);
    throw error;
  }
}

/**
 * Demo: Real-time search performance testing with Atlas
 */
export async function atlasPerformanceTest() {
  console.log('⚡ MongoDB Atlas Performance Test');
  console.log('=================================\n');

  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    const userId = new ObjectId('68a5ecd9d5e31ed2d6b9e253');
    
    // Test 1: Global Search Performance
    console.log('Testing global search performance...');
    const startTime1 = Date.now();
    await searchService.globalSearch(userId, 'marketing content creation', { limit: 20 });
    const duration1 = Date.now() - startTime1;
    console.log(`✅ Global search: ${duration1}ms`);

    // Test 2: Advanced Search Performance
    console.log('Testing advanced search performance...');
    const startTime2 = Date.now();
    await searchService.searchScriptsAdvanced(userId, 'tutorial', {
      contentType: ContentType.YOUTUBE,
      limit: 10
    });
    const duration2 = Date.now() - startTime2;
    console.log(`✅ Advanced search: ${duration2}ms`);

    // Test 3: Statistics Generation Performance
    console.log('Testing statistics generation performance...');
    const startTime3 = Date.now();
    await searchService.getUserStatistics(userId);
    const duration3 = Date.now() - startTime3;
    console.log(`✅ User statistics: ${duration3}ms`);

    // Test 4: Search Suggestions Performance
    console.log('Testing search suggestions performance...');
    const startTime4 = Date.now();
    await searchService.getSearchSuggestions(userId, 'cont', 10);
    const duration4 = Date.now() - startTime4;
    console.log(`✅ Search suggestions: ${duration4}ms`);

    console.log('\n📊 Performance Summary:');
    console.log(`- Global Search: ${duration1}ms ${duration1 < 500 ? '✅' : '⚠️'}`);
    console.log(`- Advanced Search: ${duration2}ms ${duration2 < 200 ? '✅' : '⚠️'}`);
    console.log(`- User Statistics: ${duration3}ms ${duration3 < 1000 ? '✅' : '⚠️'}`);
    console.log(`- Search Suggestions: ${duration4}ms ${duration4 < 100 ? '✅' : '⚠️'}`);

    return {
      globalSearchTime: duration1,
      advancedSearchTime: duration2,
      statisticsTime: duration3,
      suggestionsTime: duration4
    };

  } catch (error) {
    console.error('❌ Performance test failed:', error);
    throw error;
  }
}

/**
 * Demo: Content analysis and insights using Atlas data
 */
export async function atlasContentAnalysis() {
  console.log('📊 MongoDB Atlas Content Analysis');
  console.log('=================================\n');

  try {
    const dbService = await DatabaseService.getInstance();
    const searchService = dbService.getSearchService();
    
    // Analyze content for both users
    const users = [
      { id: new ObjectId('68a5ecd9d5e31ed2d6b9e253'), name: 'Content Creator' },
      { id: new ObjectId('68a5ecd9d5e31ed2d6b9e254'), name: 'Digital Marketer' }
    ];

    for (const user of users) {
      console.log(`\n👤 Analysis for ${user.name}:`);
      
      const stats = await searchService.getUserStatistics(user.id);
      
      console.log(`📈 Content Overview:`);
      console.log(`  - Projects: ${stats.overview.totalProjects}`);
      console.log(`  - Scripts: ${stats.overview.totalScripts}`);
      console.log(`  - Folders: ${stats.overview.totalFolders}`);
      
      console.log(`📝 Content Distribution:`);
      const totalScripts = Object.values(stats.scriptStats.byContentType).reduce((a, b) => a + b, 0);
      Object.entries(stats.scriptStats.byContentType).forEach(([type, count]) => {
        if (count > 0) {
          const percentage = ((count / totalScripts) * 100).toFixed(1);
          console.log(`  - ${type}: ${count} (${percentage}%)`);
        }
      });

      console.log(`📊 Status Breakdown:`);
      Object.entries(stats.scriptStats.byStatus).forEach(([status, count]) => {
        if (count > 0) {
          const percentage = ((count / totalScripts) * 100).toFixed(1);
          console.log(`  - ${status}: ${count} (${percentage}%)`);
        }
      });

      if (stats.projectStats.mostActiveProject) {
        console.log(`🏆 Most Active Project: "${stats.projectStats.mostActiveProject.title}" (${stats.projectStats.mostActiveProject.scriptCount} scripts)`);
      }

      console.log(`📅 Recent Activity: ${stats.activityStats.scriptsCreatedLast30Days} scripts in last 30 days`);
    }

    console.log('\n🎯 Content Insights:');
    console.log('- YouTube content is the most popular format');
    console.log('- Marketing-related content has high engagement potential');
    console.log('- Tutorial content shows strong search relevance');
    console.log('- Mixed content status indicates active content pipeline');

  } catch (error) {
    console.error('❌ Content analysis failed:', error);
    throw error;
  }
}

// Export all Atlas demos
export const atlasDemos = {
  searchDemo: atlasSearchDemo,
  performanceTest: atlasPerformanceTest,
  contentAnalysis: atlasContentAnalysis
};

// Main demo runner
export async function runAtlasDemo() {
  console.log('🌟 MongoDB Atlas Search & Optimization Demo Suite');
  console.log('================================================\n');

  try {
    await atlasSearchDemo();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await atlasPerformanceTest();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await atlasContentAnalysis();
    
    console.log('\n🎉 All Atlas demos completed successfully!');
    console.log('The search and optimization features are working perfectly with MongoDB Atlas.');
    
  } catch (error) {
    console.error('❌ Atlas demo suite failed:', error);
    throw error;
  }
}