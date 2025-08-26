import { describe, it, expect } from 'vitest';
import { ObjectId } from 'mongodb';
import {
  ContentType,
  ScriptStatus,
  ProjectView,
  Theme,
  User,
  Project,
  Script,
  FolderNode
} from '../types';
import {
  validateUser,
  validateProject,
  validateScript,
  validateFolderNode,
  validateCreateUserInput,
  validateCreateProjectInput,
  validateCreateScriptInput,
  findFolderById,
  validateFolderHierarchy
} from '../validation';

describe('Database Types and Validation', () => {
  describe('Enum Types', () => {
    it('should have correct ContentType values', () => {
      expect(ContentType.TIKTOK).toBe('tiktok');
      expect(ContentType.INSTAGRAM).toBe('instagram');
      expect(ContentType.YOUTUBE).toBe('youtube');
      expect(ContentType.GENERAL).toBe('general');
    });

    it('should have correct ScriptStatus values', () => {
      expect(ScriptStatus.DRAFT).toBe('draft');
      expect(ScriptStatus.REVIEW).toBe('review');
      expect(ScriptStatus.FINAL).toBe('final');
      expect(ScriptStatus.PUBLISHED).toBe('published');
    });

    it('should have correct ProjectView values', () => {
      expect(ProjectView.GRID).toBe('grid');
      expect(ProjectView.LIST).toBe('list');
    });

    it('should have correct Theme values', () => {
      expect(Theme.LIGHT).toBe('light');
      expect(Theme.DARK).toBe('dark');
    });
  });

  describe('User Validation', () => {
    const validUser: User = {
      _id: new ObjectId(),
      email: 'test@example.com',
      username: 'testuser',
      passwordHash: 'hashedpassword123',
      profile: {
        firstName: 'Test',
        lastName: 'User',
        bio: 'Test bio'
      },
      preferences: {
        defaultProjectView: ProjectView.GRID,
        theme: Theme.LIGHT
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should validate a correct user object', () => {
      expect(() => validateUser(validUser)).not.toThrow();
    });

    it('should validate user input for creation', () => {
      const userInput = {
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashedpassword123',
        profile: {
          firstName: 'Test',
          lastName: 'User'
        },
        preferences: {
          defaultProjectView: ProjectView.GRID,
          theme: Theme.LIGHT
        }
      };

      expect(() => validateCreateUserInput(userInput)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalidUser = { ...validUser, email: 'invalid-email' };
      expect(() => validateUser(invalidUser)).toThrow();
    });

    it('should reject invalid username', () => {
      const invalidUser = { ...validUser, username: 'ab' }; // too short
      expect(() => validateUser(invalidUser)).toThrow();
    });
  });

  describe('FolderNode Validation', () => {
    const validFolder: FolderNode = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Test Folder',
      scriptCount: 5,
      createdAt: new Date()
    };

    it('should validate a correct folder node', () => {
      expect(() => validateFolderNode(validFolder)).not.toThrow();
    });

    it('should validate nested folder structure', () => {
      const nestedFolder: FolderNode = {
        ...validFolder,
        children: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            name: 'Subfolder',
            parentId: validFolder.id,
            scriptCount: 2,
            createdAt: new Date()
          }
        ]
      };

      expect(() => validateFolderNode(nestedFolder)).not.toThrow();
    });
  });

  describe('Project Validation', () => {
    const validProject: Project = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      title: 'Test Project',
      description: 'A test project',
      folders: [],
      settings: {
        isPublic: false,
        allowCollaboration: true
      },
      stats: {
        totalScripts: 0,
        lastActivity: new Date()
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should validate a correct project object', () => {
      expect(() => validateProject(validProject)).not.toThrow();
    });

    it('should validate project input for creation', () => {
      const projectInput = {
        userId: new ObjectId(),
        title: 'Test Project',
        description: 'A test project',
        folders: [],
        settings: {
          isPublic: false,
          allowCollaboration: true
        },
        stats: {
          totalScripts: 0,
          lastActivity: new Date()
        }
      };

      expect(() => validateCreateProjectInput(projectInput)).not.toThrow();
    });
  });

  describe('Script Validation', () => {
    const validScript: Script = {
      _id: new ObjectId(),
      userId: new ObjectId(),
      projectId: new ObjectId(),
      folderId: '123e4567-e89b-12d3-a456-426614174000',
      title: 'Test Script',
      content: 'This is a test script content',
      metadata: {
        contentType: ContentType.TIKTOK,
        duration: 60,
        tags: ['test', 'video'],
        status: ScriptStatus.DRAFT
      },
      versions: [
        {
          version: 1,
          content: 'Initial content',
          createdAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    it('should validate a correct script object', () => {
      expect(() => validateScript(validScript)).not.toThrow();
    });

    it('should validate script input for creation', () => {
      const scriptInput = {
        userId: new ObjectId(),
        projectId: new ObjectId(),
        folderId: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Test Script',
        content: 'This is a test script content',
        metadata: {
          contentType: ContentType.TIKTOK,
          tags: ['test'],
          status: ScriptStatus.DRAFT
        }
      };

      expect(() => validateCreateScriptInput(scriptInput)).not.toThrow();
    });
  });

  describe('Folder Utility Functions', () => {
    const folders: FolderNode[] = [
      {
        id: 'folder-1',
        name: 'Root Folder 1',
        scriptCount: 3,
        createdAt: new Date(),
        children: [
          {
            id: 'folder-1-1',
            name: 'Subfolder 1-1',
            parentId: 'folder-1',
            scriptCount: 1,
            createdAt: new Date()
          }
        ]
      },
      {
        id: 'folder-2',
        name: 'Root Folder 2',
        scriptCount: 2,
        createdAt: new Date()
      }
    ];

    it('should find folder by id', () => {
      const found = findFolderById(folders, 'folder-1-1');
      expect(found).toBeTruthy();
      expect(found?.name).toBe('Subfolder 1-1');
    });

    it('should return null for non-existent folder', () => {
      const found = findFolderById(folders, 'non-existent');
      expect(found).toBeNull();
    });

    it('should validate correct folder hierarchy', () => {
      expect(validateFolderHierarchy(folders)).toBe(true);
    });

    it('should reject invalid folder hierarchy with duplicate ids', () => {
      const invalidFolders: FolderNode[] = [
        {
          id: 'duplicate-id',
          name: 'Folder 1',
          scriptCount: 0,
          createdAt: new Date()
        },
        {
          id: 'duplicate-id',
          name: 'Folder 2',
          scriptCount: 0,
          createdAt: new Date()
        }
      ];

      expect(validateFolderHierarchy(invalidFolders)).toBe(false);
    });
  });
});