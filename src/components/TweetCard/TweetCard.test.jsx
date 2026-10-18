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

function renderTweet(lng) {
  const container = document.createElement('div');
  container.innerHTML = renderToStaticMarkup(
    <I18nextProvider i18n={createI18n({ lng })}>
      <MemoryRouter>
        <TweetCard tweet={tweet} timeZone="UTC" />
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

  it('links the username to the author page and dates the tweet in the active language', () => {
    const card = renderTweet('en');
    expect(card.querySelector('a').getAttribute('href')).toBe('/users/ada');
    expect(card.querySelector('time').getAttribute('datetime')).toBe('2026-10-12T14:58:00.000Z');
    expect(card.querySelector('time').textContent).toBe('10/12/2026, 02:58 PM');
  });
});
