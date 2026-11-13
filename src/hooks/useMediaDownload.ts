import { useCallback, useState } from 'react';
import { MediaKind } from '../domain/media';
import type { MediaDownload } from '../interfaces/hooks';
import type { MediaAttachment } from '../interfaces/media';
import downloadFile from '../utils/downloadFile';
import useAsyncAction from './useAsyncAction';

/** The extension a download gets when the host doesn't report the file's type. */
const FALLBACK_EXTENSION = {
  [MediaKind.GIF]: 'gif',
  [MediaKind.IMAGE]: 'jpg',
  [MediaKind.VIDEO]: 'mp4',
};

/**
 * Downloads a tweet's media as `<fileName>.<extension>`. `blocked` turns true when the file
 * couldn't be fetched from here, so the UI can offer a link to open it instead.
 */
export default function useMediaDownload(media: MediaAttachment, fileName: string): MediaDownload {
  const [blocked, setBlocked] = useState(false);
  const { run, pending } = useAsyncAction(() =>
    downloadFile(media.url, fileName, FALLBACK_EXTENSION[media.kind]),
  );

  const download = useCallback(async () => {
    setBlocked(false);
    const result = await run();
    // An unexpected failure gets the same way out as a refusal.
    setBlocked(!result.ok || result.value === 'blocked');
  }, [run]);

  return { download, pending, blocked };
}
