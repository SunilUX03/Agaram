import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

const VARIANT = {
  info: 'ux4g-alert-info',
  warning: 'ux4g-alert-warning',
  critical: 'ux4g-alert-error',
} as const;

/** UX4G in-page alert. */
export function Banner({
  variant = 'info',
  children,
}: {
  variant?: keyof typeof VARIANT;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`ux4g-alert ${VARIANT[variant]} ux4g-mb-m`}
      role={variant === 'info' ? 'status' : 'alert'}
    >
      <div className="ux4g-alert-content">
        <span className="ux4g-alert-message">
          <span className="sr-only">{t(`ui.banner.${variant}`)}: </span>
          {children}
        </span>
      </div>
    </div>
  );
}
