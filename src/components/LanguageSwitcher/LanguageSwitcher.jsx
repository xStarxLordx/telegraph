import { useTranslation } from 'react-i18next';
import { Language } from '../../i18n/i18n';
import styles from './LanguageSwitcher.module.css';

const LANGUAGES = [
  { code: Language.ES, labelKey: 'language.es' },
  { code: Language.EN, labelKey: 'language.en' },
];

/** ES | EN toggle group; i18next saves the choice (see src/i18n/i18n.js). */
function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const active = i18n.resolvedLanguage;

  return (
    <div className={styles.switcher} role="group" aria-label={t('language.label')}>
      {LANGUAGES.map(({ code, labelKey }) => (
        <button
          key={code}
          type="button"
          lang={code}
          className={styles.option}
          aria-pressed={active === code}
          // The visible "ES"/"EN" stays the accessible name (label in name, WCAG 2.5.3).
          title={t(labelKey)}
          onClick={() => i18n.changeLanguage(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export default LanguageSwitcher;
