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

/** One list row (UX4G list item). The whole row is the link. */
export function ListRow({ to, title, meta, chip, icon }: Props) {
  return (
    <Link to={to} className="ux4g-list-item list-row">
      <span className="ux4g-list-item-row">
        {icon && <span className="list-row-icon">{icon}</span>}
        <span className="ux4g-list-item-start list-row-main">
          <span className="ux4g-body-m-strong">{title}</span>
          {meta && <span className="ux4g-body-s-default ux4g-text-neutral-secondary">{meta}</span>}
        </span>
        <span className="ux4g-list-item-end ux4g-d-flex ux4g-ai-center gap-s">
          {chip}
          <Icon name="chevron" size={20} />
        </span>
      </span>
    </Link>
  );
}
