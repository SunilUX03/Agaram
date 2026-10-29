import { useState } from 'react';

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const sizeClass = (px: number) =>
  px <= 24 ? 'xs' : px <= 32 ? 's' : px <= 40 ? 'm' : px <= 56 ? 'l' : px <= 72 ? 'xl' : '2xl';

/** UX4G profile avatar. Photo, or initials when there is none. */
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
  const cls = `ux4g-avatar ux4g-avatar-profile ux4g-avatar-${sizeClass(size)}`;
  return photoUrl && !failed ? (
    <div className={cls}>
      <img
        src={photoUrl}
        alt={decorative ? '' : name}
        loading="lazy"
        onError={() => setFailed(true)}
      />
    </div>
  ) : (
    <div
      className={cls}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
    >
      {initials(name)}
    </div>
  );
}
