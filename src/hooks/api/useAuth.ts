/**
 * Authentication hooks using React Query
 */

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/lib/api';
import type {
  User,
  CreateUserRequest,
  LoginRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserStats,
} from '@/lib/api/types';

// Query keys
export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
  stats: () => [...authKeys.all, 'stats'] as const,
};

/**
 * Hook to get current user profile
 */
export function useProfile() {
  const [hasToken, setHasToken] = React.useState(false);

  React.useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setHasToken(!!token);
  }, []);

  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: () => userService.getProfile(),
    enabled: hasToken, // Only run query if token exists
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.status === 401) return false;
      return failureCount < 3;
    },
  });
}

/**
 * Hook to get user statistics
 */
export function useUserStats() {
  return useQuery({
    queryKey: authKeys.stats(),
    queryFn: () => userService.getStats(),
  });
}

/**
 * Hook for user registration
 */
export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserRequest) => userService.register(userData),
    onSuccess: (data) => {
      // Set user data in cache and invalidate to refetch
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

/**
 * Hook for user login
 */
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginRequest) => userService.login(credentials),
    onSuccess: (data) => {
      // Set user data in cache and invalidate to refetch
      queryClient.setQueryData(authKeys.profile(), data.user);
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

/**
 * Hook for user logout
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.logout(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

/**
 * Hook to update user profile
 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updateData: UpdateUserRequest) => userService.updateProfile(updateData),
    onSuccess: (updatedUser) => {
      // Update user data in cache
      queryClient.setQueryData(authKeys.profile(), updatedUser);
      // Invalidate stats in case they changed
      queryClient.invalidateQueries({ queryKey: authKeys.stats() });
    },
  });
}

/**
 * Hook to change user password
 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (passwordData: ChangePasswordRequest) => userService.changePassword(passwordData),
  });
}

/**
 * Hook to delete user account
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userService.deleteAccount(),
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
    },
  });
}

/**
 * Hook to check email/username availability
 */
export function useCheckAvailability() {
  return useMutation({
    mutationFn: (data: { email?: string; username?: string }) =>
      userService.checkAvailability(data),
  });
}

/**
 * Hook to refresh authentication token
 */
export function useRefreshToken() {
  return useMutation({
    mutationFn: () => userService.refreshToken(),
  });
}