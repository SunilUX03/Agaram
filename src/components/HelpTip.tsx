import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useOutsideClick, useUid } from './hooks';

/** "What is this?" icon with a popover. Use on first appearance of an abbreviation. */
export function HelpTip({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useUid('tip');
  useOutsideClick(ref, () => setOpen(false), open);
  return (
    <span className="helptip" ref={ref} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button
        type="button"
        className="icon-btn icon-btn-sm"
        aria-expanded={open}
        aria-controls={id}
        aria-label={t('ui.help.open')}
        onClick={() => setOpen(!open)}
      >
        <Icon name="help" size={16} />
      </button>
      {open && (
        <span id={id} role="note" className="helptip-pop">
          {text}
        </span>
      )}
    </span>
  );
}
