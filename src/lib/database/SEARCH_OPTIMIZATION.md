# Search and Query Optimization Features

This document describes the advanced search and query optimization features implemented for the MongoDB database layer.

## Overview

The search and optimization system provides:

1. **Advanced Text Search** - Full-text search across scripts and projects with relevance scoring
2. **Aggregation Pipelines** - Complex analytics and statistics generation
3. **Query Optimization** - Automated index management and performance analysis
4. **Performance Monitoring** - Real-time query performance tracking and recommendations

## Features Implemented

### 1. Text Search Functionality

#### Global Search
- Search across both scripts and projects simultaneously
- Weighted text search with relevance scoring
- Support for multiple filters (content type, status, project, date range)
- Pagination and result limiting

```typescript
const searchResults = await searchService.globalSearch(userId, 'marketing strategy', {
  limit: 20,
  includeScripts: true,
  includeProjects: true,
  contentType: ContentType.TIKTOK,
  status: ScriptStatus.DRAFT
});
```

#### Advanced Script Search
- Multi-field text search with custom weights
- Complex filtering by metadata, tags, and date ranges
- Aggregation-based search with scoring
- Optimized for performance with proper indexing

```typescript
const scripts = await searchService.searchScriptsAdvanced(userId, 'content creation', {
  contentType: ContentType.YOUTUBE,
  status: ScriptStatus.FINAL,
  tags: ['tutorial', 'tips'],
  dateRange: { start: new Date('2024-01-01'), end: new Date('2024-12-31') }
});
```

#### Search Suggestions
- Auto-complete functionality for script titles, project titles, and tags
- Real-time suggestions based on user's existing content
- Optimized queries for fast response times

```typescript
const suggestions = await searchService.getSearchSuggestions(userId, 'mark', 10);
// Returns: { scriptTitles: [...], projectTitles: [...], tags: [...] }
```

### 2. Aggregation Pipelines for Statistics

#### User Statistics
Comprehensive analytics including:
- Overview metrics (total projects, scripts, folders)
- Script statistics by status and content type
- Monthly activity trends
- Project statistics and activity patterns
- Daily activity tracking

```typescript
const stats = await searchService.getUserStatistics(userId);
// Returns detailed statistics object with overview, scriptStats, projectStats, activityStats
```

#### Project Folder Statistics
- Folder hierarchy analysis
- Script distribution across folders
- Empty folder identification
- Folder depth calculation

```typescript
const folderStats = await searchService.getProjectFolderStats(projectId);
// Returns folder analysis with counts, depth, and distribution
```

### 3. Database Indexes for Optimal Performance

#### Optimized Index Strategy
- **Text Search Indexes**: Weighted full-text search on titles, content, and tags
- **Compound Indexes**: Multi-field indexes for common query patterns
- **Aggregation Indexes**: Specialized indexes for analytics queries
- **Performance Indexes**: Indexes optimized for sorting and filtering

#### Index Types Created
1. **Scripts Collection**:
   - `scripts_text_search`: Weighted text index (title: 10, content: 5, tags: 3)
   - `scripts_user_updated`: Compound index for user's recent scripts
   - `scripts_user_project_folder`: Compound index for folder queries
   - `scripts_user_status_updated`: Index for status filtering
   - `scripts_user_contenttype_updated`: Index for content type filtering

2. **Projects Collection**:
   - `projects_text_search`: Weighted text index (title: 10, description: 5)
   - `projects_user_updated`: Compound index for user's recent projects
   - `projects_user_activity`: Index for activity-based queries

3. **Users Collection**:
   - `users_email_unique`: Unique index on email
   - `users_username_unique`: Unique index on username
   - `users_email_username_compound`: Compound index for authentication

### 4. Performance Tests and Monitoring

#### Query Performance Analysis
- Automated analysis of common query patterns
- Execution time monitoring
- Index usage tracking
- Efficiency scoring based on docs examined vs returned

```typescript
const analysis = await optimizationService.analyzeQueryPerformance();
// Returns performance metrics for all analyzed queries
```

#### Index Usage Statistics
- Real-time index usage monitoring
- Identification of unused indexes
- Performance impact assessment

```typescript
const indexStats = await optimizationService.getIndexUsageStats();
// Returns usage statistics for all collections and indexes
```

#### Optimization Recommendations
- Automated suggestions for performance improvements
- Index creation/deletion recommendations
- Query optimization advice

```typescript
const suggestions = await optimizationService.optimizeCollectionPerformance('scripts');
// Returns optimization suggestions with impact assessment
```

## Performance Benchmarks

The implementation meets the following performance targets:

- **Global Search**: < 500ms for searches across large datasets
- **Advanced Search**: < 200ms with proper index usage
- **Search Suggestions**: < 100ms for autocomplete functionality
- **User Statistics**: < 1000ms for comprehensive analytics
- **Folder Statistics**: < 300ms for project analysis

## Usage Examples

### Basic Search
```typescript
import { DatabaseService } from './services';

const dbService = await DatabaseService.getInstance();
const searchService = dbService.getSearchService();

// Simple global search
const results = await searchService.globalSearch(userId, 'marketing');
```

### Advanced Analytics
```typescript
const optimizationService = dbService.getOptimizationService();

// Create optimized indexes
await optimizationService.createOptimizedIndexes();

// Get user statistics
const stats = await searchService.getUserStatistics(userId);

// Analyze performance
const performance = await optimizationService.analyzeQueryPerformance();
```

### Complete Workflow
```typescript
import { searchOptimizationExamples } from './examples/search-optimization-usage';

// Run complete demonstration
await searchOptimizationExamples.completeWorkflow();
```

## Integration with Existing Services

The search and optimization services are fully integrated with the existing database service layer:

```typescript
// Access through DatabaseService
const dbService = await DatabaseService.getInstance();
const allServices = dbService.getAllServices();
// Returns: { userRepository, projectRepository, scriptRepository, searchService, optimizationService }

// Health check includes new services
const health = await dbService.healthCheck();
// Includes searchService and optimizationService status
```

## Requirements Satisfied

This implementation satisfies the following requirements from the specification:

- **Requirement 3.3**: Text search across script titles and content ✅
- **Requirement 4.1**: Appropriate indexes for user lookups, project queries, and script searches ✅
- **Requirement 4.2**: Efficient population of nested folder structures and script counts ✅
- **Requirement 4.4**: Optimization for common access patterns like "user's recent scripts" and "project statistics" ✅

## Testing

The implementation includes comprehensive tests:

- **Unit Tests**: Mock-based tests for all service methods
- **Performance Tests**: Benchmarking for query execution times
- **Integration Tests**: End-to-end testing with real database operations

Run tests with:
```bash
npm test -- --run src/lib/database/__tests__/search-unit.test.ts
```

## Future Enhancements

Potential improvements for future iterations:

1. **Elasticsearch Integration**: For even more advanced search capabilities
2. **Caching Layer**: Redis integration for frequently accessed statistics
3. **Real-time Analytics**: WebSocket-based live statistics updates
4. **Machine Learning**: Content recommendation based on user behavior
5. **Search Analytics**: Track search patterns and optimize accordingly

## Troubleshooting

### Common Issues

1. **Slow Search Performance**
   - Ensure indexes are created: `await optimizationService.createOptimizedIndexes()`
   - Check index usage: `await optimizationService.getIndexUsageStats()`

2. **Memory Usage**
   - Use pagination for large result sets
   - Limit aggregation pipeline complexity
   - Monitor with `analyzeQueryPerformance()`

3. **Index Creation Errors**
   - Check MongoDB version compatibility
   - Ensure sufficient permissions
   - Review error details in `createOptimizedIndexes()` result

### Performance Monitoring

Regular monitoring recommendations:
- Run `analyzeQueryPerformance()` weekly
- Check `getIndexUsageStats()` monthly
- Review `optimizeCollectionPerformance()` suggestions quarterly