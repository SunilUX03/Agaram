import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { useOutsideClick } from './hooks';

export interface MenuOption {
  label: string;
  to: string;
}
/** A UX4G button that opens a small menu of links. Escape closes it and returns focus. */
export function MenuButton({
  label,
  options,
  primary = true,
}: {
  label: string;
  options: MenuOption[];
  primary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  useOutsideClick(ref, () => setOpen(false), open);
  return (
    <div
      className="menu-button"
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
        className={`${primary ? 'ux4g-btn-primary' : 'ux4g-btn-outline-primary'} ux4g-btn-m`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label}
        <Icon name="down" size={18} />
      </button>
      {open && (
        <div className="menu-pop ux4g-card ux4g-card-outline ux4g-shadow-l2" role="menu">
          {options.map((o) => (
            <Link
              key={o.to}
              to={o.to}
              role="menuitem"
              className="menu-pop-item ux4g-body-m-default"
              onClick={() => setOpen(false)}
            >
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
