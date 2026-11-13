import { ErrorCode, ServiceError } from '../../domain/errors';
import { mediaKindOf, validateMedia } from '../../domain/media';
import type { MediaService } from '../../interfaces/mediaService';
import type { MockServiceDeps } from '../../interfaces/mock';
import requireActor from './requireActor';

// jsdom (the tests' DOM) has no `URL.createObjectURL`; a made-up URL stands in there.
const urlFor = (file: File) =>
  typeof URL.createObjectURL === 'function'
    ? URL.createObjectURL(file)
    : `blob:telegraph-mock/${encodeURIComponent(file.name)}`;

/**
 * Nothing is stored: the attachment points at the file in this browser tab (it stops working on
 * reload, which is fine for the tests and demos the mocks serve).
 */
export default function createMockMediaService({ db, delay }: MockServiceDeps): MediaService {
  return {
    async upload({ ownerId, file, onProgress }) {
      await delay();
      requireActor(db, ownerId);
      const kind = mediaKindOf(file.type);
      const error = validateMedia(file);
      if (!kind || error) {
        throw new ServiceError(error ?? ErrorCode.MEDIA_UNSUPPORTED, { field: 'media' });
      }
      onProgress?.(1);
      return { kind, url: urlFor(file) };
    },
  };
}
