import { useSearchParams } from 'react-router-dom';

/** One value kept in the URL query (filters, search text, tabs) so Back and shared links work. */
export function useUrlState(name: string, fallback = ''): [string, (v: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(name) ?? fallback;
  const set = (v: string) => {
    const next = new URLSearchParams(params);
    if (!v || v === fallback) next.delete(name);
    else next.set(name, v);
    setParams(next, { replace: true });
  };
  return [value, set];
}
