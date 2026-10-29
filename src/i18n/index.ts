import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { features } from '@/config/features';

type Catalogue = Record<string, { default: Record<string, unknown> }>;
const en = import.meta.glob('./en/*.json', { eager: true }) as Catalogue;
const ta = import.meta.glob('./ta/*.json', { eager: true }) as Catalogue;

const toResources = (files: Catalogue) =>
  Object.fromEntries(
    Object.entries(files).map(([path, mod]) => [
      path.split('/').pop()!.replace('.json', ''),
      mod.default,
    ]),
  );

/** Stretches strings by about 35 percent and wraps them in brackets (brief, section 10). */
const stretch = (s: string) =>
  `[${s}${s.replace(/[^\s]/g, 'x').slice(0, Math.ceil(s.length * 0.35))}]`;

const pseudo =
  typeof location !== 'undefined' && new URLSearchParams(location.search).has('pseudo');

let saved: string | null = null;
try {
  saved = localStorage.getItem('lang');
} catch {
  /* storage unavailable */
}

i18n
  .use({ type: 'postProcessor', name: 'pseudo', process: (value: string) => stretch(value) })
  .use(initReactI18next)
  .init({
    resources: { en: toResources(en), ta: toResources(ta) },
    lng:
      saved && features.i18n.enabledLocales.includes(saved) ? saved : features.i18n.defaultLocale,
    fallbackLng: 'en',
    supportedLngs: ['en', 'ta'],
    ns: Object.keys(toResources(en)),
    defaultNS: 'common',
    returnEmptyString: false, // empty Tamil values fall back to English
    interpolation: { escapeValue: false },
    postProcess: pseudo ? ['pseudo'] : false,
  });

export function setLanguage(lng: string) {
  void i18n.changeLanguage(lng);
  document.documentElement.lang = lng;
  try {
    localStorage.setItem('lang', lng);
  } catch {
    /* storage unavailable */
  }
}

document.documentElement.lang = i18n.language;
export default i18n;
