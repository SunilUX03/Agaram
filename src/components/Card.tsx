import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface Props {
  children: ReactNode;
  /** Makes the whole card a link. */
  to?: string;
  image?: ReactNode;
  className?: string;
}

export function Card({ children, to, image, className = '' }: Props) {
  const body = (
    <>
      {image && <div className="card-image">{image}</div>}
      <div className="card-body">{children}</div>
    </>
  );
  return to ? (
    <Link to={to} className={`card card-link ${className}`}>
      {body}
    </Link>
  ) : (
    <div className={`card ${className}`}>{body}</div>
  );
}
