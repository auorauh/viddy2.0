#!/usr/bin/env node

/**
 * Test script to verify project creation and retrieval flow
 */

import { connectToDatabase } from '../lib/database/connection';
import { dbSeeder } from '../lib/database/seed';
import { ProjectRepository } from '../lib/database/repositories/project-repository';
import { ProjectModel } from '../lib/database/models/project';
import { UserRepository } from '../lib/database/repositories/user-repository';
import { UserModel } from '../lib/database/models/user';

async function testProjectFlow() {
  try {
    console.log('🧪 Testing project creation and retrieval flow...\n');

    // Connect to database
    console.log('📡 Connecting to database...');
    const db = await connectToDatabase();
    console.log('✅ Connected to database\n');

    const userRepo = new UserRepository(new UserModel(db));
    const projectRepo = new ProjectRepository(new ProjectModel(db));

    // Create a test user
    console.log('👤 Creating test user...');
    const userData = {
      email: 'testflow@example.com',
      username: 'testflow',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'Flow'
      }
    };

    let user;
    try {
      user = await userRepo.createUser(userData);
      console.log('✅ User created:', user.username);
    } catch (error: any) {
      if (error.message.includes('duplicate')) {
        console.log('ℹ️  User already exists, finding existing user...');
        user = await userRepo.findByEmail(userData.email);
        if (!user) {
          throw new Error('Could not find or create test user');
        }
        console.log('✅ Found existing user:', user.username);
      } else {
        throw error;
      }
    }

    // Create a test project
    console.log('\n📁 Creating test project...');
    const projectData = {
      title: 'Test Flow Project',
      description: 'A project to test the creation and retrieval flow',
      settings: {
        isPublic: false,
        allowCollaboration: true
      }
    };

    const project = await projectRepo.createProject(user._id, projectData);
    console.log('✅ Project created:', {
      id: project._id.toString(),
      title: project.title,
      folders: project.folders.length,
      stats: project.stats
    });

    // Retrieve the project
    console.log('\n🔍 Retrieving project by ID...');
    const retrievedProject = await projectRepo.getProjectById(project._id);
    console.log('✅ Project retrieved:', {
      id: retrievedProject._id.toString(),
      title: retrievedProject.title,
      folders: retrievedProject.folders.length
    });

    // Get user projects
    console.log('\n📋 Getting user projects...');
    const userProjects = await projectRepo.getUserProjects(user._id);
    console.log('✅ User projects retrieved:', {
      total: userProjects.total,
      projects: userProjects.projects.map(p => ({
        id: p._id.toString(),
        title: p.title
      }))
    });

    // Check project ownership
    console.log('\n🔐 Checking project ownership...');
    const isOwner = await projectRepo.isProjectOwner(project._id, user._id);
    console.log('✅ Ownership check:', isOwner);

    console.log('\n🎉 All tests passed! Project flow is working correctly.');
    console.log(`\n💡 You can now test with project ID: ${project._id.toString()}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testProjectFlow().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { testProjectFlow };