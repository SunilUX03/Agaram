import { useTranslation } from 'react-i18next';
import { features } from '@/config/features';
import { setLanguage } from '@/i18n';

/** "EN | த". Hidden when only one locale is enabled. */
export function LangSwitch() {
  const { t, i18n } = useTranslation();
  if (features.i18n.enabledLocales.length < 2) return null;
  return (
    <div className="ux4g-d-flex ux4g-ai-center" role="group" aria-label={t('language.switch')}>
      {features.i18n.enabledLocales.map((l, i) => (
        <span key={l} className="ux4g-d-flex ux4g-ai-center">
          {i > 0 && <span aria-hidden="true">|</span>}
          <button
            type="button"
            lang={l}
            className={`ux4g-btn-text-neutral ux4g-btn-s${i18n.language === l ? ' lang-on' : ''}`}
            aria-pressed={i18n.language === l}
            onClick={() => setLanguage(l)}
          >
            {t(`language.${l}`)}
          </button>
        </span>
      ))}
    </div>
  );
}
