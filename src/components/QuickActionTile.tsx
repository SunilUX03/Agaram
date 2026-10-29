import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

/** A large tappable UX4G card with an icon and a label. */
export function QuickActionTile({
  to,
  icon,
  label,
}: {
  to: string;
  icon: IconName;
  label: string;
}) {
  return (
    <Link to={to} className="ux4g-card ux4g-card-outline ux4g-card-vertical card-link">
      <span className="ux4g-card-body ux4g-d-flex ux4g-flex-column gap-s tile-body">
        <span className="tile-icon" aria-hidden="true">
          <Icon name={icon} size={28} />
        </span>
        <span className="ux4g-label-l-strong">{label}</span>
      </span>
    </Link>
  );
}
