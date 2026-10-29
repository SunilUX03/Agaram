import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

export function Banner({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'warning' | 'critical';
  children: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <div className={`banner banner-${variant}`} role={variant === 'info' ? 'status' : 'alert'}>
      <Icon name={variant === 'info' ? 'info' : 'warning'} />
      <div>
        <span className="sr-only">{t(`ui.banner.${variant}`)}: </span>
        {children}
      </div>
    </div>
  );
}
