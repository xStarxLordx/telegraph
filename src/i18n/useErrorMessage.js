import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import errorKey, { ERROR_MESSAGE_VALUES } from './errorKey';

/** Returns `(errorOrCode) => translated message`, or '' when there is no error. */
export default function useErrorMessage() {
  const { t } = useTranslation();
  return useCallback(
    (errorOrCode) => (errorOrCode ? t(errorKey(errorOrCode), ERROR_MESSAGE_VALUES) : ''),
    [t],
  );
}
