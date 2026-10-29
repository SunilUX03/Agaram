const PATHS: Record<string, string> = {
  home: 'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z',
  file: 'M6 2h8l5 5v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM14 2v5h5',
  requests: 'M4 4h16v12H8l-4 4zM8 9h8M8 12h5',
  community:
    'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM16 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM2 20c0-3 3-5 6-5s6 2 6 5M15 15c3 0 7 1 7 5',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7zM10 20a2 2 0 0 0 4 0',
  desk: 'M3 7h18v13H3zM8 7V4h8v3',
  chevron: 'M9 6l6 6-6 6',
  down: 'M6 9l6 6 6-6',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l5 5 9-10',
  lock: 'M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  plane: 'M2 12l20-8-6 16-4-6z',
  rupee: 'M7 5h10M7 9h10M7 5c6 0 6 8 0 8l8 6',
  building: 'M4 21V8l8-5 8 5v13M9 21v-6h6v6',
  book: 'M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12',
  help: 'M12 17h.01M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 1-1 1.7M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  upload: 'M12 16V4M7 9l5-5 5 5M4 20h16',
  download: 'M12 4v12M7 11l5 5 5-5M4 20h16',
  plus: 'M12 5v14M5 12h14',
  heart: 'M12 21s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 10c0 6-8 11-8 11z',
  bookmark: 'M6 3h12v18l-6-4-6 4z',
  info: 'M12 8h.01M11 12h1v5h1M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  warning: 'M12 3l10 18H2zM12 10v5M12 18h.01',
  globe:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2c3 3 4 6 4 10s-1 7-4 10c-3-3-4-6-4-10s1-7 4-10z',
};

export type IconName = keyof typeof PATHS | (string & {});

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
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path d={PATHS[name] ?? PATHS.info} />
    </svg>
  );
}
