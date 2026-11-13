// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createI18n } from '../../i18n/i18n';
import stubDialog from '../../test/dialogStub';
import TweetMedia from './TweetMedia';

const LABEL = 'Imagen publicada por Ada Lovelace';
const photo = { kind: 'image', url: 'https://cataas.com/cat/abc?width=640' };
const animation = { kind: 'gif', url: 'https://cataas.com/cat/def' };
const clip = { kind: 'video', url: 'https://example.test/clip.mp4' };

let restoreDialog;

const show = (media, props = {}) =>
  render(
    <I18nextProvider i18n={createI18n({ lng: 'es' })}>
      <TweetMedia media={media} label={LABEL} {...props} />
    </I18nextProvider>,
  );

beforeEach(() => {
  restoreDialog = stubDialog();
});

afterEach(() => {
  cleanup();
  restoreDialog();
});

describe('TweetMedia', () => {
  it('shows a picture as a plain image unless it is expandable', () => {
    show(photo);
    expect(screen.getByRole('img', { name: LABEL })).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('turns an expandable picture into a button that opens the viewer, and back', async () => {
    const user = userEvent.setup();
    show(photo, { expandable: true, fileName: 'telegraph-ada-t1' });
    expect(screen.queryByRole('dialog')).toBeNull();

    await user.click(screen.getByRole('button', { name: `Ampliar: ${LABEL}` }));
    const dialog = await screen.findByRole('dialog', { name: LABEL });
    expect(dialog.querySelector('img').getAttribute('src')).toBe(photo.url);

    await user.click(screen.getByRole('button', { name: 'Cerrar visor' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('does the same for a GIF', async () => {
    const user = userEvent.setup();
    show(animation, { expandable: true });
    await user.click(screen.getByRole('button', { name: `Ampliar: ${LABEL}` }));
    expect((await screen.findByRole('dialog')).querySelector('img').getAttribute('src')).toBe(
      animation.url,
    );
  });

  it('opens with the keyboard, because the picture is a real button', async () => {
    const user = userEvent.setup();
    show(photo, { expandable: true });
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: `Ampliar: ${LABEL}` }));
    await user.keyboard('{Enter}');
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('never makes a video a button: it has its own controls', () => {
    const { container } = show(clip, { expandable: true });
    expect(screen.queryByRole('button')).toBeNull();
    expect(container.querySelector('video').hasAttribute('controls')).toBe(true);
  });
});
