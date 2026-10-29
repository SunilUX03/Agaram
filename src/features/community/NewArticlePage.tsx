import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/Toast';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { RadioGroup, TextArea, TextField } from '@/components/form/inputs';
import { SimpleRichText } from '@/components/form/SimpleRichText';
import { RouteHeader } from '@/app/usePage';
import { features } from '@/config/features';
import { useMut } from '@/data/hooks';
import { sanitizeHtml } from '@/domain/sanitize';
import { UnsavedGuard } from '../requests/UnsavedGuard';

export default function NewArticlePage() {
  const { t } = useTranslation('community');
  const nav = useNavigate();
  const toast = useToast();
  const create = useMut('createArticle');
  const req = t('ui.errors.required', { ns: 'common' });
  const [v, setV] = useState({ kind: 'article', title: '', role: '', summary: '' });
  const [sections, setSections] = useState([{ heading: '', body: '' }]);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tried, setTried] = useState(false);
  const [dirty, setDirty] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => (
    setDirty(true),
    setV((s) => ({ ...s, [k]: x }))
  );
  const e = {
    title: v.title.trim() ? undefined : req,
    role: v.role.trim() ? undefined : req,
    summary: v.summary.trim() ? undefined : req,
  };
  const go = async (status: 'draft' | 'published') => {
    setTried(true);
    if (status === 'published' && (e.title || e.role || e.summary)) return;
    if (status === 'draft' && !v.title.trim()) return;
    const a = await create.mutateAsync([
      {
        kind: v.kind as 'article',
        title: v.title.trim(),
        authorRole: v.role,
        summary: v.summary,
        sections: sections
          .filter((s) => s.heading || s.body)
          .map((s) => ({ ...s, body: sanitizeHtml(s.body) })),
        attachments: files,
        tags: [],
        status,
      },
    ]);
    setDirty(false);
    toast(status === 'published' ? t('knowledge.new.published') : t('knowledge.new.drafted'));
    nav(status === 'published' ? `/community/knowledge/${a.id}` : '/community/knowledge?tab=mine');
  };
  return (
    <>
      <UnsavedGuard dirty={dirty && !create.isPending} />
      <RouteHeader
        id="community.knowledge.new"
        main={{ onClick: () => go('published'), disabled: create.isPending }}
        secondary={
          <button type="button" className="btn" onClick={() => go('draft')}>
            {t('knowledge.new.saveDraft')}
          </button>
        }
        breadcrumb={[
          { label: t('routes.community_knowledge.headline'), to: '/community/knowledge' },
          { label: t('routes.community_knowledge_new.headline') },
        ]}
      />
      <div className="form-narrow">
        <RadioGroup
          name="art-kind"
          legend={t('knowledge.new.kind')}
          value={v.kind}
          onChange={set('kind')}
          options={[
            { value: 'article', label: t('knowledge.new.article') },
            {
              value: 'handover-note',
              label: `${t('knowledge.new.handover')} (${features.knowledge.handoverNotesVisibility === 'successor-and-department' ? t('knowledge.new.handoverVis') : ''})`,
            },
          ]}
        />
        <TextField
          name="art-title"
          label={t('knowledge.new.title')}
          required
          value={v.title}
          onChange={set('title')}
          error={tried ? e.title : undefined}
        />
        <TextField
          name="art-role"
          label={t('knowledge.new.role')}
          required
          value={v.role}
          onChange={set('role')}
          error={tried ? e.role : undefined}
        />
        <TextArea
          name="art-summary"
          label={t('knowledge.new.summary')}
          help={t('knowledge.new.summaryHelp')}
          required
          rows={3}
          value={v.summary}
          onChange={(x) => set('summary')(x.slice(0, 200))}
          error={tried ? e.summary : undefined}
        />
        <div className="sections-edit">
          {sections.map((s, i) => (
            <section
              key={i}
              className="card"
              aria-label={`${t('knowledge.new.sections')} ${i + 1}`}
            >
              <TextField
                name={`art-h-${i}`}
                label={t('knowledge.new.heading')}
                value={s.heading}
                onChange={(x) => (
                  setDirty(true),
                  setSections(sections.map((y, j) => (j === i ? { ...y, heading: x } : y)))
                )}
              />
              <SimpleRichText
                name={`art-b-${i}`}
                label={t('knowledge.new.body')}
                value={s.body}
                onChange={(x) => (
                  setDirty(true),
                  setSections(sections.map((y, j) => (j === i ? { ...y, body: x } : y)))
                )}
              />
              {sections.length > 1 && (
                <button
                  type="button"
                  className="link-btn"
                  onClick={() => setSections(sections.filter((_, j) => j !== i))}
                >
                  {t('knowledge.new.removeSection')}
                </button>
              )}
            </section>
          ))}
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setSections([...sections, { heading: '', body: '' }])}
          >
            {t('knowledge.new.addSection')}
          </button>
        </div>
        <div style={{ marginTop: 20 }}>
          <FileUpload
            name="art-files"
            label={t('knowledge.new.attach')}
            files={files}
            onChange={(f) => (setDirty(true), setFiles(f))}
            accept="any"
            maxMB={25}
          />
        </div>
      </div>
    </>
  );
}
