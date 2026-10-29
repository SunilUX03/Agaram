import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useOutsideClick, useUid } from './hooks';

/** "What is this?" icon with a UX4G tooltip-style popover. Use on first appearance of an abbreviation. */
export function HelpTip({ text }: { text: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);
  const id = useUid('tip');
  useOutsideClick(ref, () => setOpen(false), open);
  return (
    <span
      className="ux4g-tooltip-wrapper helptip"
      ref={ref}
      onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
    >
      <button
        type="button"
        className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-s"
        aria-expanded={open}
        aria-controls={id}
        aria-label={t('ui.help.open')}
        onClick={() => setOpen(!open)}
      >
        <Icon name="help" size={18} />
      </button>
      {open && (
        <span
          id={id}
          role="note"
          className="ux4g-tooltip ux4g-tooltip-bottom-center ux4g-tooltip-s helptip-pop"
        >
          {text}
        </span>
      )}
    </span>
  );
}
