import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

interface Props {
  to: string;
  title: ReactNode;
  meta?: ReactNode;
  chip?: ReactNode;
  icon?: ReactNode;
}

/** One list row. The whole row is the link. */
export function ListRow({ to, title, meta, chip, icon }: Props) {
  return (
    <Link to={to} className="list-row">
      {icon && <span className="list-row-icon">{icon}</span>}
      <span className="list-row-main">
        <span className="list-row-title">{title}</span>
        {meta && <span className="list-row-meta">{meta}</span>}
      </span>
      {chip}
      <Icon name="chevron" size={18} />
    </Link>
  );
}
