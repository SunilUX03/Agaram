import { Link } from 'react-router-dom';
import { Icon, type IconName } from './Icon';

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
    <Link to={to} className="tile">
      <Icon name={icon} size={28} />
      <span>{label}</span>
    </Link>
  );
}
