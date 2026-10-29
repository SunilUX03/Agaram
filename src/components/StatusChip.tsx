import { useTranslation } from 'react-i18next';
import { STATUS_STYLE } from '@/domain/status';

const ICON: Record<string, string> = {
  neutral: '○',
  info: 'ℹ',
  'warning-soft': '◐',
  'warning-strong': '!',
  success: '✓',
  'success-soft': '✓',
  critical: '✕',
};

/** Colour plus words plus a glyph, never colour alone. `status` is a key of STATUS_STYLE. */
export function StatusChip({ status }: { status: string }) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status] ?? STATUS_STYLE.draft;
  return (
    <span className={`chip chip-${style.tone}`}>
      <span aria-hidden="true">{ICON[style.tone]}</span>
      {t(style.label)}
    </span>
  );
}
