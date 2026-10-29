import { useTranslation } from 'react-i18next';

export const PAGE_SIZE = 10;

/** UX4G pagination: previous, current page, next. */
export function Pagination({
  page,
  total,
  pageSize = PAGE_SIZE,
  onPage,
}: {
  page: number;
  total: number;
  pageSize?: number;
  onPage: (p: number) => void;
}) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="ux4g-pagination-wrapper ux4g-my-l" aria-label={t('ui.pagination.label')}>
      <div className="ux4g-pagination">
        <button
          type="button"
          className="ux4g-pagination-prev"
          aria-label={t('ui.pagination.previous')}
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
        >
          &laquo;
        </button>
        {Array.from({ length: pages }, (_, i) => (
          <button
            key={i}
            type="button"
            className={page === i + 1 ? 'active' : undefined}
            aria-current={page === i + 1 ? 'page' : undefined}
            aria-label={t('ui.pagination.page', { n: i + 1 })}
            onClick={() => onPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
        <button
          type="button"
          className="ux4g-pagination-next"
          aria-label={t('ui.pagination.next')}
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          &raquo;
        </button>
      </div>
    </nav>
  );
}

export function LoadMore({ onClick, hidden }: { onClick: () => void; hidden?: boolean }) {
  const { t } = useTranslation();
  if (hidden) return null;
  return (
    <div className="ux4g-d-flex ux4g-jc-center ux4g-my-l">
      <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={onClick}>
        {t('ui.pagination.loadMore')}
      </button>
    </div>
  );
}
