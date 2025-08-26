import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { useCreateProject } from '@/hooks/api/useProjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isPublic: z.boolean().default(false),
  allowCollaboration: z.boolean().default(true),
  folders: z.array(z.object({
    name: z.string().min(1, 'Folder name is required'),
    parentId: z.string().optional(),
  })).default([{ name: 'Scripts' }]),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const createProjectMutation = useCreateProject();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      title: '',
      description: '',
      isPublic: false,
      allowCollaboration: true,
      folders: [{ name: 'Scripts' }],
    },
  });

  const folders = watch('folders');

  const onSubmit = async (data: CreateProjectFormData) => {
    try {
      const projectData = {
        title: data.title,
        description: data.description,
        settings: {
          isPublic: data.isPublic,
          allowCollaboration: data.allowCollaboration,
        },
      };

      const newProject = await createProjectMutation.mutateAsync(projectData);
      
      // TODO: Create additional folders if specified in the form
      // For now, the backend creates a default "Scripts" folder
      
      toast.success('Project created successfully!');
      reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Create project error:', error);
      toast.error(error.message || 'Failed to create project. Please try again.');
    }
  };

  const addFolder = () => {
    setValue('folders', [...folders, { name: '' }]);
  };

  const removeFolder = (index: number) => {
    if (folders.length > 1) {
      setValue('folders', folders.filter((_, i) => i !== index));
    }
  };

  const updateFolderName = (index: number, name: string) => {
    const updatedFolders = [...folders];
    updatedFolders[index] = { ...updatedFolders[index], name };
    setValue('folders', updatedFolders);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Set up a new project to organize your content creation workflow.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="My Awesome Content Project"
                {...register('title')}
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this project is about..."
                rows={3}
                {...register('description')}
                className={errors.description ? 'border-red-500' : ''}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Project Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Project Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Public Project</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Allow others to view this project
                  </p>
                </div>
                <Switch
                  checked={watch('isPublic')}
                  onCheckedChange={(checked) => setValue('isPublic', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Allow Collaboration</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enable team collaboration features
                  </p>
                </div>
                <Switch
                  checked={watch('allowCollaboration')}
                  onCheckedChange={(checked) => setValue('allowCollaboration', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Folder Structure */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Initial Folder Structure</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set up folders to organize your scripts
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {folders.map((folder, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    placeholder="Folder name"
                    value={folder.name}
                    onChange={(e) => updateFolderName(index, e.target.value)}
                    className="flex-1"
                  />
                  {folders.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFolder(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFolder}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Folder
              </Button>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}