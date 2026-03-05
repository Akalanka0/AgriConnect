import { useTranslation } from 'react-i18next';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isSinhala = i18n.language === 'si';

  const toggle = () => {
    const next = isSinhala ? 'en' : 'si';
    i18n.changeLanguage(next);
    localStorage.setItem('agri_lang', next);
  };

  return (
    <button
      onClick={toggle}
      className={styles.langBtn}
      title={isSinhala ? 'Switch to English' : 'Switch to Sinhala'}
      aria-label="Toggle language"
    >
      {isSinhala ? 'EN' : 'සිං'}
    </button>
  );
};

export default LanguageSwitcher;
