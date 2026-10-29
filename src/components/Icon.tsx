/** Material-style icon names used by UX4G's `ux4g-icon-outlined` font (ligatures). */
const NAMES: Record<string, string> = {
  home: 'home',
  file: 'description',
  requests: 'forum',
  community: 'groups',
  more: 'more_horiz',
  search: 'search',
  bell: 'notifications',
  desk: 'work',
  chevron: 'chevron_right',
  down: 'expand_more',
  close: 'close',
  check: 'check',
  lock: 'lock',
  calendar: 'calendar_month',
  plane: 'flight',
  rupee: 'currency_rupee',
  building: 'account_balance',
  book: 'menu_book',
  help: 'help',
  user: 'person',
  upload: 'upload',
  download: 'download',
  plus: 'add',
  heart: 'favorite',
  bookmark: 'bookmark',
  info: 'info',
  warning: 'warning',
  globe: 'language',
};

export type IconName = keyof typeof NAMES | (string & {});

/** Decorative by default; pass `label` for an icon that stands alone. */
export function Icon({
  name,
  size = 20,
  label,
}: {
  name: IconName;
  size?: number;
  label?: string;
}) {
  return (
    <i
      className="ux4g-icon-outlined"
      style={
        {
          '--ux4g-icon-size': `${size / 16}rem`,
          '--ux4g-icon-width': `${size / 16}rem`,
          '--ux4g-icon-height': `${size / 16}rem`,
          '--ux4g-icon-color': 'currentColor',
        } as React.CSSProperties
      }
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {NAMES[name] ?? NAMES.info}
    </i>
  );
}
