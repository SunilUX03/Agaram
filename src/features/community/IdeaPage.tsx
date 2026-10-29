import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { Skeleton } from '@/components/Skeleton';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { Dialog } from '@/components/Dialog';
import { TextArea, TextField } from '@/components/form/inputs';
import { NotFound } from '@/app/NotFound';
import { useMut, useQ } from '@/data/hooks';
import { formatDate, formatTime } from '@/domain/dates';
import type { Idea } from '@/domain/types';
import { BackButton, useAuthor, useLoc } from './parts';

const ORDER = ['submitted', 'under-review'];

function StatusSteps({ idea }: { idea: Idea }) {
  const { t } = useTranslation('community');
  const final =
    idea.status === 'accepted' || idea.status === 'not-taken-forward' ? idea.status : null;
  const reached = final ? 2 : ORDER.indexOf(idea.status);
  const steps = [...ORDER, ...(final ? [final] : [])];
  return (
    <div>
      <StatusChip status={`idea:${idea.status}`} />
      <ol className="status-steps" aria-label={t('ideas.page.status')}>
        {steps.map((s, i) => (
          <li
            key={s}
            className={i <= reached ? 'chip chip-neutral' : 'chip'}
            style={i > reached ? { opacity: 0.5 } : undefined}
            aria-current={i === reached ? 'step' : undefined}
          >
            {t(`ideas.page.steps.${s}`)}
          </li>
        ))}
      </ol>
      {idea.statusReason && (
        <p className="ux4g-text-neutral-secondary">
          {t('ideas.page.reason', { reason: idea.statusReason })}
        </p>
      )}
    </div>
  );
}

export default function IdeaPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('community');
  const loc = useLoc();
  const author = useAuthor();
  const q = useQ('idea', id);
  const comments = useQ('comments', id);
  const add = useMut('addComment');
  const upd = useMut('updateIdea');
  const [text, setText] = useState('');
  const [edit, setEdit] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '' });
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const i = q.data;
  const submit = () =>
    text.trim() && add.mutate([id, text.trim(), {}], { onSuccess: () => setText('') });
  return (
    <>
      <PageHeader
        headline={i.title}
        tagline={t('ideas.page.meta', {
          author: i.author.name,
          department: i.department ?? i.district ?? '',
          date: formatDate(i.createdAt, loc),
        })}
        main={<BackButton idea={i} />}
        breadcrumb={[
          { label: t('routes.community_ideas.headline'), to: '/community/ideas' },
          { label: i.title },
        ]}
      />
      <div className="layout-side">
        <div className="stack">
          <section className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad">
            <StatusSteps idea={i} />
            <div className="tags">
              <Tag>{i.type}</Tag>
              {i.budget && <Tag>{t('ideas.page.cost', { amount: i.budget })}</Tag>}
            </div>
            <h2 className="ux4g-heading-xs-strong" style={{ marginTop: 16 }}>
              {t('ideas.page.description')}
            </h2>
            <p>{i.description}</p>
            {i.attachments.length > 0 && (
              <>
                <h2 className="ux4g-heading-xs-strong">{t('ideas.page.attachments')}</h2>
                <ul className="files">
                  {i.attachments.map((a, k) => (
                    <li key={k}>{a.name}</li>
                  ))}
                </ul>
              </>
            )}
            {i.mine && i.status === 'submitted' && (
              <button
                type="button"
                className="ux4g-btn-text-primary ux4g-btn-s"
                onClick={() => (
                  setDraft({ title: i.title, description: i.description }),
                  setEdit(true)
                )}
              >
                {t('ideas.page.edit')}
              </button>
            )}
          </section>
          <section
            className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
            aria-labelledby="idea-disc"
          >
            <h2 id="idea-disc" className="ux4g-heading-xs-strong">
              {t('ideas.page.discussion')}
            </h2>
            {comments.isPending ? (
              <Skeleton variant="row" count={2} />
            ) : comments.data?.length ? (
              <ul className="thread">
                {comments.data.map((c) => (
                  <li key={c.id} className="comment">
                    <div className="comment-head">
                      <strong>{author(c.author, c.mine)}</strong>
                      <span className="ux4g-text-neutral-secondary">
                        {formatDate(c.createdAt, loc)}, {formatTime(c.createdAt, loc)}
                      </span>
                    </div>
                    <p>{c.text}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="ux4g-text-neutral-secondary">{t('ideas.page.noComments')}</p>
            )}
            <TextArea
              name="idea-comment"
              label={t('ideas.page.addComment')}
              value={text}
              onChange={setText}
              rows={3}
            />
            <button
              type="button"
              className="ux4g-btn-primary ux4g-btn-m"
              disabled={!text.trim() || add.isPending}
              onClick={submit}
            >
              {t('ideas.page.comment')}
            </button>
          </section>
        </div>
      </div>
      {edit && (
        <Dialog
          title={t('ideas.page.editTitle')}
          onClose={() => setEdit(false)}
          footer={
            <>
              <button
                type="button"
                className="ux4g-btn-outline-primary ux4g-btn-m"
                onClick={() => setEdit(false)}
              >
                {t('ideas.page.cancel')}
              </button>
              <button
                type="button"
                className="ux4g-btn-primary ux4g-btn-m"
                onClick={() => upd.mutate([i.id, draft], { onSuccess: () => setEdit(false) })}
              >
                {t('ideas.page.save')}
              </button>
            </>
          }
        >
          <TextField
            name="edit-title"
            label={t('ideas.new.title')}
            value={draft.title}
            onChange={(v) => setDraft({ ...draft, title: v })}
          />
          <TextArea
            name="edit-desc"
            label={t('ideas.new.description')}
            value={draft.description}
            onChange={(v) => setDraft({ ...draft, description: v })}
          />
        </Dialog>
      )}
      <Link to="/community/ideas" className="sr-only">
        {t('routes.community_ideas.headline')}
      </Link>
    </>
  );
}
