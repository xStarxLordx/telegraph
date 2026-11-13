// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import downloadFile, { RELEASE_DELAY_MS } from './downloadFile';

interface Click {
  href: string;
  download: string;
}

let clicks: Click[];
let linksInPageAtClick: number[];

/** Makes `fetch` answer with a file of the given type. */
function serve(type: string, init: { ok?: boolean } = {}) {
  const file = new Blob(['x'], { type });
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: init.ok ?? true, blob: async () => file })),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  clicks = [];
  linksInPageAtClick = [];
  URL.createObjectURL = vi.fn(() => 'blob:saved');
  URL.revokeObjectURL = vi.fn();
  // The link is clicked while it is in the page: that is when its attributes are read.
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function click(
    this: HTMLAnchorElement,
  ) {
    clicks.push({ href: this.href, download: this.download });
    linksInPageAtClick.push(document.querySelectorAll('a[download]').length);
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (URL as { createObjectURL?: unknown }).createObjectURL;
  delete (URL as { revokeObjectURL?: unknown }).revokeObjectURL;
});

describe('downloadFile', () => {
  it('saves the file under the name given and the extension of its real type', async () => {
    serve('image/jpeg');
    await expect(
      downloadFile('https://cataas.com/cat/abc', 'telegraph-ada-t1', 'png'),
    ).resolves.toBe('saved');
    expect(fetch).toHaveBeenCalledWith('https://cataas.com/cat/abc');
    expect(clicks).toEqual([{ href: 'blob:saved', download: 'telegraph-ada-t1.jpg' }]);

    serve('image/gif');
    await downloadFile('https://cataas.com/cat/def', 'telegraph-ada-t2', 'png');
    expect(clicks[1].download).toBe('telegraph-ada-t2.gif');
  });

  it('uses the fallback extension when the host does not say what the file is', async () => {
    serve('');
    await downloadFile('https://example.test/file', 'telegraph-ada-t3', 'gif');
    expect(clicks[0].download).toBe('telegraph-ada-t3.gif');
    serve('application/octet-stream');
    await downloadFile('https://example.test/file', 'telegraph-ada-t4', 'jpg');
    expect(clicks[1].download).toBe('telegraph-ada-t4.jpg');
  });

  it('leaves no link behind, and frees the temporary URL a moment later', async () => {
    serve('image/png');
    await downloadFile('https://example.test/a.png', 'name', 'jpg');

    expect(linksInPageAtClick).toEqual([1]);
    expect(document.querySelectorAll('a[download]')).toHaveLength(0);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(RELEASE_DELAY_MS);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:saved');
  });

  it('reports "blocked", saving nothing, when the host refuses (no CORS) or fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(downloadFile('https://example.test/a.png', 'name', 'jpg')).resolves.toBe(
      'blocked',
    );

    serve('image/png', { ok: false });
    await expect(downloadFile('https://example.test/a.png', 'name', 'jpg')).resolves.toBe(
      'blocked',
    );

    expect(clicks).toEqual([]);
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
});
