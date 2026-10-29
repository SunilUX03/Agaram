import { useTranslation } from 'react-i18next';

export const PAGE_SIZE = 10;

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
    <nav className="pagination" aria-label={t('ui.pagination.label')}>
      <button type="button" className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        {t('ui.pagination.previous')}
      </button>
      <span aria-live="polite">
        {t('ui.pagination.page', { n: page })} / {pages}
      </span>
      <button
        type="button"
        className="btn"
        disabled={page >= pages}
        onClick={() => onPage(page + 1)}
      >
        {t('ui.pagination.next')}
      </button>
    </nav>
  );
}

export function LoadMore({ onClick, hidden }: { onClick: () => void; hidden?: boolean }) {
  const { t } = useTranslation();
  if (hidden) return null;
  return (
    <div className="loadmore">
      <button type="button" className="btn" onClick={onClick}>
        {t('ui.pagination.loadMore')}
      </button>
    </div>
  );
}
