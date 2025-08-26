import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Settings, Users, FileText, Folder, Plus } from 'lucide-react';
import { useProject, useProjectFolders } from '@/hooks/api/useProjects';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  
  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Invalid Project</h2>
          <p className="text-muted-foreground mb-4">No project ID provided</p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { data: project, isLoading, error } = useProject(id);
  const { data: folders } = useProjectFolders(id);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || 'The project you are looking for does not exist or you do not have access to it.'}
          </p>
          <Link to="/dashboard">
            <Button>Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {project.title}
            </h1>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {project.settings?.isPublic && (
            <Badge variant="secondary">
              <Users className="h-3 w-3 mr-1" />
              Public
            </Badge>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Project Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scripts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.stats?.totalScripts || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Folders</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{project.folders?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {new Date(project.stats?.lastActivity || project.updatedAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Link to={`/studio/${id}`}>
              <Button size="sm" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                New Script
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Folders */}
      <Card>
        <CardHeader>
          <CardTitle>Project Structure</CardTitle>
          <CardDescription>
            Folders and organization within this project
          </CardDescription>
        </CardHeader>
        <CardContent>
          {project.folders && project.folders.length > 0 ? (
            <div className="space-y-2">
              {project.folders.map((folder) => (
                <div key={folder.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Folder className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium">{folder.name}</h4>
                      <p className="text-sm text-gray-500">
                        {folder.scriptCount} scripts
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Open
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No folders yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create your first folder to organize your scripts
              </p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Folder
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}