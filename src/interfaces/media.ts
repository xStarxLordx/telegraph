// Media a tweet can carry (see src/domain/media.ts for what is accepted).
import type { MediaKind } from '../domain/media';

export type MediaKindValue = (typeof MediaKind)[keyof typeof MediaKind];

/** The two things validation needs to know about a file (a `File` has both). */
export interface MediaFileInfo {
  type: string;
  size: number;
}

/** A picture, GIF or video attached to a tweet. */
export interface MediaAttachment {
  kind: MediaKindValue;
  url: string;
  /**
   * Where the file lives in Cloud Storage. Absent when the tweet only links to media hosted
   * elsewhere (the demo data does).
   */
  path?: string;
}

/** `saved`: the browser was handed the file. `blocked`: it could not be fetched from here. */
export type DownloadOutcome = 'saved' | 'blocked';

export interface UploadMediaInput {
  /** The acting user; must be the logged-in one. */
  ownerId: string;
  file: File;
  /** Called with 0..1 while the file uploads. */
  onProgress?: (fraction: number) => void;
}
