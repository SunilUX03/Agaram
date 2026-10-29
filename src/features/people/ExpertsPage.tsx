import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { Tag } from '@/components/Tag';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { useToast } from '@/components/Toast';
import { RadioGroup, TextArea, TextField } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useMut, useQ } from '@/data/hooks';

export default function ExpertsPage() {
  const { t } = useTranslation('people');
  const tabs = ['all', 'organisation', 'individual'].map((id) => ({
    id,
    label: t(`experts.tabs.${id}`),
  }));
  const [tab] = useUrlTab(tabs);
  const [q, setQ] = useUrlState('q');
  const [dlg, setDlg] = useState(false);
  const query = useQ('experts');
  return (
    <>
      <RouteHeader id="people.experts" main={{ onClick: () => setDlg(true) }} />
      <SearchField label={t('experts.search')} value={q} onChange={setQ} />
      <div className="ux4g-mt-m">
        <UrlTabs tabs={tabs} />
      </div>
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={query} skeleton="card" skeletonCount={4}>
          {(all) => {
            const n = q.trim().toLowerCase();
            const rows = all.filter(
              (e) =>
                (tab === 'all' || e.kind === tab) &&
                (!n || `${e.name} ${e.description}`.toLowerCase().includes(n)),
            );
            if (!rows.length)
              return <p className="ux4g-text-neutral-secondary">{t('experts.empty')}</p>;
            return (
              <div className="grid-cards">
                {rows.map((e) => (
                  <article
                    key={e.id}
                    className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
                  >
                    <div className="tags">
                      <Tag>{e.kind === 'organisation' ? t('experts.org') : t('experts.indiv')}</Tag>
                      {e.pending && <Tag>{t('experts.pending')}</Tag>}
                    </div>
                    <h3 className="ux4g-heading-xs-strong ux4g-mt-xs">{e.name}</h3>
                    <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {e.description}
                    </p>
                    <div className="card-foot">
                      {e.website && (
                        <a
                          className="ux4g-text-link-m"
                          href={e.website}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {t('experts.website')}
                        </a>
                      )}
                      {e.phone && (
                        <a className="ux4g-text-link-m" href={`tel:${e.phone.replace(/\s/g, '')}`}>
                          {t('experts.phone', { phone: e.phone })}
                        </a>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            );
          }}
        </QueryView>
      </div>
      {dlg && <AddDialog onClose={() => setDlg(false)} />}
    </>
  );
}

function AddDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('people');
  const toast = useToast();
  const add = useMut('addExpert');
  const req = t('ui.errors.required', { ns: 'common' });
  const [v, setV] = useState({ kind: 'organisation', name: '', desc: '', website: '', phone: '' });
  const [tried, setTried] = useState(false);
  const go = () => {
    setTried(true);
    if (!v.name.trim() || !v.desc.trim()) return;
    add.mutate(
      [
        {
          kind: v.kind as 'organisation',
          name: v.name.trim(),
          description: v.desc.trim(),
          website: v.website || undefined,
          phone: v.phone || undefined,
        },
      ],
      { onSuccess: () => (onClose(), toast(t('experts.thanks'))) },
    );
  };
  return (
    <Dialog
      title={t('experts.dlgTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={onClose}>
            {t('experts.cancel')}
          </button>
          <button
            type="button"
            className="ux4g-btn-primary ux4g-btn-m"
            disabled={add.isPending}
            onClick={go}
          >
            {t('experts.add')}
          </button>
        </>
      }
    >
      <RadioGroup
        name="ex-kind"
        legend={t('experts.kind')}
        value={v.kind}
        onChange={(x) => setV({ ...v, kind: x })}
        options={[
          { value: 'organisation', label: t('experts.org') },
          { value: 'individual', label: t('experts.indiv') },
        ]}
      />
      <TextField
        name="ex-name"
        label={t('experts.name')}
        required
        value={v.name}
        onChange={(x) => setV({ ...v, name: x })}
        error={tried && !v.name.trim() ? req : undefined}
      />
      <TextArea
        name="ex-desc"
        label={t('experts.desc')}
        required
        rows={3}
        value={v.desc}
        onChange={(x) => setV({ ...v, desc: x })}
        error={tried && !v.desc.trim() ? req : undefined}
      />
      <TextField
        name="ex-web"
        label={t('experts.website2')}
        value={v.website}
        onChange={(x) => setV({ ...v, website: x })}
      />
      <TextField
        name="ex-phone"
        label={t('experts.phone2')}
        value={v.phone}
        onChange={(x) => setV({ ...v, phone: x })}
      />
    </Dialog>
  );
}
