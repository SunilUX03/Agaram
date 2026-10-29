import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from './Tag';

export interface KeyValue {
  label: string;
  value: ReactNode;
  meta?: 'verified' | 'self-reported';
}

/** Two columns on desktop, one on mobile. */
export function KeyValueList({ items }: { items: KeyValue[] }) {
  const { t } = useTranslation();
  return (
    <dl className="kv">
      {items.map((it) => (
        <div key={it.label} className="kv-item">
          <dt>{it.label}</dt>
          <dd>
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
