import { useRef, useState, type KeyboardEvent } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon';
import { useOutsideClick } from '@/components/hooks';
import { isCurrent, type NavItem } from '@/config/nav';
import { prefetchPath } from '@/app/pages';

function Dropdown({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const groups = item.groups ?? [{ label: '', items: item.links ?? [] }];
  const { t } = useTranslation();
  return (
    <div className="dd" role="menu" aria-label={t(item.label)}>
      {groups.map((g, gi) => (
        <div key={gi} role="group" aria-label={g.label ? t(g.label) : undefined}>
          {g.label && <div className="dd-group">{t(g.label)}</div>}
          {g.items.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              role="menuitem"
              tabIndex={-1}
              onClick={onNavigate}
              onMouseEnter={() => prefetchPath(l.to)}
            >
              {t(l.label)}
            </Link>
          ))}
        </div>
      ))}
    </div>
  );
}

function Item({ item }: { item: NavItem }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  const timer = useRef<number>();
  const hasMenu = !!(item.links?.length || item.groups);
  const current = isCurrent(pathname, item.match);
  useOutsideClick(ref, () => setOpen(false), open);

  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
      ref.current?.querySelector<HTMLElement>('[data-trigger]')?.focus();
      return;
    }
    if (!hasMenu || !['ArrowDown', 'ArrowUp'].includes(e.key)) return;
    e.preventDefault();
    setOpen(true);
    requestAnimationFrame(() => {
      const links = Array.from(ref.current?.querySelectorAll<HTMLElement>('[role=menuitem]') ?? []);
      const at = links.indexOf(document.activeElement as HTMLElement);
      const n = e.key === 'ArrowDown' ? at + 1 : at - 1;
      links[(n + links.length) % links.length]?.focus();
    });
  };

  const label = t(item.label);
  const common = {
    'data-trigger': true,
    'aria-current': current ? ('page' as const) : undefined,
    className: current ? 'is-current' : undefined,
  };
  return (
    <li
      ref={ref}
      onKeyDown={key}
      onMouseEnter={() =>
        hasMenu &&
        (clearTimeout(timer.current), (timer.current = window.setTimeout(() => setOpen(true), 150)))
      }
      onMouseLeave={() => (
        clearTimeout(timer.current),
        (timer.current = window.setTimeout(() => setOpen(false), 200))
      )}
    >
      {item.to ? (
        <span className="menu-split">
          <NavLink to={item.to} onClick={() => setOpen(false)} {...common}>
            {label}
          </NavLink>
          {hasMenu && (
            <button
              type="button"
              className="menu-chevron"
              aria-haspopup="menu"
              aria-expanded={open}
              aria-label={t('nav.openMenu', { name: label })}
              onClick={() => setOpen(!open)}
            >
              <Icon name="down" size={14} />
            </button>
          )}
        </span>
      ) : (
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen(!open)}
          {...common}
          className={`menu-trigger${current ? ' is-current' : ''}`}
        >
          {label}
          <Icon name="down" size={14} />
        </button>
      )}
      {open && hasMenu && <Dropdown item={item} onNavigate={() => setOpen(false)} />}
    </li>
  );
}

export const DesktopMenu = ({ items }: { items: NavItem[] }) => {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.primary')} className="menu">
      <ul>
        {items.map((it) => (
          <Item key={it.id} item={it} />
        ))}
      </ul>
    </nav>
  );
};
