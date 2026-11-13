// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createI18n } from '../../i18n/i18n';
import stubDialog from '../../test/dialogStub';
import downloadFile from '../../utils/downloadFile';
import MediaViewer from './MediaViewer';

vi.mock('../../utils/downloadFile');

const LABEL = 'Imagen publicada por Ada Lovelace';
const photo = { kind: 'image', url: 'https://cataas.com/cat/abc?width=640' };
const animation = { kind: 'gif', url: 'https://cataas.com/cat/def' };

let restoreDialog;
let onClose;

function open(media = photo) {
  return render(
    <I18nextProvider i18n={createI18n({ lng: 'es' })}>
      <MediaViewer media={media} label={LABEL} fileName="telegraph-ada-t1" onClose={onClose} />
    </I18nextProvider>,
  );
}

beforeEach(() => {
  restoreDialog = stubDialog();
  onClose = vi.fn();
  vi.mocked(downloadFile).mockResolvedValue('saved');
});

afterEach(() => {
  cleanup();
  restoreDialog();
  vi.resetAllMocks();
});

describe('MediaViewer', () => {
  it('opens as a modal dialog named after the file, with the picture at full size', () => {
    open();
    const dialog = screen.getByRole('dialog', { name: LABEL });
    expect(dialog.hasAttribute('open')).toBe(true);
    const image = within(dialog).getByRole('img', { name: LABEL });
    expect(image.getAttribute('src')).toBe(photo.url);
  });

  it('closes with its button, and says so', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: 'Cerrar visor' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog', { hidden: true }).hasAttribute('open')).toBe(false);
  });

  it('closes with a click outside the panel, but not with one inside it', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('img', { name: LABEL }));
    await user.click(screen.getByText(LABEL));
    expect(onClose).not.toHaveBeenCalled();

    // The dialog element itself is what a click on the dimmed area reaches.
    await user.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with Esc: the browser raises `close` and the viewer passes it on', () => {
    open();
    screen.getByRole('dialog').dispatchEvent(new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('downloads under the tweet’s name, falling back to the kind’s extension', async () => {
    const user = userEvent.setup();
    const { unmount } = open();
    await user.click(screen.getByRole('button', { name: 'Descargar' }));
    expect(downloadFile).toHaveBeenLastCalledWith(photo.url, 'telegraph-ada-t1', 'jpg');
    expect(screen.queryByRole('alert')).toBeNull();
    unmount();

    open(animation);
    await user.click(screen.getByRole('button', { name: 'Descargar' }));
    expect(downloadFile).toHaveBeenLastCalledWith(animation.url, 'telegraph-ada-t1', 'gif');
  });

  it('offers the file in a new tab when it cannot be downloaded from here', async () => {
    vi.mocked(downloadFile).mockResolvedValue('blocked');
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: 'Descargar' }));

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('No se pudo descargar');
    const link = within(alert).getByRole('link');
    expect(link.getAttribute('href')).toBe(photo.url);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it('clears that message on the next try', async () => {
    vi.mocked(downloadFile).mockResolvedValueOnce('blocked').mockResolvedValueOnce('saved');
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: 'Descargar' }));
    await screen.findByRole('alert');

    await user.click(screen.getByRole('button', { name: 'Descargar' }));
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
  });

  it('is described in English when the language is English', () => {
    render(
      <I18nextProvider i18n={createI18n({ lng: 'en' })}>
        <MediaViewer media={photo} label="Image posted by Ada" fileName="f" onClose={onClose} />
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: 'Download' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Close viewer' })).toBeTruthy();
  });
});
