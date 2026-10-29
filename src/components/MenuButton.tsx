import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { useOutsideClick } from './hooks';

export interface MenuOption {
  label: string;
  to: string;
}
/** A button that opens a small menu of links. Escape closes it and returns focus. */
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
        className={`btn ${primary ? 'btn-primary' : ''}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        {label}
        <Icon name="down" size={16} />
      </button>
      {open && (
        <div className="dd" role="menu">
          {options.map((o) => (
            <Link key={o.to} to={o.to} role="menuitem" onClick={() => setOpen(false)}>
              {o.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
