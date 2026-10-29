import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { SearchField } from '@/components/SearchField';
import { useToast } from '@/components/Toast';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { Select, TextArea } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { features } from '@/config/features';
import { REQUEST_GROUPS, REQUEST_TYPES } from '@/config/requests';
import { useMut } from '@/data/hooks';
import { useCfg } from './cfg';

export default function NewRequestPage() {
  const { t } = useTranslation('requests');
  const c = useCfg();
  const [q, setQ] = useUrlState('q');
  const [dialog, setDialog] = useState(false);
  const n = q.trim().toLowerCase();
  const match = (x: (typeof REQUEST_TYPES)[number]) =>
    !n || `${c(x.key, 'card', x.cardName)} ${c(x.key, 'help', x.help)}`.toLowerCase().includes(n);
  const groups = REQUEST_GROUPS.map((g) => ({
    ...g,
    items: REQUEST_TYPES.filter((x) => x.group === g.id && match(x)),
  })).filter((g) => g.items.length);
  return (
    <>
      <RouteHeader
        id="requests.new"
        breadcrumb={[
          { label: t('routes.requests.headline'), to: '/requests' },
          { label: t('routes.requests_new.headline') },
        ]}
      />
      <div className="ux4g-mb-xl">
        <SearchField label={t('new.search')} value={q} onChange={setQ} />
      </div>
      {groups.length === 0 && <EmptyState message={t('new.noResults')} icon="search" />}
      {groups.map((g) => (
        <section key={g.id} className="section" aria-labelledby={`grp-${g.id}`}>
          <div className="section-head">
            <h2 id={`grp-${g.id}`} className="ux4g-heading-m-strong">
              {t(`new.groups.${g.id}`)}
            </h2>
          </div>
          <div className="grid-cards">
            {g.items.map((x) => (
              <Card key={x.key} to={`/requests/new/${x.key}`}>
                <span className="list-row-icon ux4g-mb-s">
                  <Icon name={x.icon} />
                </span>
                <h3 className="ux4g-heading-xs-strong">{c(x.key, 'card', x.cardName)}</h3>
                <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
                  {c(x.key, 'help', x.help)}
                </p>
                <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-xs">
                  {t('new.keepReady', { items: c(x.key, 'keep', x.keepReady) })}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ))}
      {features.requests.uploadOnlyOption && (
        <p>
          <button
            type="button"
            className="ux4g-btn-text-primary ux4g-btn-s"
            onClick={() => setDialog(true)}
          >
            {t('new.haveForm')}
          </button>
        </p>
      )}
      {dialog && <UploadOnly onClose={() => setDialog(false)} />}
    </>
  );
}

function UploadOnly({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('requests');
  const toast = useToast();
  const nav = useNavigate();
  const save = useMut('saveRequest');
  const [type, setType] = useState('');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [remarks, setRemarks] = useState('');
  const [tried, setTried] = useState(false);
  const req = t('ui.errors.required', { ns: 'common' });
  const send = async () => {
    setTried(true);
    if (!type || !files.length) return;
    const r = await save.mutateAsync([{ type, values: { remarks }, attachments: files }]);
    toast(t('form.sent'));
    onClose();
    nav(`/requests/${r.id}`);
  };
  return (
    <Dialog
      title={t('new.dlgTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={onClose}>
            {t('new.dlgCancel')}
          </button>
          <button
            type="button"
            className="ux4g-btn-primary ux4g-btn-m"
            disabled={save.isPending}
            onClick={send}
          >
            {t('new.dlgSend')}
          </button>
        </>
      }
    >
      <Select
        name="up-type"
        label={t('new.dlgType')}
        required
        value={type}
        onChange={setType}
        error={tried && !type ? req : undefined}
        options={REQUEST_TYPES.map((x) => ({ value: x.key, label: x.cardName }))}
      />
      <FileUpload
        name="up-file"
        label={t('new.dlgFile')}
        required
        files={files}
        onChange={setFiles}
        error={tried && !files.length ? t('new.dlgNeedFile') : undefined}
      />
      <TextArea
        name="up-remarks"
        label={t('new.dlgRemarks')}
        value={remarks}
        onChange={setRemarks}
      />
    </Dialog>
  );
}
