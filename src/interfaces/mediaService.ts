import type { MediaAttachment, UploadMediaInput } from './media';

export interface MediaService {
  /**
   * Validates the file (MEDIA_UNSUPPORTED / MEDIA_TOO_LARGE, field "media") and stores it, so a
   * tweet can reference it. The attachment it returns goes into `PublishTweetInput.media`.
   */
  upload(input: UploadMediaInput): Promise<MediaAttachment>;
}
