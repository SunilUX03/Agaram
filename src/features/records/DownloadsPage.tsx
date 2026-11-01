import { useTranslation } from 'react-i18next';
import { Accordion } from '@/components/Accordion';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable, type Column } from '@/components/ResponsiveTable';
import { SearchField } from '@/components/SearchField';
import { UrlTabs, useUrlTab, type TabDef } from '@/components/UrlTabs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { LibraryItem } from '@/domain/types';
import { useLocale } from './shared';

/** The eight lists, in order (v2, section 3.4). Each maps to the library kind that holds its rows. */
export const DOWNLOAD_TABS = [
  { id: 'rules', kind: 'rule' },
  { id: 'circulars', kind: 'circular' },
  { id: 'faqs', kind: 'faq' },
  { id: 'gos', kind: 'go' },
  { id: 'forms', kind: 'form' },
  { id: 'special', kind: 'special' },
  { id: 'dro', kind: 'dro' },
  { id: 'updates', kind: 'announcement' },
] as const;

export default function DownloadsPage() {
  const { t } = useTranslation('records');
  const loc = useLocale();
  const tabs: TabDef[] = DOWNLOAD_TABS.map((x) => ({
    id: x.id,
    label: t(`downloads.tabs.${x.id}`),
  }));
  const [tab] = useUrlTab(tabs);
  const [q, setQ] = useUrlState('q');
  const kind = DOWNLOAD_TABS.find((x) => x.id === tab)!.kind;
  const query = useQ('library', [kind]);

  const columns: Column<LibraryItem>[] = [
    {
      key: 'number',
      header: t('downloads.number'),
      render: (r) => r.number ?? '—',
      mobile: 'show',
      mobileOrder: 1,
    },
    {
      key: 'date',
      header: t('downloads.date'),
      render: (r) => formatDate(r.date, loc),
      mobile: 'show',
      mobileOrder: 2,
    },
    { key: 'title', header: t('downloads.description'), mobile: 'title' },
    {
      key: 'view',
      header: t('downloads.actions'),
      mobile: 'show',
      mobileOrder: 3,
      render: (r) =>
        r.fileUrl ? (
          <a
            className="ux4g-btn-outline-primary ux4g-btn-s"
            href={r.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('downloads.view')}
            <span className="sr-only"> {r.title}</span>
          </a>
        ) : null,
    },
  ];

  return (
    <>
      <RouteHeader id="records.downloads" />
      <UrlTabs tabs={tabs} label={t('downloads.tabsLabel')} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <SearchField label={t('downloads.search')} value={q} onChange={setQ} />
        <div className="ux4g-mt-m">
          <QueryView query={query} skeleton="row" skeletonCount={6}>
            {(all) => {
              const n = q.trim().toLowerCase();
              const rows = all
                .filter(
                  (r) =>
                    !n ||
                    `${r.title} ${r.number ?? ''} ${r.answer ?? ''} ${r.description ?? ''}`
                      .toLowerCase()
                      .includes(n),
                )
                .sort((a, b) => b.date.localeCompare(a.date));
              if (!rows.length)
                return (
                  <p className="ux4g-body-m-default ux4g-text-neutral-secondary">
                    {t('downloads.empty')}
                  </p>
                );
              if (kind === 'faq')
                return (
                  <Accordion
                    items={rows.map((f) => ({
                      id: f.id,
                      title: f.title,
                      content: <p className="ux4g-body-m-default">{f.answer}</p>,
                    }))}
                  />
                );
              if (kind === 'announcement')
                return (
                  <ul className="plain-list">
                    {rows.map((u) => (
                      <li key={u.id} className="task-row ux4g-d-flex ux4g-flex-column">
                        <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                          {formatDate(u.date, loc)}
                        </span>
                        <span className="ux4g-body-m-strong">{u.title}</span>
                        {u.description && (
                          <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                            {u.description}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                );
              return (
                <ResponsiveTable
                  caption={t(`downloads.tabs.${tab}`)}
                  columns={columns}
                  rows={rows}
                  rowKey={(r) => r.id}
                />
              );
            }}
          </QueryView>
        </div>
      </div>
    </>
  );
}
