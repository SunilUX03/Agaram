import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';

export function OfflineBanner() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => (removeEventListener('online', on), removeEventListener('offline', off));
  }, []);
  return online ? null : (
    <div className="wrap">
      <Banner variant="warning">{t('offline')}</Banner>
    </div>
  );
}
