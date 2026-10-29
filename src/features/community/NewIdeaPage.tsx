import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Banner } from '@/components/Banner';
import { Tag } from '@/components/Tag';
import { StatusChip } from '@/components/StatusChip';
import { useToast } from '@/components/Toast';
import { FileUpload, type UploadedFile } from '@/components/form/FileUpload';
import { RadioGroup, Select, TextField } from '@/components/form/inputs';
import { SimpleRichText } from '@/components/form/SimpleRichText';
import { RouteHeader } from '@/app/usePage';
import { DEPARTMENTS, TN_DISTRICTS, toOptions } from '@/config/options';
import { useMut, useQ } from '@/data/hooks';
import { sanitizeHtml } from '@/domain/sanitize';
import type { IdeaType } from '@/domain/types';
import { UnsavedGuard } from '../requests/UnsavedGuard';

const TYPES: IdeaType[] = [
  'Flagship initiative',
  'Best practice',
  'Pilot proposal',
  'Policy request',
  'Resource request',
  'Coordination issue',
  'Scheme feedback',
  'Last-mile gap',
  'Law and order',
  'General suggestion',
  'Other',
];

export default function NewIdeaPage() {
  const { t } = useTranslation('community');
  const req = t('ui.errors.required', { ns: 'common' });
  const nav = useNavigate();
  const toast = useToast();
  const bypass = useRef(false);
  const officer = useQ('officer');
  const create = useMut('createIdea');
  const [step, setStep] = useState<'edit' | 'preview'>('edit');
  const [v, setV] = useState({
    title: '',
    type: '',
    description: '',
    budget: '',
    visibility: 'all',
    district: '',
    department: '',
  });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [tried, setTried] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [prefilled, setPrefilled] = useState(false);
  if (officer.data && !prefilled) {
    setPrefilled(true);
    setV((s) => ({
      ...s,
      district: officer.data.currentPosting.postingIn,
      department: officer.data.currentPosting.department,
    }));
  }
  const set = (k: keyof typeof v) => (x: string) => (
    setDirty(true),
    setV((s) => ({ ...s, [k]: x }))
  );
  const empty = (x: string) => !x.trim() || x === '<br>';
  const errs = {
    title: empty(v.title) ? req : undefined,
    type: v.type ? undefined : req,
    description: empty(v.description.replace(/<[^>]*>/g, '')) ? req : undefined,
    place: v.district || v.department ? undefined : t('ideas.new.needOne'),
  };
  const ok = !errs.title && !errs.type && !errs.description && !errs.place;
  const post = async () => {
    const i = await create.mutateAsync([
      {
        title: v.title.trim(),
        type: v.type as IdeaType,
        description: sanitizeHtml(v.description),
        budget: v.budget || undefined,
        visibility: v.visibility as 'all' | 'admin',
        district: v.district || undefined,
        department: v.department || undefined,
        attachments: files,
      },
    ]);
    setDirty(false);
    toast(t('ideas.new.posted'));
    bypass.current = true;
    nav(`/community/ideas/${i.id}`);
  };
  return (
    <>
      <UnsavedGuard bypass={bypass} dirty={dirty && !create.isPending} />
      <RouteHeader
        id="community.ideas.new"
        main={
          step === 'preview' ? (
            <button
              type="button"
              className="ux4g-btn-primary ux4g-btn-m"
              disabled={create.isPending}
              onClick={post}
            >
              {t('routes.community_ideas_new.main')}
            </button>
          ) : undefined
        }
        breadcrumb={[
          { label: t('routes.community_ideas.headline'), to: '/community/ideas' },
          { label: t('routes.community_ideas_new.headline') },
        ]}
      />
      {step === 'edit' ? (
        <div className="form-narrow">
          <TextField
            name="idea-title"
            label={t('ideas.new.title')}
            help={t('ideas.new.titleHelp')}
            required
            value={v.title}
            onChange={(x) => set('title')(x.slice(0, 120))}
            error={tried ? errs.title : undefined}
          />
          <Select
            name="idea-type"
            label={t('ideas.new.type')}
            required
            value={v.type}
            placeholder={t('ideas.new.choose')}
            onChange={set('type')}
            options={toOptions(TYPES)}
            error={tried ? errs.type : undefined}
          />
          <SimpleRichText
            name="idea-desc"
            label={t('ideas.new.description')}
            required
            value={v.description}
            onChange={set('description')}
            error={tried ? errs.description : undefined}
          />
          <TextField
            name="idea-budget"
            label={t('ideas.new.budget')}
            help={t('ideas.new.budgetHelp')}
            value={v.budget}
            onChange={set('budget')}
          />
          <RadioGroup
            name="idea-vis"
            legend={t('ideas.new.visibility')}
            value={v.visibility}
            onChange={set('visibility')}
            options={[
              { value: 'all', label: t('ideas.new.visAll') },
              { value: 'admin', label: t('ideas.new.visAdmin') },
            ]}
          />
          <div className="form-grid">
            <Select
              name="idea-district"
              label={t('ideas.new.district')}
              value={v.district}
              placeholder={t('ideas.new.choose')}
              onChange={set('district')}
              options={toOptions(TN_DISTRICTS)}
              error={tried ? errs.place : undefined}
            />
            <Select
              name="idea-dept"
              label={t('ideas.new.department')}
              value={v.department}
              placeholder={t('ideas.new.choose')}
              onChange={set('department')}
              options={toOptions(DEPARTMENTS)}
              error={tried ? errs.place : undefined}
            />
          </div>
          <FileUpload
            name="idea-files"
            label={t('ideas.new.attachments')}
            help={t('ideas.new.attachHelp')}
            files={files}
            onChange={(f) => (setDirty(true), setFiles(f))}
            maxMB={25}
            accept="any"
          />
          <button
            type="button"
            className="ux4g-btn-primary ux4g-btn-m"
            onClick={() => (setTried(true), ok && setStep('preview'))}
          >
            {t('ideas.new.preview')}
          </button>
        </div>
      ) : (
        <div className="form-narrow stack-sm">
          <Banner variant="info">{t('ideas.new.previewTitle')}</Banner>
          <article className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
            <StatusChip status="idea:submitted" />
            <h2 style={{ margin: '12px 0 4px' }}>{v.title}</h2>
            <div className="tags">
              <Tag>{v.type}</Tag>
              {v.budget && <Tag>{t('ideas.page.cost', { amount: v.budget })}</Tag>}
            </div>
            <div
              className="rich-out"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(v.description) }}
            />
          </article>
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-m"
            onClick={() => setStep('edit')}
          >
            {t('ideas.new.backEdit')}
          </button>
        </div>
      )}
    </>
  );
}
