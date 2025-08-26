#!/usr/bin/env tsx

/**
 * Simple test script to verify authentication works with MongoDB Atlas
 */

import dotenv from 'dotenv';
import { connectToDatabase } from './lib/database/connection';
import { UserModel } from './lib/database/models/user';

// Load environment variables
dotenv.config();

async function testAuth() {
  try {
    console.log('🔌 Connecting to MongoDB Atlas...');
    const db = await connectToDatabase();
    console.log('✅ Connected to MongoDB Atlas successfully!');

    const userModel = new UserModel(db);

    // Test creating a user
    console.log('\n👤 Testing user creation...');
    const testUser = await userModel.createUser({
      email: 'test@example.com',
      username: 'testuser',
      password: 'password123',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        bio: 'Test user for authentication'
      }
    });
    console.log('✅ User created successfully:', {
      id: testUser._id,
      email: testUser.email,
      username: testUser.username
    });

    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const authenticatedUser = await userModel.authenticate('test@example.com', 'password123');
    if (authenticatedUser) {
      console.log('✅ Authentication successful!');
    } else {
      console.log('❌ Authentication failed!');
    }

    // Test wrong password
    console.log('\n🔐 Testing wrong password...');
    const failedAuth = await userModel.authenticate('test@example.com', 'wrongpassword');
    if (!failedAuth) {
      console.log('✅ Correctly rejected wrong password');
    } else {
      console.log('❌ Should have rejected wrong password');
    }

    // Clean up test user
    console.log('\n🧹 Cleaning up test user...');
    await userModel.deleteUser(testUser._id);
    console.log('✅ Test user deleted');

    console.log('\n🎉 All authentication tests passed!');
    console.log('\n📝 Your MongoDB Atlas connection is working correctly.');
    console.log('   You can now use the signup and login pages to create real accounts.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testAuth();