// What a tweet can attach: which files count as an image, a GIF or a video, and how big they may
// be. Pure, so the UI, both service implementations and the tests share one rule (`storage.rules`
// repeats the types and sizes: `storageRules.test.ts` keeps them in sync).
import type { ValidationResult } from '../interfaces/errors';
import type { MediaFileInfo, MediaKindValue } from '../interfaces/media';
import { MAX_GIF_BYTES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './constants';
import { ErrorCode } from './errors';

export const MediaKind = Object.freeze({ IMAGE: 'image', GIF: 'gif', VIDEO: 'video' });

/** SVG is left out on purpose: it can carry scripts. */
const MEDIA_TYPES: Readonly<Record<string, { kind: MediaKindValue; extension: string }>> =
  Object.freeze({
    'image/jpeg': { kind: MediaKind.IMAGE, extension: 'jpg' },
    'image/png': { kind: MediaKind.IMAGE, extension: 'png' },
    'image/webp': { kind: MediaKind.IMAGE, extension: 'webp' },
    'image/gif': { kind: MediaKind.GIF, extension: 'gif' },
    'video/mp4': { kind: MediaKind.VIDEO, extension: 'mp4' },
    'video/webm': { kind: MediaKind.VIDEO, extension: 'webm' },
  });

const MAX_BYTES: Readonly<Record<MediaKindValue, number>> = Object.freeze({
  [MediaKind.IMAGE]: MAX_IMAGE_BYTES,
  [MediaKind.GIF]: MAX_GIF_BYTES,
  [MediaKind.VIDEO]: MAX_VIDEO_BYTES,
});

/** The content types a file picker should offer (the `accept` of the file input). */
export const ACCEPTED_MEDIA_TYPES = Object.freeze(Object.keys(MEDIA_TYPES));

/** The kind of a content type, or null when tweets don't accept it. */
export function mediaKindOf(contentType: string): MediaKindValue | null {
  return MEDIA_TYPES[contentType]?.kind ?? null;
}

/** The file extension to store a content type under ("jpg" for `image/jpeg`), or null. */
export function mediaExtensionOf(contentType: string): string | null {
  return MEDIA_TYPES[contentType]?.extension ?? null;
}

/** A file is valid when its type is accepted, it isn't empty and fits its kind's size limit. */
export function validateMedia({ type, size }: MediaFileInfo): ValidationResult {
  const kind = mediaKindOf(type);
  if (!kind || size <= 0) return ErrorCode.MEDIA_UNSUPPORTED;
  if (size > MAX_BYTES[kind]) return ErrorCode.MEDIA_TOO_LARGE;
  return null;
}
