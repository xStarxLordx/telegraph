// Firebase MediaService (see src/interfaces/mediaService.ts). A file is stored in Cloud Storage
// under `tweet-media/<uid>/<random>.<ext>`, the only place storage.rules lets a signed-in user
// write; the tweet then keeps the download URL and that path.
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { ErrorCode, ServiceError } from '../../domain/errors';
import { mediaExtensionOf, mediaKindOf, validateMedia } from '../../domain/media';
import type { FirebaseMediaDeps } from '../../interfaces/firebase';
import type { UploadMediaInput } from '../../interfaces/media';
import type { MediaService } from '../../interfaces/mediaService';
import { withMappedErrors } from './mapFirebaseError';
import { requireSignedIn } from './profiles';

/** The Storage folder of tweet media; storage.rules and firestore.rules both expect it. */
export const MEDIA_FOLDER = 'tweet-media';

export default function createFirebaseMediaService({
  auth,
  storage,
}: FirebaseMediaDeps): MediaService {
  return {
    upload: withMappedErrors(async ({ ownerId, file, onProgress }: UploadMediaInput) => {
      await requireSignedIn(auth, ownerId);
      const kind = mediaKindOf(file.type);
      const extension = mediaExtensionOf(file.type);
      const error = validateMedia(file);
      if (!kind || !extension || error) {
        throw new ServiceError(error ?? ErrorCode.MEDIA_UNSUPPORTED, { field: 'media' });
      }
      const path = `${MEDIA_FOLDER}/${ownerId}/${crypto.randomUUID()}.${extension}`;
      const reference = ref(storage, path);
      await new Promise<void>((resolve, reject) => {
        uploadBytesResumable(reference, file, { contentType: file.type }).on(
          'state_changed',
          (snapshot) => onProgress?.(snapshot.bytesTransferred / snapshot.totalBytes),
          reject,
          () => resolve(),
        );
      });
      return { kind, url: await getDownloadURL(reference), path };
    }),
  };
}
