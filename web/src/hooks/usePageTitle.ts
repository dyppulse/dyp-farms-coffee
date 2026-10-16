import { useEffect } from 'react';

const BASE = 'Dyp Farms Coffee';

/** Sets the browser tab title while the page is mounted. */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} | ${BASE}` : BASE;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
