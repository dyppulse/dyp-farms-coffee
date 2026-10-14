import { useCallback, useEffect, useRef, useState } from 'react';

interface ApiDataState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

/**
 * Loads data on mount (and whenever `deps` change) and exposes loading/error state plus a
 * `reload` for retry buttons. Replaces the `.then(setX).finally(...)` pattern, which hid
 * failures behind an empty page and left unhandled promise rejections.
 */
export function useApiData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): ApiDataState<T> {
  const [data, setData] = useState<T>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;
  const requestId = useRef(0);

  const load = useCallback(() => {
    const id = ++requestId.current;
    setLoading(true);
    setError(null);
    fetcherRef
      .current()
      .then((result) => {
        if (id === requestId.current) setData(result);
      })
      .catch((e) => {
        if (id === requestId.current) setError(e instanceof Error ? e.message : 'Something went wrong');
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error, reload: load };
}
