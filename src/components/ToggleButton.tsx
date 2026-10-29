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
  /** Called with the new value. The button updates at once and settles when this finishes. */
  onChange: (next: boolean) => void | Promise<unknown>;
}

/** UX4G pill button that toggles: tonal when on, outline when off. */
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
      className={`${on ? 'ux4g-btn-tonal-primary' : 'ux4g-btn-outline-primary'} ux4g-btn-s ux4g-radius-full`}
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
