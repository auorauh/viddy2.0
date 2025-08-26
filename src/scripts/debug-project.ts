#!/usr/bin/env node

/**
 * Debug script to help troubleshoot the project 404 issue
 */

import { connectToDatabase } from '../lib/database/connection';
import { dbSeeder } from '../lib/database/seed';
import { dbDebugger } from '../lib/database/debug-utils';

async function main() {
  try {
    console.log('🔍 Starting project debug session...\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    await connectToDatabase();
    console.log('✅ Connected to database\n');

    // Check database health
    console.log('🏥 Checking database health...');
    const health = await dbDebugger.checkDatabaseHealth();
    console.log('Database Health:', {
      connected: health.connected,
      collections: health.collections,
      counts: {
        projects: health.projectsCount,
        users: health.usersCount,
        scripts: health.scriptsCount
      }
    });
    console.log('');

    // Check the specific problematic project ID
    const problematicId = '68ac6f41d67e53d6eba7802d';
    console.log(`🔍 Checking problematic project ID: ${problematicId}`);
    const projectCheck = await dbSeeder.checkProjectId(problematicId);
    console.log('Project Check Result:', projectCheck);
    console.log('');

    // List all existing projects
    console.log('📋 Listing all projects in database...');
    const allProjects = await dbDebugger.listAllProjects();
    console.log(`Found ${allProjects.total} projects:`);
    allProjects.projects.forEach(project => {
      console.log(`  - ${project._id} | ${project.title} | User: ${project.userId}`);
    });
    console.log('');

    // If no projects exist, create some sample data
    if (allProjects.total === 0) {
      console.log('🌱 No projects found. Creating sample data...');
      const sampleData = await dbSeeder.createTestUserAndProject();
      console.log('✅ Sample data created:');
      console.log('  User:', sampleData.user);
      console.log('  Project:', sampleData.project);
      console.log('');
      
      console.log('🎯 You can now test with this project ID:', sampleData.project._id);
    } else {
      console.log('💡 Try using one of the existing project IDs above');
    }

    console.log('🎉 Debug session completed!');
    
  } catch (error) {
    console.error('❌ Debug session failed:', error);
    process.exit(1);
  }
}

// Run the debug script
if (require.main === module) {
  main().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { main as debugProject };