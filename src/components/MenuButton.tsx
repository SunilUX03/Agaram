import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { useOutsideClick } from './hooks';

export interface MenuOption {
  label: string;
  /** A link, or an action when `onClick` is given. */
  to?: string;
  onClick?: () => void;
}
/** A UX4G button that opens a small menu of links. Escape closes it and returns focus. */
export function MenuButton({
  label,
  options,
  primary = true,
  wrapperClass = '',
  buttonClass = '',
  up = false,
}: {
  label: string;
  options: MenuOption[];
  primary?: boolean;
  wrapperClass?: string;
  buttonClass?: string;
  /** Open the menu above the button (floating buttons at the bottom of the screen). */
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useOutsideClick(ref, () => setOpen(false), open);
  return (
    <div
      className={`menu-button ${wrapperClass}`}
      ref={ref}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          btn.current?.focus();
        }
      }}
    >
      <button
        ref={btn}
        type="button"
        className={`${primary ? 'ux4g-btn-primary' : 'ux4g-btn-outline-primary'} ux4g-btn-m ${buttonClass}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label}
        <Icon name="down" size={18} />
      </button>
      {open && (
        <div
          className={`menu-pop${up ? ' menu-pop-up' : ''} ux4g-card ux4g-card-outline ux4g-shadow-l2`}
          role="menu"
        >
          {options.map((o) =>
            o.to ? (
              <Link
                key={o.label}
                to={o.to}
                role="menuitem"
                className="menu-pop-item ux4g-body-m-default"
                onClick={() => setOpen(false)}
              >
                {o.label}
              </Link>
            ) : (
              <button
                key={o.label}
                type="button"
                role="menuitem"
                className="menu-pop-item ux4g-body-m-default"
                onClick={() => (setOpen(false), o.onClick?.())}
              >
                {o.label}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
