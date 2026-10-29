import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  /** Makes the whole card a link. */
  to?: string;
  image?: ReactNode;
  className?: string;
}

/** UX4G outline card. Pass `to` to make the whole card a link. */
export function Card({ children, to, image, className = '' }: Props) {
  const body = (
    <>
      {image && <div className="ux4g-ratio-16-9">{image}</div>}
      <div className="ux4g-card-body">{children}</div>
    </>
  );
  const cls = `ux4g-card ux4g-card-outline ux4g-card-vertical ${className}`;
  return to ? (
    <Link to={to} className={`${cls} card-link`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
