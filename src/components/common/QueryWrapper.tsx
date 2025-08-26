/**
 * Wrapper component for handling React Query states
 */

import React from 'react';
import { LoadingState } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { ApiClientError } from '@/lib/api';

interface QueryWrapperProps {
  isLoading: boolean;
  error: Error | null;
  children: React.ReactNode;
  loadingMessage?: string;
  errorTitle?: string;
  onRetry?: () => void;
  className?: string;
}

export function QueryWrapper({
  isLoading,
  error,
  children,
  loadingMessage,
  errorTitle,
  onRetry,
  className,
}: QueryWrapperProps) {
  if (isLoading) {
    return <LoadingState message={loadingMessage} className={className} />;
  }

  if (error) {
    const errorMessage = error instanceof ApiClientError 
      ? error.message 
      : 'An unexpected error occurred';
    
    return (
      <ErrorState
        title={errorTitle}
        message={errorMessage}
        onRetry={onRetry}
        className={className}
      />
    );
  }

  return <>{children}</>;
}