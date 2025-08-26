/**
 * Example usage of the User model and authentication utilities
 * This demonstrates how to use the UserModel and UserRepository classes
 */

import { MongoClient } from 'mongodb';
import { UserModel, UserRepository } from '../index';
import { ProjectView, Theme } from '../types';

async function userModelExample() {
  // Connect to MongoDB (replace with your connection string)
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('video-content-app');

  // Initialize User model and repository
  const userModel = new UserModel(db);
  const userRepository = new UserRepository(db);

  try {
    // Example 1: Create a new user
    console.log('Creating a new user...');
    const newUser = await userRepository.create({
      email: 'john.doe@example.com',
      username: 'johndoe',
      password: 'securepassword123',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        bio: 'Content creator and video enthusiast'
      },
      preferences: {
        defaultProjectView: ProjectView.GRID,
        theme: Theme.DARK
      }
    });
    console.log('User created:', { id: newUser._id, email: newUser.email, username: newUser.username });

    // Example 2: Authenticate user
    console.log('\nAuthenticating user...');
    const authenticatedUser = await userRepository.authenticate('john.doe@example.com', 'securepassword123');
    if (authenticatedUser) {
      console.log('Authentication successful:', authenticatedUser.username);
    } else {
      console.log('Authentication failed');
    }

    // Example 3: Find user by email
    console.log('\nFinding user by email...');
    const foundUser = await userRepository.findByEmail('john.doe@example.com');
    if (foundUser) {
      console.log('User found:', foundUser.profile.firstName, foundUser.profile.lastName);
    }

    // Example 4: Update user profile
    console.log('\nUpdating user profile...');
    const updatedUser = await userRepository.update(newUser._id.toString(), {
      profile: {
        ...newUser.profile,
        bio: 'Updated bio: Professional video content creator'
      }
    });
    console.log('Profile updated:', updatedUser.profile.bio);

    // Example 5: Update password
    console.log('\nUpdating password...');
    await userRepository.updatePassword(newUser._id.toString(), 'securepassword123', 'newsecurepassword456');
    console.log('Password updated successfully');

    // Example 6: Verify new password works
    console.log('\nVerifying new password...');
    const reAuthenticatedUser = await userRepository.authenticate('john.doe@example.com', 'newsecurepassword456');
    if (reAuthenticatedUser) {
      console.log('New password authentication successful');
    }

    // Example 7: Check if email/username exists
    console.log('\nChecking existence...');
    const emailExists = await userRepository.emailExists('john.doe@example.com');
    const usernameExists = await userRepository.usernameExists('johndoe');
    console.log('Email exists:', emailExists);
    console.log('Username exists:', usernameExists);

    // Example 8: Password hashing utilities
    console.log('\nPassword hashing utilities...');
    const hashedPassword = await UserRepository.hashPassword('testpassword');
    const isValidPassword = await UserRepository.verifyPassword('testpassword', hashedPassword);
    console.log('Password hash created and verified:', isValidPassword);

    // Clean up - delete the test user
    console.log('\nCleaning up...');
    await userRepository.delete(newUser._id.toString());
    console.log('Test user deleted');

  } catch (error) {
    console.error('Error in user model example:', error);
  } finally {
    await client.close();
  }
}

// Run the example if this file is executed directly
if (require.main === module) {
  userModelExample().catch(console.error);
}

export { userModelExample };