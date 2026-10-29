import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/Card';
import { Dialog } from '@/components/Dialog';
import { QueryView } from '@/components/QueryView';
import { SearchField } from '@/components/SearchField';
import { useToast } from '@/components/Toast';
import { TextArea, TextField } from '@/components/form/inputs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { useMut, useQ } from '@/data/hooks';

export default function ResourcesPage() {
  const { t } = useTranslation('learn');
  const [q, setQ] = useUrlState('q');
  const [dlg, setDlg] = useState(false);
  const query = useQ('resources');
  return (
    <>
      <RouteHeader id="learn.resources" main={{ onClick: () => setDlg(true) }} />
      <SearchField label={t('resources.search')} value={q} onChange={setQ} />
      <div style={{ marginTop: 24 }}>
        <QueryView query={query} skeleton="card" skeletonCount={4}>
          {(all) => {
            const n = q.trim().toLowerCase();
            const rows = all.filter(
              (r) => !n || `${r.name} ${r.note ?? ''}`.toLowerCase().includes(n),
            );
            return rows.length ? (
              <div className="grid-cards">
                {rows.map((r) => (
                  <Card key={r.id}>
                    <h3>{r.name}</h3>
                    {r.note && <p className="card-meta">{r.note}</p>}
                    <ul className="plain-list" style={{ margin: '8px 0' }}>
                      {r.links.map((l) => (
                        <li key={l.url}>
                          <a
                            className="link"
                            href={l.url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {l.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                    <p className="card-meta">{t('resources.sharedBy', { name: r.sharedBy })}</p>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="muted">{t('resources.empty')}</p>
            );
          }}
        </QueryView>
      </div>
      {dlg && <ShareDialog onClose={() => setDlg(false)} />}
    </>
  );
}

function ShareDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('learn');
  const toast = useToast();
  const add = useMut('addResource');
  const req = t('ui.errors.required', { ns: 'common' });
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [links, setLinks] = useState([{ label: '', url: '' }]);
  const [tried, setTried] = useState(false);
  const bad = (u: string) => !/^https?:\/\/\S+\.\S+/.test(u);
  const go = () => {
    setTried(true);
    if (!name.trim() || links.some((l) => bad(l.url))) return;
    add.mutate(
      [
        {
          name: name.trim(),
          note: note || undefined,
          links: links.map((l) => ({ label: l.label || l.url, url: l.url })),
        },
      ],
      { onSuccess: () => (onClose(), toast(t('resources.thanks'))) },
    );
  };
  return (
    <Dialog
      title={t('resources.dlgTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {t('resources.cancel')}
          </button>
          <button type="button" className="btn btn-primary" disabled={add.isPending} onClick={go}>
            {t('resources.share')}
          </button>
        </>
      }
    >
      <TextField
        name="res-name"
        label={t('resources.name')}
        required
        value={name}
        onChange={setName}
        error={tried && !name.trim() ? req : undefined}
      />
      <TextArea
        name="res-desc"
        label={t('resources.desc')}
        rows={3}
        value={note}
        onChange={setNote}
      />
      {links.map((l, i) => (
        <div key={i} className="form-grid">
          <TextField
            name={`res-l-${i}`}
            label={t('resources.linkLabel')}
            value={l.label}
            onChange={(x) => setLinks(links.map((y, j) => (j === i ? { ...y, label: x } : y)))}
          />
          <TextField
            name={`res-u-${i}`}
            label={t('resources.url')}
            required
            value={l.url}
            onChange={(x) => setLinks(links.map((y, j) => (j === i ? { ...y, url: x } : y)))}
            error={tried && bad(l.url) ? t('resources.badUrl') : undefined}
          />
        </div>
      ))}
      <button
        type="button"
        className="btn btn-sm"
        onClick={() => setLinks([...links, { label: '', url: '' }])}
      >
        {t('resources.addLink')}
      </button>
    </Dialog>
  );
}
