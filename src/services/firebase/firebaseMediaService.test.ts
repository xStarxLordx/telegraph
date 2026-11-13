import type { Auth } from 'firebase/auth';
import type { FirebaseStorage } from 'firebase/storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES } from '../../domain/constants';
import { ErrorCode } from '../../domain/errors';
import type { FirebaseMediaDeps } from '../../interfaces/firebase';
import type { FakeAuth } from '../../interfaces/testing';
import { createFakeAuth, failureOf } from '../../test/firebaseFixtures';
import { ownMediaPatterns } from '../../test/firestoreRules';
import createFirebaseMediaService, { MEDIA_FOLDER } from './firebaseMediaService';

interface FakeReference {
  path: string;
}
interface UploadObserver {
  next(snapshot: { bytesTransferred: number; totalBytes: number }): void;
  error(error: unknown): void;
  complete(): void;
}

// A stand-in for Cloud Storage: it records what is uploaded and can be told to fail.
const storage = vi.hoisted(() => ({
  uploads: [] as { path: string; size: number; contentType: string }[],
  failWith: null as { code: string } | null,
}));

vi.mock('firebase/storage', () => ({
  ref: (_storage: unknown, path: string): FakeReference => ({ path }),
  uploadBytesResumable: (
    reference: FakeReference,
    file: Blob,
    metadata: { contentType: string },
  ) => {
    storage.uploads.push({
      path: reference.path,
      size: file.size,
      contentType: metadata.contentType,
    });
    return {
      on: (
        _event: string,
        next: UploadObserver['next'],
        error: UploadObserver['error'],
        complete: UploadObserver['complete'],
      ) => {
        if (storage.failWith) {
          error(storage.failWith);
          return;
        }
        next({ bytesTransferred: 50, totalBytes: 100 });
        next({ bytesTransferred: 100, totalBytes: 100 });
        complete();
      },
    };
  },
  getDownloadURL: async (reference: FakeReference) =>
    `https://firebasestorage.googleapis.com/v0/b/demo-bucket/o/${encodeURIComponent(reference.path)}` +
    '?alt=media&token=0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
}));

const UID = 'uid-ada';

function fileOf(name: string, type: string, size = 10): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

let auth: FakeAuth;
let service: ReturnType<typeof createFirebaseMediaService>;

beforeEach(() => {
  storage.uploads.length = 0;
  storage.failWith = null;
  auth = createFakeAuth(UID);
  const deps: FirebaseMediaDeps = {
    auth: auth as unknown as Auth,
    storage: {} as FirebaseStorage,
  };
  service = createFirebaseMediaService(deps);
});

describe('upload', () => {
  it('stores the file in the owner’s folder and returns its kind, URL and path', async () => {
    const attachment = await service.upload({
      ownerId: UID,
      file: fileOf('gato.gif', 'image/gif'),
    });

    expect(storage.uploads).toEqual([
      {
        path: expect.stringMatching(`^${MEDIA_FOLDER}/${UID}/[0-9a-f-]+\\.gif$`),
        size: 10,
        contentType: 'image/gif',
      },
    ]);
    expect(attachment).toEqual({
      kind: 'gif',
      path: storage.uploads[0].path,
      url: expect.stringContaining('alt=media&token='),
    });
  });

  it('gives every upload its own name, so one never replaces another', async () => {
    const file = fileOf('a.png', 'image/png');
    await service.upload({ ownerId: UID, file });
    await service.upload({ ownerId: UID, file });
    expect(new Set(storage.uploads.map(({ path }) => path)).size).toBe(2);
  });

  it('reports the progress as a fraction', async () => {
    const onProgress = vi.fn();
    await service.upload({ ownerId: UID, file: fileOf('a.mp4', 'video/mp4'), onProgress });
    expect(onProgress.mock.calls).toEqual([[0.5], [1]]);
  });

  it('rejects an invalid file before sending anything', async () => {
    const unsupported = await failureOf(
      service.upload({ ownerId: UID, file: fileOf('a.pdf', 'application/pdf') }),
    );
    expect(unsupported).toMatchObject({ code: ErrorCode.MEDIA_UNSUPPORTED, field: 'media' });
    const tooLarge = await failureOf(
      service.upload({ ownerId: UID, file: fileOf('big.png', 'image/png', MAX_IMAGE_BYTES + 1) }),
    );
    expect(tooLarge).toMatchObject({ code: ErrorCode.MEDIA_TOO_LARGE, field: 'media' });
    expect(storage.uploads).toEqual([]);
  });

  it('only uploads for the signed-in account', async () => {
    const other = await failureOf(
      service.upload({ ownerId: 'uid-emilie', file: fileOf('a.png', 'image/png') }),
    );
    expect(other.code).toBe(ErrorCode.PERMISSION_DENIED);

    auth.currentUser = null;
    const signedOut = await failureOf(
      service.upload({ ownerId: UID, file: fileOf('a.png', 'image/png') }),
    );
    expect(signedOut.code).toBe(ErrorCode.NOT_AUTHENTICATED);
    expect(storage.uploads).toEqual([]);
  });

  it('turns Storage errors into service errors, never leaking the provider’s', async () => {
    storage.failWith = { code: 'storage/unauthorized' };
    const denied = await failureOf(
      service.upload({ ownerId: UID, file: fileOf('a.png', 'image/png') }),
    );
    expect(denied.code).toBe(ErrorCode.PERMISSION_DENIED);

    storage.failWith = { code: 'storage/retry-limit-exceeded' };
    const offline = await failureOf(
      service.upload({ ownerId: UID, file: fileOf('a.png', 'image/png') }),
    );
    expect(offline.code).toBe(ErrorCode.NETWORK_UNAVAILABLE);

    storage.failWith = { code: 'storage/bucket-not-found' };
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const unknown = await failureOf(
      service.upload({ ownerId: UID, file: fileOf('a.png', 'image/png') }),
    );
    expect(unknown.code).toBe(ErrorCode.UNKNOWN);
    consoleError.mockRestore();
  });
});

describe('what firestore.rules accepts as a tweet’s media', () => {
  it('takes the path and URL this service produces', async () => {
    const patterns = ownMediaPatterns(UID);
    const types = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
    const attachments = await Promise.all(
      types.map((type) => service.upload({ ownerId: UID, file: fileOf('f', type) })),
    );
    attachments.forEach(({ path, url }) => {
      expect(path).toMatch(patterns.path);
      expect(url).toMatch(patterns.url);
    });
  });

  it('turns down links to other sites, other accounts’ files and other formats', () => {
    const patterns = ownMediaPatterns(UID);
    const good = `https://firebasestorage.googleapis.com/v0/b/b/o/tweet-media%2F${UID}%2Fab12-cd.png?alt=media&token=ab-12`;
    expect(good).toMatch(patterns.url);

    [
      'https://cataas.com/cat/abc',
      good.replace('firebasestorage.googleapis.com', 'evil.example.com'),
      good.replace(`%2F${UID}%2F`, '%2Fuid-emilie%2F'),
      good.replace('.png', '.svg'),
      good.replace('alt=media&token=ab-12', 'alt=media&token=x<script>'),
      `${good}&extra=1`,
    ].forEach((url) => expect(url, url).not.toMatch(patterns.url));

    expect(`${MEDIA_FOLDER}/${UID}/ab12-cd.png`).toMatch(patterns.path);
    [
      `${MEDIA_FOLDER}/uid-emilie/ab12-cd.png`,
      `${MEDIA_FOLDER}/${UID}/nested/ab12-cd.png`,
      `${MEDIA_FOLDER}/${UID}/ab12-cd.exe`,
      `other-folder/${UID}/ab12-cd.png`,
    ].forEach((path) => expect(path, path).not.toMatch(patterns.path));
  });
});
