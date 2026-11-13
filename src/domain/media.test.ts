import { describe, expect, it } from 'vitest';
import { MAX_GIF_BYTES, MAX_IMAGE_BYTES, MAX_VIDEO_BYTES } from './constants';
import { ErrorCode } from './errors';
import {
  ACCEPTED_MEDIA_TYPES,
  mediaExtensionOf,
  mediaKindOf,
  MediaKind,
  validateMedia,
} from './media';

describe('mediaKindOf', () => {
  it('tells pictures, GIFs and videos apart', () => {
    expect(mediaKindOf('image/jpeg')).toBe(MediaKind.IMAGE);
    expect(mediaKindOf('image/png')).toBe(MediaKind.IMAGE);
    expect(mediaKindOf('image/webp')).toBe(MediaKind.IMAGE);
    expect(mediaKindOf('image/gif')).toBe(MediaKind.GIF);
    expect(mediaKindOf('video/mp4')).toBe(MediaKind.VIDEO);
    expect(mediaKindOf('video/webm')).toBe(MediaKind.VIDEO);
  });

  it('refuses everything else, SVG included (it can carry scripts)', () => {
    ['image/svg+xml', 'application/pdf', 'text/html', 'video/quicktime', ''].forEach((type) => {
      expect(mediaKindOf(type), type).toBeNull();
    });
  });
});

describe('ACCEPTED_MEDIA_TYPES', () => {
  it('lists exactly the types that have a kind and a file extension', () => {
    expect([...ACCEPTED_MEDIA_TYPES].sort()).toEqual([
      'image/gif',
      'image/jpeg',
      'image/png',
      'image/webp',
      'video/mp4',
      'video/webm',
    ]);
    ACCEPTED_MEDIA_TYPES.forEach((type) => {
      expect(mediaKindOf(type), type).not.toBeNull();
      expect(mediaExtensionOf(type), type).toMatch(/^[a-z0-9]+$/);
    });
    expect(mediaExtensionOf('image/jpeg')).toBe('jpg');
    expect(mediaExtensionOf('image/svg+xml')).toBeNull();
  });
});

describe('validateMedia', () => {
  it('accepts a file up to the limit of its kind and rejects one byte over', () => {
    expect(validateMedia({ type: 'image/png', size: MAX_IMAGE_BYTES })).toBeNull();
    expect(validateMedia({ type: 'image/png', size: MAX_IMAGE_BYTES + 1 })).toBe(
      ErrorCode.MEDIA_TOO_LARGE,
    );
    expect(validateMedia({ type: 'image/gif', size: MAX_GIF_BYTES })).toBeNull();
    expect(validateMedia({ type: 'image/gif', size: MAX_GIF_BYTES + 1 })).toBe(
      ErrorCode.MEDIA_TOO_LARGE,
    );
    expect(validateMedia({ type: 'video/mp4', size: MAX_VIDEO_BYTES })).toBeNull();
    expect(validateMedia({ type: 'video/mp4', size: MAX_VIDEO_BYTES + 1 })).toBe(
      ErrorCode.MEDIA_TOO_LARGE,
    );
  });

  it('gives each kind its own limit: a size fine for a GIF is too big for a picture', () => {
    const size = MAX_IMAGE_BYTES + 1;
    expect(validateMedia({ type: 'image/gif', size })).toBeNull();
    expect(validateMedia({ type: 'image/jpeg', size })).toBe(ErrorCode.MEDIA_TOO_LARGE);
  });

  it('rejects unknown types and empty files as unsupported', () => {
    expect(validateMedia({ type: 'application/pdf', size: 10 })).toBe(ErrorCode.MEDIA_UNSUPPORTED);
    expect(validateMedia({ type: '', size: 10 })).toBe(ErrorCode.MEDIA_UNSUPPORTED);
    expect(validateMedia({ type: 'image/png', size: 0 })).toBe(ErrorCode.MEDIA_UNSUPPORTED);
  });

  it('judges the type before the size, so a huge unknown file is "unsupported"', () => {
    expect(validateMedia({ type: 'application/zip', size: MAX_VIDEO_BYTES * 10 })).toBe(
      ErrorCode.MEDIA_UNSUPPORTED,
    );
  });
});
