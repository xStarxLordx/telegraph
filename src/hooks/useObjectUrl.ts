import { useEffect, useMemo } from 'react';

/**
 * A temporary URL that shows a local file (a preview before uploading). It is released when the
 * file changes or the component goes away, so previews don't pile up in memory.
 */
export default function useObjectUrl(file: Blob | null): string | null {
  const url = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  return url;
}
