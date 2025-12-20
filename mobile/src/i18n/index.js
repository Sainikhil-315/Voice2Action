import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNLocalize from 'react-native-localize';

// Import translations
import en from './locales/en.json';
import te from './locales/te.json';
import hi from './locales/hi.json';

const LANGUAGE_STORAGE_KEY = '@app_language';

// Available languages
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
];

// Get device language
const getDeviceLanguage = () => {
  const locales = RNLocalize.getLocales();
  if (locales && locales.length > 0) {
    const languageCode = locales[0].languageCode;
    // Check if device language is supported
    const supportedLanguage = LANGUAGES.find(lang => lang.code === languageCode);
    return supportedLanguage ? languageCode : 'en';
  }
  return 'en';
};

// Get saved language from AsyncStorage
export const getSavedLanguage = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    return savedLanguage || getDeviceLanguage();
  } catch (error) {
    console.error('Error getting saved language:', error);
    return getDeviceLanguage();
  }
};

// Save language to AsyncStorage
export const saveLanguage = async (languageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, languageCode);
    return true;
  } catch (error) {
    console.error('Error saving language:', error);
    return false;
  }
};

// Initialize i18next
const initializeI18n = async () => {
  const savedLanguage = await getSavedLanguage();

  i18n
    .use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: {
        en: { translation: en },
        te: { translation: te },
        hi: { translation: hi },
      },
      lng: savedLanguage,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
};

// Initialize on app start
initializeI18n();

// Change language function
export const changeLanguage = async (languageCode) => {
  try {
    await i18n.changeLanguage(languageCode);
    await saveLanguage(languageCode);
    return true;
  } catch (error) {
    console.error('Error changing language:', error);
    return false;
  }
};

// Get current language
export const getCurrentLanguage = () => {
  return i18n.language;
};

// Get language info
export const getLanguageInfo = (code) => {
  return LANGUAGES.find(lang => lang.code === code) || LANGUAGES[0];
};

export default i18n;