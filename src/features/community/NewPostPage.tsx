import { useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/Toast';
import { Checkbox, DatePicker, RadioGroup, Select, TextField } from '@/components/form/inputs';
import { SimpleRichText } from '@/components/form/SimpleRichText';
import { RouteHeader } from '@/app/usePage';
import { features } from '@/config/features';
import { useMut } from '@/data/hooks';
import { formatDMY, parseDMY } from '@/domain/dates';
import { sanitizeHtml } from '@/domain/sanitize';
import type { Post } from '@/domain/types';
import { UnsavedGuard } from '../requests/UnsavedGuard';

export default function NewPostPage() {
  const { t } = useTranslation('community');
  const [params] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const bypass = useRef(false);
  const create = useMut('createPost');
  const req = t('ui.errors.required', { ns: 'common' });
  const [v, setV] = useState({
    kind: (params.get('type') as Post['kind']) ?? 'discussion',
    audience: 'all',
    title: '',
    body: '',
    anonymous: false,
    askSeniors: params.get('ask') === '1',
    closes: formatDMY(new Date(Date.now() + 7 * 86400000)),
  });
  const [opts, setOpts] = useState(['', '']);
  const [tried, setTried] = useState(false);
  const [dirty, setDirty] = useState(false);
  const set =
    <K extends keyof typeof v>(k: K) =>
    (x: (typeof v)[K]) => (setDirty(true), setV((s) => ({ ...s, [k]: x })));
  const poll = v.kind === 'poll';
  const filled = opts.filter((o) => o.trim());
  const close = parseDMY(v.closes);
  const errs = {
    title: v.title.trim() ? undefined : req,
    body: poll || v.body.replace(/<[^>]*>/g, '').trim() ? undefined : req,
    opts: !poll || filled.length >= 2 ? undefined : t('discussions.new.needOptions'),
    closes:
      !poll || (close && close.getTime() > Date.now()) ? undefined : t('discussions.new.needDate'),
  };
  const ok = Object.values(errs).every((x) => !x);
  const post = async () => {
    setTried(true);
    if (!ok) return;
    const p = await create.mutateAsync([
      {
        kind: v.kind,
        title: v.title.trim(),
        body: poll ? '' : sanitizeHtml(v.body),
        audience: v.audience as Post['audience'],
        anonymous: features.features.anonymousPosts && v.anonymous,
        askSeniors: features.features.askSeniors && v.askSeniors,
        options: filled,
        closesAt: close?.toISOString(),
      },
    ]);
    setDirty(false);
    toast(t('discussions.new.posted'));
    bypass.current = true;
    nav(`/community/discussions/${p.id}`);
  };
  return (
    <>
      <UnsavedGuard bypass={bypass} dirty={dirty && !create.isPending} />
      <RouteHeader
        id="community.discussions.new"
        main={{ onClick: post, disabled: create.isPending }}
        breadcrumb={[
          { label: t('routes.community_discussions.headline'), to: '/community/discussions' },
          { label: t('routes.community_discussions_new.headline') },
        ]}
      />
      <div className="form-narrow">
        <RadioGroup
          name="post-kind"
          legend={t('discussions.new.type')}
          value={v.kind}
          onChange={(x) => set('kind')(x as Post['kind'])}
          options={(['discussion', 'experience', 'poll'] as const).map((k) => ({
            value: k,
            label: t(`common.kind.${k}`),
          }))}
        />
        <Select
          name="post-aud"
          label={t('discussions.new.audience')}
          value={v.audience}
          onChange={set('audience')}
          options={(['all', 'district', 'department'] as const).map((k) => ({
            value: k,
            label: t(`common.audience.${k}`),
          }))}
        />
        <TextField
          name="post-title"
          label={t('discussions.new.title')}
          required
          value={v.title}
          onChange={set('title')}
          error={tried ? errs.title : undefined}
        />
        {!poll && (
          <SimpleRichText
            name="post-body"
            label={t('discussions.new.body')}
            required
            value={v.body}
            onChange={set('body')}
            error={tried ? errs.body : undefined}
          />
        )}
        {poll && (
          <fieldset>
            <legend>{t('discussions.new.options')}</legend>
            {opts.map((o, i) => (
              <TextField
                key={i}
                name={`post-opt-${i}`}
                label={t('discussions.new.option', { n: i + 1 })}
                value={o}
                onChange={(x) => (setDirty(true), setOpts(opts.map((y, j) => (j === i ? x : y))))}
                error={i === 0 && tried ? errs.opts : undefined}
              />
            ))}
            {opts.length < 6 && (
              <button
                type="button"
                className="ux4g-btn-outline-primary ux4g-btn-s"
                onClick={() => setOpts([...opts, ''])}
              >
                {t('discussions.new.addOption')}
              </button>
            )}
            <div style={{ marginTop: 16 }}>
              <DatePicker
                name="post-closes"
                label={t('discussions.new.closes')}
                required
                value={v.closes}
                onChange={set('closes')}
                error={tried ? errs.closes : undefined}
              />
            </div>
          </fieldset>
        )}
        {features.features.anonymousPosts && (
          <>
            <Checkbox
              name="post-anon"
              label={t('discussions.new.anon')}
              checked={v.anonymous}
              onChange={set('anonymous')}
            />
            <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
              {t('discussions.new.anonNote')}
            </p>
          </>
        )}
        {features.features.askSeniors && (
          <Checkbox
            name="post-seniors"
            label={t('discussions.new.seniors')}
            checked={v.askSeniors}
            onChange={set('askSeniors')}
          />
        )}
      </div>
    </>
  );
}
