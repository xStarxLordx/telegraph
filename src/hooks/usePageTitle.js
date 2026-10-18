import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/** Sets the browser tab title ("Feed · Telegraph"), so each route is announced by its name. */
export default function usePageTitle(title) {
  const { t } = useTranslation();
  const appName = t('app.title');
  useEffect(() => {
    document.title = title ? `${title} · ${appName}` : appName;
  }, [title, appName]);
}
