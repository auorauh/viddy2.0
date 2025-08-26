# Debugging Project 404 Error

## Issue
Getting a 404 error when trying to load project with ID: `68ac6f41d67e53d6eba7802d`

## Debugging Steps

### 1. Check Database Connection
```bash
npm run debug:project
```

This will:
- Connect to the database
- Check database health
- List all existing projects
- Verify the problematic project ID
- Create sample data if none exists

### 2. Manual API Testing

#### Check Database Health
```bash
curl http://localhost:3000/api/health/db
```

#### List All Projects (requires authentication)
```bash
curl http://localhost:3000/api/debug/projects
```

#### Debug Specific Project ID
```bash
curl http://localhost:3000/api/debug/projects/68ac6f41d67e53d6eba7802d
```

#### Create Sample Data
```bash
curl -X POST http://localhost:3000/api/debug/sample-data
```

### 3. Common Causes and Solutions

#### Cause 1: Invalid ObjectId Format
**Problem**: The ID `68ac6f41d67e53d6eba7802d` might not be a valid MongoDB ObjectId.
**Check**: ObjectIds must be exactly 24 characters of hexadecimal.
**Solution**: Use a valid ObjectId or create new test data.

#### Cause 2: Project Doesn't Exist
**Problem**: The project was never created or was deleted.
**Check**: Run the debug script to see all existing projects.
**Solution**: Use an existing project ID or create new test data.

#### Cause 3: Database Connection Issues
**Problem**: The application can't connect to MongoDB.
**Check**: Verify `.env` file has correct `MONGODB_URI`.
**Solution**: Fix connection string or start MongoDB service.

#### Cause 4: Authentication Issues
**Problem**: User is not authenticated or doesn't own the project.
**Check**: Verify JWT token and user ownership.
**Solution**: Login with correct user or use a project owned by the current user.

### 4. Environment Setup

Make sure your `.env` file contains:
```
MONGODB_URI=mongodb://localhost:27017/your-database-name
JWT_SECRET=your-jwt-secret
NODE_ENV=development
```

### 5. Quick Fix - Create Test Data

If you need immediate test data:

```bash
# Run the debug script
npm run debug:project

# Or use the API endpoint
curl -X POST http://localhost:3000/api/debug/sample-data
```

This will create a test user and project that you can use for testing.

### 6. Verify the Fix

After creating test data:
1. Note the new project ID from the debug output
2. Update your frontend to use the new project ID
3. Test the project loading functionality

### 7. Production Considerations

The debug endpoints are only available in development mode. In production:
- Use proper logging to track down issues
- Implement proper error handling
- Use monitoring tools to track 404 errors
- Ensure proper data seeding in production deployments

## Next Steps

1. Run `npm run debug:project` to identify the root cause
2. Use the output to determine if you need new test data or if there's a deeper issue
3. Update your application to use valid project IDs
4. Consider implementing better error handling for missing projects in your UI