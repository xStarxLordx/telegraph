// storage.rules can't run here either (no emulator), so this keeps it from drifting away from the
// code: the limits and types of src/domain must match the file.
import { describe, expect, it } from 'vitest';
import { MAX_GIF_MB, MAX_IMAGE_MB, MAX_VIDEO_MB } from '../../domain/constants';
import { ACCEPTED_MEDIA_TYPES, mediaExtensionOf } from '../../domain/media';
import firestoreRules from '../../../firestore.rules?raw';
import rules from '../../../storage.rules?raw';
import firebaseConfig from '../../../firebase.json';
import { MEDIA_FOLDER } from './firebaseMediaService';

/** The content types the rules accept, from `matches('image/(jpeg|png)')` and `== 'image/gif'`. */
function acceptedTypes() {
  const groups = [...rules.matchAll(/contentType\.matches\('(\w+)\/\(([^)]+)\)'\)/g)].flatMap(
    ([, family, names]) => names.split('|').map((name) => `${family}/${name}`),
  );
  const exact = [...rules.matchAll(/contentType == '([^']+)'/g)].map((match) => match[1]);
  return [...groups, ...exact];
}

describe('storage.rules', () => {
  it('is deployed with the project', () => {
    expect(firebaseConfig.storage).toEqual({ rules: 'storage.rules' });
  });

  it('uses the same size limits as src/domain/constants.ts', () => {
    const limits = [...rules.matchAll(/size <= (\d+) \* 1024 \* 1024/g)].map((m) => Number(m[1]));
    expect(limits).toEqual([MAX_IMAGE_MB, MAX_GIF_MB, MAX_VIDEO_MB]);
  });

  it('accepts exactly the content types the app accepts', () => {
    expect(acceptedTypes().sort()).toEqual([...ACCEPTED_MEDIA_TYPES].sort());
  });

  it('accepts exactly the file extensions the app names files with', () => {
    const extensions = ACCEPTED_MEDIA_TYPES.map((type) => mediaExtensionOf(type));
    const listed = /file\.matches\('\[0-9a-f-\]\+\[\.\]\(([^)]+)\)'\)/.exec(rules)?.[1] ?? '';
    expect(listed.split('|').sort()).toEqual([...new Set(extensions)].sort());
    // The tweet rule names the same extensions, twice (path and URL).
    expect(firestoreRules.split(`(${listed})`)).toHaveLength(3);
  });

  it('lets only the owner of the folder write, once, and never edit or delete', () => {
    expect(rules).toContain(`match /${MEDIA_FOLDER}/{uid}/{file}`);
    expect(rules).toContain('request.auth.uid == uid');
    expect(rules).toContain('allow update, delete: if false;');
    expect(rules).not.toMatch(/allow (write|create)[^;]*if true/);
  });

  it('names the same folder as the tweet rule', () => {
    expect(firestoreRules).toContain(`'^${MEDIA_FOLDER}/' + uid`);
    expect(firestoreRules).toContain(`/o/${MEDIA_FOLDER}%2F' + uid`);
  });
});
