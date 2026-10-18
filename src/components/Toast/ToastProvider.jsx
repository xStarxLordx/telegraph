import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContext } from './ToastContext';
import styles from './Toast.module.css';

const TOAST_DURATION_MS = 4000;

/** Shows one toast at a time in a live region at the bottom of the screen. */
function ToastProvider({ children }) {
  const { t } = useTranslation();
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  const showToast = useCallback((message) => {
    clearTimeout(timer.current);
    // A new id restarts the entry animation even when the message repeats.
    setToast({ id: Date.now(), message });
    timer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="status" aria-live="polite">
        {toast && (
          <div key={toast.id} className={styles.toast}>
            <span>{toast.message}</span>
            <button
              type="button"
              className={styles.close}
              onClick={dismiss}
              aria-label={t('common.dismiss')}
            >
              ×
            </button>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ToastProvider;
