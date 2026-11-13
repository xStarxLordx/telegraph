// @vitest-environment jsdom
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createI18n } from '../../i18n/i18n';
import TweetCard from './TweetCard';

const tweet = {
  id: 't1',
  authorId: 'u1',
  authorFullName: 'Ada Lovelace',
  authorUsername: 'ada',
  body: 'Primer despacho del día.',
  createdAt: new Date('2026-10-12T14:58:00Z'),
};

function renderTweet(lng, data = tweet) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <I18nextProvider i18n={createI18n({ lng })}>
      <MemoryRouter>
        <TweetCard tweet={data} timeZone="UTC" />
      </MemoryRouter>
    </I18nextProvider>,
  );
  return container;
}

describe('TweetCard (G-06)', () => {
  it('renders "Full Name, @username - date and time" and the body below', () => {
    const [meta, body] = renderTweet('es').querySelectorAll('article > p');
    expect(meta.textContent).toBe('Ada Lovelace, @ada - 12/10/2026, 14:58');
    expect(body.textContent).toBe('Primer despacho del día.');
  });

  it('shows no picture, GIF or video for a tweet without media', () => {
    const card = renderTweet('es');
    expect(card.querySelector('img, video')).toBeNull();
  });

  it('puts a picture below the body, described for screen readers, loaded lazily', () => {
    const media = { kind: 'image', url: 'https://cataas.com/cat/abc?width=640' };
    const card = renderTweet('es', { ...tweet, media });
    const image = card.querySelector('article img');
    expect(image.getAttribute('src')).toBe(media.url);
    expect(image.getAttribute('alt')).toBe('Imagen publicada por Ada Lovelace');
    expect(image.getAttribute('loading')).toBe('lazy');
    // The picture is a button that opens the viewer, and it comes after the body.
    const button = image.closest('button');
    const children = [...card.querySelector('article').children];
    expect(children.indexOf(button)).toBeGreaterThan(
      children.indexOf(card.querySelector('article > p:last-of-type')),
    );
  });

  it('makes a picture or GIF a button that offers to enlarge it, and a video not', () => {
    const picture = { kind: 'image', url: 'https://cataas.com/cat/abc' };
    const card = renderTweet('es', { ...tweet, media: picture });
    expect(card.querySelector('button').getAttribute('aria-label')).toBe(
      'Ampliar: Imagen publicada por Ada Lovelace',
    );
    const gif = renderTweet('en', { ...tweet, media: { kind: 'gif', url: picture.url } });
    expect(gif.querySelector('button').getAttribute('aria-label')).toBe(
      'Enlarge: GIF posted by Ada Lovelace',
    );
    const video = renderTweet('es', { ...tweet, media: { kind: 'video', url: picture.url } });
    expect(video.querySelector('button')).toBeNull();
  });

  it('shows a GIF like a picture, in the active language', () => {
    const media = { kind: 'gif', url: 'https://cataas.com/cat/abc' };
    const image = renderTweet('en', { ...tweet, media }).querySelector('img');
    expect(image.getAttribute('alt')).toBe('GIF posted by Ada Lovelace');
  });

  it('shows a video with controls that only load its metadata', () => {
    const media = { kind: 'video', url: 'https://example.test/clip.mp4' };
    const video = renderTweet('es', { ...tweet, media }).querySelector('video');
    expect(video.getAttribute('src')).toBe(media.url);
    expect(video.hasAttribute('controls')).toBe(true);
    expect(video.getAttribute('preload')).toBe('metadata');
    expect(video.getAttribute('aria-label')).toBe('Video publicado por Ada Lovelace');
  });

  it('keeps the first line and shows just the media when the body is empty', () => {
    const media = { kind: 'image', url: 'https://cataas.com/cat/abc' };
    const card = renderTweet('es', { ...tweet, body: '', media });
    expect(card.querySelectorAll('article > p')).toHaveLength(1);
    expect(card.querySelector('article > p').textContent).toContain('@ada');
    expect(card.querySelector('img')).not.toBeNull();
  });

  it('links the username to the author page and dates the tweet in the active language', () => {
    const card = renderTweet('en');
    expect(card.querySelector('a').getAttribute('href')).toBe('/users/ada');
    expect(card.querySelector('time').getAttribute('datetime')).toBe('2026-10-12T14:58:00.000Z');
    expect(card.querySelector('time').textContent).toBe('10/12/2026, 02:58 PM');
  });
});
