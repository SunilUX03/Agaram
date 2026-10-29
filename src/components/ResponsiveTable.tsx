import { useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useIsMobile } from './hooks';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** `title` makes this the card heading on mobile; `hide` drops it on mobile. */
  mobile?: 'title' | 'show' | 'hide';
  /** Order on mobile (lower first). */
  mobileOrder?: number;
  sortValue?: (row: T) => string | number;
}

interface Props<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
}

/** A UX4G table on desktop, stacked UX4G cards below 640 px. The first column is the card title unless set. */
export function ResponsiveTable<T>({ caption, columns, rows, rowKey, onRowClick }: Props<T>) {
  const { t } = useTranslation();
  const mobile = useIsMobile();
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sort?.key);
    if (!col?.sortValue || !sort) return rows;
    const val = col.sortValue;
    return [...rows].sort((a, b) => (val(a) < val(b) ? -sort.dir : val(a) > val(b) ? sort.dir : 0));
  }, [rows, columns, sort]);

  const cell = (c: Column<T>, r: T) =>
    c.render ? c.render(r) : String((r as Record<string, unknown>)[c.key] ?? '');

  if (mobile) {
    const title = columns.find((c) => c.mobile === 'title') ?? columns[0];
    const rest = columns
      .filter((c) => c !== title && c.mobile !== 'hide')
      .sort((a, b) => (a.mobileOrder ?? 0) - (b.mobileOrder ?? 0));
    return (
      <ul className="plain-list ux4g-d-flex ux4g-flex-column ux4g-gap-s" aria-label={caption}>
        {sorted.map((r) => (
          <li key={rowKey(r)} className="ux4g-card ux4g-card-outline ux4g-card-vertical">
            <div className="ux4g-card-body">
              <div className="ux4g-label-l-strong ux4g-mb-xs">
                {onRowClick ? (
                  <button
                    type="button"
                    className="ux4g-btn-text-primary ux4g-btn-s"
                    onClick={() => onRowClick(r)}
                  >
                    {cell(title, r)}
                  </button>
                ) : (
                  cell(title, r)
                )}
              </div>
              <dl className="kv-mobile">
                {rest.map((c) => (
                  <div key={c.key}>
                    <dt className="ux4g-body-s-default ux4g-text-neutral-secondary">{c.header}</dt>
                    <dd>{cell(c, r)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="ux4g-table-responsive">
      <table
        className={`ux4g-table ux4g-table-m ux4g-table-rounded${onRowClick ? ' ux4g-table-interactive' : ''}`}
      >
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                aria-sort={
                  sort?.key === c.key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined
                }
              >
                {c.sortValue ? (
                  <button
                    type="button"
                    className="ux4g-btn-text-neutral ux4g-btn-xs"
                    aria-label={t('ui.sort.by', { name: c.header })}
                    onClick={() =>
                      setSort({ key: c.key, dir: sort?.key === c.key && sort.dir === 1 ? -1 : 1 })
                    }
                  >
                    {c.header}
                    <Icon name="down" size={14} />
                  </button>
                ) : (
                  c.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((r) => (
            <tr key={rowKey(r)} onClick={() => onRowClick?.(r)}>
              {columns.map((c, i) => (
                <td key={c.key}>
                  {i === 0 && onRowClick ? (
                    <button
                      type="button"
                      className="ux4g-btn-text-primary ux4g-btn-s"
                      onClick={(e) => (e.stopPropagation(), onRowClick(r))}
                    >
                      {cell(c, r)}
                    </button>
                  ) : (
                    cell(c, r)
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
