import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_IMAGE_BYTES } from '../../domain/constants';
import { ErrorCode } from '../../domain/errors';
import type { MockServices } from '../../interfaces/mock';
import type { CurrentUser } from '../../interfaces/user';
import createMockServices from './createMockServices';
import { DEMO_PASSWORD } from './seed';

/** A file of `size` bytes without allocating it. */
function fileOf(name: string, type: string, size = 10): File {
  const file = new File(['x'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
}

describe('mock mediaService', () => {
  let services: MockServices;
  let ada: CurrentUser;

  beforeEach(async () => {
    services = createMockServices();
    ada = await services.authService.loginWithUsername({
      username: 'ada',
      password: DEMO_PASSWORD,
    });
  });

  it('returns an attachment of the right kind that points at the file', async () => {
    const attachment = await services.mediaService.upload({
      ownerId: ada.id,
      file: fileOf('gato.gif', 'image/gif'),
    });
    expect(attachment.kind).toBe('gif');
    // A URL for the file in this tab: real in Node and browsers, made up where there is none.
    expect(attachment.url).toMatch(/^blob:/);
    expect(attachment).not.toHaveProperty('path');
  });

  it('reports the upload as finished', async () => {
    const onProgress = vi.fn();
    await services.mediaService.upload({
      ownerId: ada.id,
      file: fileOf('a.png', 'image/png'),
      onProgress,
    });
    expect(onProgress).toHaveBeenLastCalledWith(1);
  });

  it('rejects an unsupported or too large file on the "media" field', async () => {
    await expect(
      services.mediaService.upload({ ownerId: ada.id, file: fileOf('a.pdf', 'application/pdf') }),
    ).rejects.toMatchObject({ code: ErrorCode.MEDIA_UNSUPPORTED, field: 'media' });
    await expect(
      services.mediaService.upload({
        ownerId: ada.id,
        file: fileOf('big.png', 'image/png', MAX_IMAGE_BYTES + 1),
      }),
    ).rejects.toMatchObject({ code: ErrorCode.MEDIA_TOO_LARGE, field: 'media' });
  });

  it('only uploads for the logged-in user', async () => {
    await expect(
      services.mediaService.upload({ ownerId: 'someone-else', file: fileOf('a.png', 'image/png') }),
    ).rejects.toMatchObject({ code: ErrorCode.PERMISSION_DENIED });
    await services.authService.logout();
    await expect(
      services.mediaService.upload({ ownerId: ada.id, file: fileOf('a.png', 'image/png') }),
    ).rejects.toMatchObject({ code: ErrorCode.NOT_AUTHENTICATED });
  });
});
