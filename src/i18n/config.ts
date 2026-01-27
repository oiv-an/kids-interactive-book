import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import resources from './resources';

function detectInitialLanguage(): 'ru' | 'en' {
  // i18next may persist language here; if so — respect it.
  try {
    const stored = window.localStorage.getItem('i18nextLng');
    if (typeof stored === 'string' && stored.length > 0) {
      return stored.startsWith('en') ? 'en' : 'ru';
    }
  } catch {
    // ignore
  }

  // Otherwise, infer from browser language.
  const navLang = (navigator.language ?? '').toLowerCase();
  return navLang.startsWith('ru') ? 'ru' : 'en';
}

const initialLng = detectInitialLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLng,
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
  });

// Make browser know what language the page is in (reduces auto-translate prompts)
// and keep it in sync when user switches RU/EN.
i18n.on('languageChanged', (lng) => {
  const htmlLang = lng.startsWith('en') ? 'en' : 'ru';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = htmlLang;
  }
});

// Set it once on boot as well.
if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLng;
}

export default i18n;