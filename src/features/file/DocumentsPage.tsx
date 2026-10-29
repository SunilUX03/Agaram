import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileViewer } from '@/components/FileViewer';
import { QueryView } from '@/components/QueryView';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { SearchField } from '@/components/SearchField';
import { Select } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { DocumentItem } from '@/domain/types';

export default function DocumentsPage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const [q, setQ] = useUrlState('q');
  const [type, setType] = useUrlState('type');
  const [year, setYear] = useUrlState('year');
  const [view, setView] = useState<DocumentItem | null>(null);
  const docs = useQ('documents');
  return (
    <>
      <RouteHeader id="file.documents" />
      <QueryView query={docs} skeleton="table" skeletonCount={6}>
        {(all) => {
          const types = [...new Set(all.map((d) => d.kind))];
          const years = [...new Set(all.map((d) => d.date.slice(0, 4)))].sort().reverse();
          const n = q.trim().toLowerCase();
          const shown = all.filter(
            (d) =>
              (!type || d.kind === type) &&
              (!year || d.date.startsWith(year)) &&
              (!n || `${d.title} ${d.orderNumber ?? ''}`.toLowerCase().includes(n)),
          );
          return (
            <>
              <div className="toolbar">
                <div className="grow">
                  <SearchField
                    label={t('documents.search')}
                    value={q}
                    onChange={setQ}
                    count={q ? shown.length : undefined}
                  />
                </div>
                <Select
                  name="doc-type"
                  label={t('documents.type')}
                  value={type}
                  onChange={setType}
                  placeholder={t('documents.all')}
                  options={types.map((x) => ({ value: x, label: x }))}
                />
                <Select
                  name="doc-year"
                  label={t('documents.year')}
                  value={year}
                  onChange={setYear}
                  placeholder={t('documents.all')}
                  options={years.map((x) => ({ value: x, label: x }))}
                />
              </div>
              {shown.length === 0 ? (
                <p className="muted">{t('documents.empty')}</p>
              ) : (
                <ResponsiveTable
                  caption={t('documents.search')}
                  rows={shown}
                  rowKey={(d) => d.id}
                  columns={[
                    {
                      key: 'title',
                      header: t('documents.cols.title'),
                      mobile: 'title',
                      sortValue: (d) => d.title,
                    },
                    { key: 'kind', header: t('documents.cols.type') },
                    {
                      key: 'orderNumber',
                      header: t('documents.cols.number'),
                      render: (d) => d.orderNumber ?? '—',
                    },
                    {
                      key: 'date',
                      header: t('documents.cols.date'),
                      render: (d) => formatDate(d.date, loc),
                      sortValue: (d) => d.date,
                    },
                    {
                      key: 'linked',
                      header: t('documents.cols.linked'),
                      render: (d) =>
                        d.linkedTo ? (
                          <Link className="link" to={d.linkedTo.to}>
                            {d.linkedTo.label}
                          </Link>
                        ) : (
                          '—'
                        ),
                    },
                    {
                      key: 'actions',
                      header: t('documents.cols.view'),
                      render: (d) => (
                        <span className="row" style={{ gap: 12 }}>
                          <button type="button" className="link-btn" onClick={() => setView(d)}>
                            {t('documents.cols.view')}
                          </button>
                          <a className="link" href={d.fileUrl} download>
                            {t('documents.cols.download')}
                          </a>
                        </span>
                      ),
                    },
                  ]}
                />
              )}
              {view && (
                <FileViewer
                  title={view.orderNumber ?? view.title}
                  url={view.fileUrl}
                  onClose={() => setView(null)}
                />
              )}
            </>
          );
        }}
      </QueryView>
    </>
  );
}
