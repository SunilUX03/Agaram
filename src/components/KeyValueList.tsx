import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from './Tag';

export interface KeyValue {
  label: string;
  value: ReactNode;
  meta?: 'verified' | 'self-reported';
}

/** Label and value pairs. Two columns on desktop, one on mobile (UX4G grid utilities). */
export function KeyValueList({ items }: { items: KeyValue[] }) {
  const { t } = useTranslation();
  return (
    <dl className="ux4g-d-grid ux4g-grid-cols-1 ux4g-lg-grid-cols-2 ux4g-gap-m kv">
      {items.map((it) => (
        <div key={it.label} className="kv-item ux4g-border-neutral-subtle">
          <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">{it.label}</dt>
          <dd className="ux4g-body-m-default ux4g-d-flex ux4g-flex-wrap ux4g-ai-center ux4g-gap-s">
            {it.value}
            {it.meta && (
              <Tag>{it.meta === 'verified' ? t('ui.kv.verified') : t('ui.kv.selfReported')}</Tag>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
