import { useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { ErrorState } from '@/components/EmptyState';
import { PageHeader } from '@/components/PageHeader';
import { PollBar } from '@/components/PollBar';
import { Skeleton } from '@/components/Skeleton';
import { Tag } from '@/components/Tag';
import { useToast } from '@/components/Toast';
import { RadioGroup, Select } from '@/components/form/inputs';
import { NotFound } from '@/app/NotFound';
import { useMut, useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import { sanitizeHtml } from '@/domain/sanitize';
import type { Comment } from '@/domain/types';
import { useAuthor, useLoc } from './parts';

export default function DiscussionPage() {
  const { id = '' } = useParams();
  const { t } = useTranslation('community');
  const loc = useLoc();
  const author = useAuthor();
  const toast = useToast();
  const q = useQ('post', id);
  const cm = useQ('comments', id);
  const add = useMut('addComment');
  const vote = useMut('vote');
  const report = useMut('report');
  const box = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [replyTo, setReplyTo] = useState<Comment | null>(null);
  const [choice, setChoice] = useState('');
  const [rep, setRep] = useState<Comment | null>(null);
  const [reason, setReason] = useState('');
  if (q.isPending) return <Skeleton variant="card" count={2} />;
  if (q.isError)
    return q.error.message === 'not-found' ? (
      <NotFound />
    ) : (
      <ErrorState onRetry={() => void q.refetch()} />
    );
  const p = q.data;
  const closed = p.poll ? new Date(p.poll.closesAt) < new Date() : false;
  const showResult = !!p.poll && (!!p.poll.myVote || closed);
  const total = p.poll?.options.reduce((s, o) => s + o.votes, 0) ?? 0;
  const roots = (cm.data ?? []).filter((c) => !c.replyTo);
  const kids = (c: Comment) => (cm.data ?? []).filter((x) => x.replyTo === c.id);
  const send = () =>
    text.trim() &&
    add.mutate([id, text.trim(), { replyTo: replyTo?.id }], {
      onSuccess: () => (setText(''), setReplyTo(null)),
    });
  const node = (c: Comment, depth: number) => (
    <li key={c.id} className="comment">
      <div className="comment-head">
        <strong>{author(c.author, c.mine)}</strong>
        {c.author !== 'anonymous' && c.author.designation?.includes('earlier batch') && (
          <Tag>{t('discussions.seniors')}</Tag>
        )}
        <span className="muted">{formatDate(c.createdAt, loc)}</span>
      </div>
      <p>{c.text}</p>
      <div className="row" style={{ gap: 16 }}>
        {depth === 0 && (
          <button
            type="button"
            className="link-btn"
            onClick={() => (setReplyTo(c), box.current?.focus())}
          >
            {t('discussions.reply')}
          </button>
        )}
        {!c.mine && (
          <button type="button" className="link-btn" onClick={() => setRep(c)}>
            {t('discussions.report')}
          </button>
        )}
      </div>
      {depth === 0 && kids(c).length > 0 && (
        <ul className="thread">{kids(c).map((k) => node(k, 1))}</ul>
      )}
    </li>
  );
  return (
    <>
      <PageHeader
        headline={p.title}
        tagline={t('discussions.meta', {
          author: author(p.author, p.mine),
          audience: t(`common.audience.${p.audience}`),
          date: formatDate(p.createdAt, loc),
        })}
        main={
          <button type="button" className="btn btn-primary" onClick={() => box.current?.focus()}>
            {t('routes.community_discussion.main')}
          </button>
        }
        breadcrumb={[
          { label: t('routes.community_discussions.headline'), to: '/community/discussions' },
          { label: p.title },
        ]}
      />
      <div className="form-narrow stack">
        <section className="card">
          <div className="tags">
            <Tag>{t(`common.kind.${p.kind}`)}</Tag>
            {p.askSeniors && <Tag>{t('common.asked')}</Tag>}
          </div>
          <div
            className="rich-out"
            style={{ marginTop: 12 }}
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body) }}
          />
          {p.poll && (
            <div style={{ marginTop: 16 }}>
              {showResult || closed ? (
                p.poll.options.map((o) => (
                  <PollBar
                    key={o.id}
                    label={o.label}
                    votes={o.votes}
                    total={total}
                    showResult
                    mine={p.poll!.myVote === o.id}
                  />
                ))
              ) : (
                <>
                  <RadioGroup
                    name="poll"
                    legend={t('common.kind.poll')}
                    value={choice}
                    onChange={setChoice}
                    options={p.poll.options.map((o) => ({ value: o.id, label: o.label }))}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!choice || vote.isPending}
                    onClick={() => vote.mutate([p.id, choice])}
                  >
                    {t('discussions.vote')}
                  </button>
                </>
              )}
              <p className="small muted">
                {closed
                  ? t('discussions.closed')
                  : t('discussions.closes', { date: formatDate(p.poll.closesAt, loc) })}
              </p>
            </div>
          )}
        </section>
        <section className="card" aria-label={t('discussions.reply')}>
          {cm.isPending ? (
            <Skeleton variant="row" count={2} />
          ) : roots.length ? (
            <ul className="thread">{roots.map((c) => node(c, 0))}</ul>
          ) : (
            <p className="muted">{t('discussions.noReplies')}</p>
          )}
          <div style={{ marginTop: 16 }}>
            {replyTo && (
              <p className="small">
                {t('discussions.replyTo', { name: author(replyTo.author, replyTo.mine) })}{' '}
                <button type="button" className="link-btn" onClick={() => setReplyTo(null)}>
                  {t('discussions.cancel')}
                </button>
              </p>
            )}
            <label className="sr-only" htmlFor="reply-box">
              {t('discussions.replyBox')}
            </label>
            <textarea
              id="reply-box"
              ref={box}
              className="input"
              rows={3}
              placeholder={t('discussions.replyBox')}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button
              type="button"
              className="btn btn-primary"
              style={{ marginTop: 12 }}
              disabled={!text.trim() || add.isPending}
              onClick={send}
            >
              {t('discussions.send')}
            </button>
          </div>
        </section>
      </div>
      {rep && (
        <Dialog
          title={t('discussions.reportTitle')}
          onClose={() => setRep(null)}
          footer={
            <>
              <button type="button" className="btn" onClick={() => setRep(null)}>
                {t('discussions.cancel')}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!reason}
                onClick={() =>
                  report.mutate([rep.id, reason], {
                    onSuccess: () => (
                      setRep(null),
                      setReason(''),
                      toast(t('discussions.reportThanks'))
                    ),
                  })
                }
              >
                {t('discussions.reportSend')}
              </button>
            </>
          }
        >
          <Select
            name="report-reason"
            label={t('discussions.reportReason')}
            required
            value={reason}
            onChange={setReason}
            options={['abuse', 'spam', 'private', 'other'].map((k) => ({
              value: k,
              label: t(`discussions.reasons.${k}`),
            }))}
          />
        </Dialog>
      )}
    </>
  );
}
