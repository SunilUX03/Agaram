import { useTranslation } from 'react-i18next';
import { setLanguage } from '@/i18n';

/** Development-only panel, opened with ?demo=1. Only the language switch works in phase 0. */
export function useDemoMode(): boolean {
  try {
    if (new URLSearchParams(location.search).get('demo') === '1')
      sessionStorage.setItem('demo', '1');
    return sessionStorage.getItem('demo') === '1';
  } catch {
    return false;
  }
}

export function DemoControls() {
  const { t, i18n } = useTranslation();
  const stub = ['reset', 'forceLoading', 'forceEmpty', 'forceError', 'advance'] as const;
  return (
    <aside
      aria-label={t('demo.title')}
      className="card"
      style={{ position: 'fixed', right: 12, bottom: 76, zIndex: 900, width: 220, padding: 12 }}
    >
      <strong>{t('demo.title')}</strong>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        <button
          type="button"
          className="btn"
          onClick={() => setLanguage(i18n.language === 'ta' ? 'en' : 'ta')}
        >
          {t('demo.language')}: {i18n.language === 'ta' ? 'EN' : 'த'}
        </button>
        {stub.map((k) => (
          <button key={k} type="button" className="btn" disabled>
            {t(`demo.${k}`)}
          </button>
        ))}
      </div>
    </aside>
  );
}
