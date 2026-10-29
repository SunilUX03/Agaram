import { useMutation, useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';
import { api } from './api';

type Api = typeof api;
type Data<K extends keyof Api> = Awaited<ReturnType<Api[K]>>;

/** Read through the repository. Pages never import mock data directly. */
export function useQ<K extends keyof Api>(
  name: K,
  ...args: Parameters<Api[K]>
): UseQueryResult<Data<K>> {
  return useQuery({
    queryKey: [name, ...args],
    queryFn: () => (api[name] as (...a: unknown[]) => Promise<Data<K>>)(...args),
  });
}

/** Write through the repository. Every cached query refreshes afterwards, so lists update at once. */
export function useMut<K extends keyof Api>(name: K) {
  const qc = useQueryClient();
  return useMutation<Data<K>, Error, Parameters<Api[K]>>({
    mutationFn: (args) => (api[name] as (...a: unknown[]) => Promise<Data<K>>)(...args),
    onSuccess: () => qc.invalidateQueries(),
  });
}
