import {ObjectId, Collection, Db} from "mongodb";
import bcrypt from "bcryptjs";
import {User, UserInput, UserUpdateInput, ProjectView, Theme} from "../types";
import {validateUser, validateCreateUserInput, validateUpdateUserInput} from "../validation";
import {DatabaseError, ValidationError, DuplicateKeyError, NotFoundError} from "../errors";

export class UserModel {
  private collection: Collection<User>;

  constructor(db: Db) {
    this.collection = db.collection<User>("users");
    this.ensureIndexes();
  }

  /**
   * Ensure proper indexes are created for the users collection
   */
  private async ensureIndexes(): Promise<void> {
    const safeCreate = async (keys: any, options: any = {}) => {
      try {
        await this.collection.createIndex(keys, options);
      } catch (error: any) {
        if (error?.code === 85 || error?.codeName === "IndexOptionsConflict" || /Index already exists/i.test(error?.message || "")) {
          return;
        }
        console.warn("Failed to create user index:", error);
      }
    };

    // Unique index on email
    await safeCreate({email: 1}, {name: "users_unique_email", unique: true});

    // Unique index on username
    await safeCreate({username: 1}, {name: "users_unique_username", unique: true});

    // Compound index for username and email lookups
    await safeCreate({username: 1, email: 1}, {name: "users_by_username_email"});

    // Index on updatedAt for sorting recent users
    await safeCreate({updatedAt: -1}, {name: "users_by_updatedAt"});
  }

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new ValidationError("Password must be at least 6 characters long");
    }

    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) {
      return false;
    }

    return bcrypt.compare(password, hash);
  }

  /**
   * Create a new user with hashed password
   */
  async createUser(userData: Omit<UserInput, "passwordHash"> & {password: string}): Promise<User> {
    try {
      // Hash the password
      const passwordHash = await UserModel.hashPassword(userData.password);

      // Prepare user data with defaults
      const now = new Date();
      const userInput: UserInput = {
        email: userData.email.toLowerCase().trim(),
        username: userData.username.trim(),
        passwordHash,
        profile: userData.profile || {},
        preferences: userData.preferences || {
          defaultProjectView: ProjectView.GRID,
          theme: Theme.LIGHT,
        },
      };

      // Validate input - this will throw ValidationError if invalid
      try {
        validateCreateUserInput(userInput);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Create user document
      const user: User = {
        _id: new ObjectId(),
        ...userInput,
        createdAt: now,
        updatedAt: now,
      };

      // Validate complete user object
      try {
        validateUser(user);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Insert into database
      const result = await this.collection.insertOne(user);

      if (!result.acknowledged) {
        throw new DatabaseError("Failed to create user");
      }

      return user;
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        const field = error.keyPattern?.email ? "email" : "username";
        throw new DuplicateKeyError(`User with this ${field} already exists`);
      }

      if (error instanceof ValidationError || error instanceof DuplicateKeyError) {
        throw error;
      }

      throw new DatabaseError(`Failed to create user: ${error.message}`);
    }
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      if (!email) {
        throw new ValidationError("Email is required");
      }

      const user = await this.collection.findOne({
        email: email.toLowerCase().trim(),
      });

      return user;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find user by email: ${error.message}`);
    }
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<User | null> {
    try {
      if (!username) {
        throw new ValidationError("Username is required");
      }

      const user = await this.collection.findOne({
        username: username.trim(),
      });

      return user;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Failed to find user by username: ${error.message}`);
    }
  }

  /**
   * Find user by ID
   */
  async findById(id: string | ObjectId): Promise<User | null> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const user = await this.collection.findOne({_id: objectId});

      return user;
    } catch (error: any) {
      if (error.message?.includes("ObjectId") || error.message?.includes("hex string") || error.message?.includes("24 character")) {
        throw new ValidationError("Invalid user ID format");
      }
      throw new DatabaseError(`Failed to find user by ID: ${error.message}`);
    }
  }

  /**
   * Authenticate user with email/username and password
   */
  async authenticate(identifier: string, password: string): Promise<User | null> {
    try {
      if (!identifier || !password) {
        throw new ValidationError("Email/username and password are required");
      }

      // Try to find user by email first, then username
      let user = await this.findByEmail(identifier);
      if (!user) {
        user = await this.findByUsername(identifier);
      }

      if (!user) {
        return null;
      }

      // Verify password
      const isValidPassword = await UserModel.verifyPassword(password, user.passwordHash);

      return isValidPassword ? user : null;
    } catch (error: any) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new DatabaseError(`Authentication failed: ${error.message}`);
    }
  }

  /**
   * Update user information
   */
  async updateUser(id: string | ObjectId, updateData: UserUpdateInput): Promise<User> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      // Prepare update document with normalization first
      const updateDoc: any = {
        ...updateData,
        updatedAt: new Date(),
      };

      // Normalize email and username if provided
      if (updateDoc.email) {
        updateDoc.email = updateDoc.email.toLowerCase().trim();
      }
      if (updateDoc.username) {
        updateDoc.username = updateDoc.username.trim();
      }

      // Validate update data after normalization
      try {
        validateUpdateUserInput(updateDoc);
      } catch (validationError: any) {
        throw new ValidationError(validationError.message);
      }

      // Update user
      const result = await this.collection.findOneAndUpdate({_id: objectId}, {$set: updateDoc}, {returnDocument: "after"});

      if (!result) {
        throw new NotFoundError("User not found");
      }

      return result;
    } catch (error: any) {
      if (error.code === 11000) {
        // Duplicate key error
        const field = error.keyPattern?.email ? "email" : "username";
        throw new DuplicateKeyError(`User with this ${field} already exists`);
      }

      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof DuplicateKeyError) {
        throw error;
      }

      throw new DatabaseError(`Failed to update user: ${error.message}`);
    }
  }

  /**
   * Update user password
   */
  async updatePassword(id: string | ObjectId, currentPassword: string, newPassword: string): Promise<void> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      // Find user
      const user = await this.findById(objectId);
      if (!user) {
        throw new NotFoundError("User not found");
      }

      // Verify current password
      const isValidPassword = await UserModel.verifyPassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        throw new ValidationError("Current password is incorrect");
      }

      // Hash new password
      const newPasswordHash = await UserModel.hashPassword(newPassword);

      // Update password
      const result = await this.collection.updateOne(
        {_id: objectId},
        {
          $set: {
            passwordHash: newPasswordHash,
            updatedAt: new Date(),
          },
        },
      );

      if (result.matchedCount === 0) {
        throw new NotFoundError("User not found");
      }
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to update password: ${error.message}`);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(id: string | ObjectId): Promise<void> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      const result = await this.collection.deleteOne({_id: objectId});

      if (result.deletedCount === 0) {
        throw new NotFoundError("User not found");
      }
    } catch (error: any) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new DatabaseError(`Failed to delete user: ${error.message}`);
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        email: email.toLowerCase().trim(),
      });
      return count > 0;
    } catch (error: any) {
      throw new DatabaseError(`Failed to check email existence: ${error.message}`);
    }
  }

  /**
   * Check if username exists
   */
  async usernameExists(username: string): Promise<boolean> {
    try {
      const count = await this.collection.countDocuments({
        username: username.trim(),
      });
      return count > 0;
    } catch (error: any) {
      throw new DatabaseError(`Failed to check username existence: ${error.message}`);
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats(id: string | ObjectId): Promise<{projectCount: number; scriptCount: number}> {
    try {
      const objectId = typeof id === "string" ? new ObjectId(id) : id;

      // This would typically involve aggregation with other collections
      // For now, return basic structure
      return {
        projectCount: 0,
        scriptCount: 0,
      };
    } catch (error: any) {
      throw new DatabaseError(`Failed to get user stats: ${error.message}`);
    }
  }
}
