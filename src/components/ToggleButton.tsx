import { useState } from 'react';
import { Icon, type IconName } from './Icon';

interface Props {
  label: string;
  /** Label shown while on, for example "Backed" or "Saved". Defaults to `label`. */
  onLabel?: string;
  pressed: boolean;
  count?: number;
  icon?: IconName;
  disabled?: boolean;
  title?: string;
  /** Called with the new value. The button updates at once and rolls back if this rejects. */
  onChange: (next: boolean) => void | Promise<unknown>;
}

export function ToggleButton({
  label,
  onLabel,
  pressed,
  count,
  icon = 'heart',
  disabled,
  title,
  onChange,
}: Props) {
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const on = optimistic ?? pressed;
  const shownCount =
    count === undefined
      ? undefined
      : count + (optimistic === null ? 0 : Number(optimistic) - Number(pressed));
  const click = async () => {
    const next = !on;
    setOptimistic(next);
    try {
      await onChange(next);
    } catch {
      /* rolled back below */
    } finally {
      setOptimistic(null);
    }
  };
  return (
    <button
      type="button"
      className={`btn btn-toggle${on ? ' is-on' : ''}`}
      aria-pressed={on}
      disabled={disabled}
      title={title}
      onClick={click}
    >
      <Icon name={icon} size={16} />
      {on ? (onLabel ?? label) : label}
      {shownCount !== undefined && <span className="toggle-count">{shownCount}</span>}
    </button>
  );
}
