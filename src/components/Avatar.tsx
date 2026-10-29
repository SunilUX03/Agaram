import { useState } from 'react';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

/** Round photo, or initials on a tinted circle. The photo's alt text is the person's name. */
export function Avatar({
  name,
  photoUrl,
  size = 40,
  decorative,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
  /** Inside a button that already has an accessible name. */
  decorative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.38 };
  return photoUrl && !failed ? (
    <img
      className="avatar"
      style={style}
      src={photoUrl}
      alt={decorative ? '' : name}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  ) : (
    <span
      className="avatar avatar-initials"
      style={style}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      data-initials={decorative ? initials(name) : undefined}
    >
      {decorative ? null : initials(name)}
    </span>
  );
}
