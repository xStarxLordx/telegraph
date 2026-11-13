// jsdom doesn't implement the modal <dialog> API (`open`, `showModal()`, `close()`). This gives the
// prototype the small part the app relies on, so a test can open and close the media viewer. The
// stub follows the real thing where it matters: `close()` on an open dialog raises `close`.

/** Installs the stub and returns the function that removes it (call it in `afterEach`). */
export default function stubDialog(): () => void {
  const { prototype } = HTMLDialogElement;
  const original = {
    showModal: prototype.showModal,
    close: prototype.close,
    open: Object.getOwnPropertyDescriptor(prototype, 'open'),
  };

  Object.defineProperty(prototype, 'open', {
    configurable: true,
    get(this: HTMLDialogElement) {
      return this.hasAttribute('open');
    },
  });
  prototype.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  prototype.close = function close(this: HTMLDialogElement) {
    if (!this.hasAttribute('open')) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };

  return () => {
    prototype.showModal = original.showModal;
    prototype.close = original.close;
    if (original.open) Object.defineProperty(prototype, 'open', original.open);
    else delete (prototype as { open?: boolean }).open;
  };
}
