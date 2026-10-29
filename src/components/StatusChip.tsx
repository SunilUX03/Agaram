import { useTranslation } from 'react-i18next';
import { STATUS_STYLE, type Tone } from '@/domain/status';
import { Icon } from './Icon';

/** UX4G Tag per tone. Always words plus a glyph, never colour alone. */
const TAG: Record<Tone, { cls: string; icon: string }> = {
  neutral: { cls: 'ux4g-tag-tonal-neutral', icon: 'info' },
  info: { cls: 'ux4g-tag-tonal-info', icon: 'info' },
  'warning-soft': { cls: 'ux4g-tag-tonal-warning', icon: 'warning' },
  'warning-strong': { cls: 'ux4g-tag-outline-warning', icon: 'warning' },
  success: { cls: 'ux4g-tag-tonal-success', icon: 'check' },
  'success-soft': { cls: 'ux4g-tag-outline-success', icon: 'check' },
  critical: { cls: 'ux4g-tag-tonal-error', icon: 'warning' },
};

export function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  const tag = TAG[style.tone];
  return (
    <span className={`${tag.cls} ux4g-tag-s`}>
      <Icon name={tag.icon} size={14} />
      {t(style.label)}
    </span>
  );
}
