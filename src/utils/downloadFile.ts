import { mediaExtensionOf } from '../domain/media';
import type { DownloadOutcome } from '../interfaces/media';

/** How long the temporary URL of the file lives: some browsers need it a moment after the click. */
export const RELEASE_DELAY_MS = 1000;

/**
 * Saves the file at `url` to the device as `<baseName>.<extension>`. A link's `download`
 * attribute is ignored for another site's files (the demo pictures, Cloud Storage), so the file
 * is fetched and saved from memory instead. The extension comes from the file's real type, or is
 * `fallbackExtension` when the host doesn't say.
 *
 * When the host refuses the request (no CORS) or fails, nothing is saved and it resolves to
 * `blocked`, so the caller can offer a link that opens the file in a new tab.
 */
export default async function downloadFile(
  url: string,
  baseName: string,
  fallbackExtension: string,
): Promise<DownloadOutcome> {
  let blob: Blob;
  try {
    const response = await fetch(url);
    if (!response.ok) return 'blocked';
    blob = await response.blob();
  } catch {
    return 'blocked';
  }

  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = `${baseName}.${mediaExtensionOf(blob.type) ?? fallbackExtension}`;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), RELEASE_DELAY_MS);
  return 'saved';
}
