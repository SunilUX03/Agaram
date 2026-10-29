import { useState } from 'react';
import { useTranslation } from 'react-i18next';

/** UX4G accessibility bar: skip link and text size controls. */
export function AccessibilityBar() {
  const { t } = useTranslation();
  const [scale, setScale] = useState(() =>
    Number(document.documentElement.dataset.textScale ?? 100),
  );
  const apply = (n: number) => {
    const v = Math.min(150, Math.max(80, n));
    setScale(v);
    document.documentElement.dataset.textScale = String(v);
    document.documentElement.style.fontSize = `${v}%`;
  };
  return (
    <div className="ux4g-topbar">
      <div className="ux4g-topbar__wrap ux4g-container ux4g-d-flex ux4g-ai-center ux4g-jc-between">
        <a href="#main" className="ux4g-topbar__skip">
          {t('app.skipToMain')}
        </a>
        <div className="ux4g-topbar__group" role="group" aria-label={t('a11y.textSize')}>
          <button
            type="button"
            className="ux4g-topbar__iconbtn"
            aria-label={t('a11y.smaller')}
            disabled={scale <= 80}
            onClick={() => apply(scale - 10)}
          >
            A-
          </button>
          <button
            type="button"
            className="ux4g-topbar__iconbtn"
            aria-label={t('a11y.default')}
            onClick={() => apply(100)}
          >
            A
          </button>
          <button
            type="button"
            className="ux4g-topbar__iconbtn"
            aria-label={t('a11y.larger')}
            disabled={scale >= 150}
            onClick={() => apply(scale + 10)}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
}
