import { useTranslation } from 'react-i18next';

export type SkeletonVariant = 'text' | 'row' | 'card' | 'tile' | 'header' | 'table';

/** Placeholder sized like the real thing so the page does not jump. Announced once. UX4G has no skeleton component, so this is custom (see app.css). */
export function Skeleton({
  variant = 'row',
  count = 1,
}: {
  variant?: SkeletonVariant;
  count?: number;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`skel-group skel-group-${variant}`}
      role="status"
      aria-busy="true"
      aria-label={t('ui.loading')}
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skel skel-${variant}`} aria-hidden="true" />
      ))}
    </div>
  );
}
