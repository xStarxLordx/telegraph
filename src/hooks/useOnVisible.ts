import { useEffect, useState } from 'react';

const ROOT_MARGIN = '300px';

export default function useOnVisible(onVisible: () => void, enabled: boolean) {
  const [node, setNode] = useState<Element | null>(null);

  useEffect(() => {
    if (!enabled || node === null || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onVisible();
      },
      { rootMargin: ROOT_MARGIN },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node, onVisible]);

  return setNode;
}
