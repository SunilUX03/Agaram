import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import { EmptyState, ErrorState } from './EmptyState';
import { Skeleton, type SkeletonVariant } from './Skeleton';

interface Props<T> {
  query: UseQueryResult<T>;
  skeleton?: SkeletonVariant;
  skeletonCount?: number;
  /** Shown instead of the content when the data is an empty list. */
  empty?: { message: string; actionLabel?: string; to?: string; onAction?: () => void };
  /** Custom skeleton, for example a grid of cards. */
  skeletonNode?: ReactNode;
  children: (data: T) => ReactNode;
}

/** The three standard states for any list: skeleton while loading, friendly error with Retry, helpful empty. */
export function QueryView<T>({
  query,
  skeleton = 'row',
  skeletonCount = 4,
  skeletonNode,
  empty,
  children,
}: Props<T>) {
  if (query.isPending)
    return <>{skeletonNode ?? <Skeleton variant={skeleton} count={skeletonCount} />}</>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  const data = query.data;
  if (empty && Array.isArray(data) && data.length === 0) return <EmptyState {...empty} />;
  return <>{children(data)}</>;
}
