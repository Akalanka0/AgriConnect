import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from './locales/en/common.json';
import siCommon from './locales/si/common.json';
import enHome from './locales/en/home.json';
import siHome from './locales/si/home.json';
import enAuth from './locales/en/auth.json';
import siAuth from './locales/si/auth.json';
import enFarmer from './locales/en/farmer.json';
import siFarmer from './locales/si/farmer.json';
import enAdmin from './locales/en/admin.json';
import siAdmin from './locales/si/admin.json';
import enInstructor from './locales/en/instructor.json';
import siInstructor from './locales/si/instructor.json';

const savedLang = localStorage.getItem('agri_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        auth: enAuth,
        farmer: enFarmer,
        admin: enAdmin,
        instructor: enInstructor,
      },
      si: {
        common: siCommon,
        home: siHome,
        auth: siAuth,
        farmer: siFarmer,
        admin: siAdmin,
        instructor: siInstructor,
      },
    },
    lng: savedLang,
    fallbackLng: 'en',
    ns: ['common', 'home', 'auth', 'farmer', 'admin', 'instructor'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
