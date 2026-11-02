import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from '@/components/Tag';
import { useMut } from '@/data/hooks';
import { formatDate, formatTime } from '@/domain/dates';
import type { Comment } from '@/domain/types';
import { useAuthor, useLoc } from './parts';

/** Replies shown before "View {n} more replies". */
const SHOWN = 2;

/** The top-level comment a comment belongs to. One visible level: a reply to a reply stays in the same thread. */
export function rootOf(c: Comment, all: Comment[]): Comment {
  let cur = c;
  for (let i = 0; i < 10 && cur.replyTo; i++) {
    const up = all.find((x) => x.id === cur.replyTo);
    if (!up) break;
    cur = up;
  }
  return cur;
}

interface Props {
  parentId: string;
  comments: Comment[];
  /** Show the time as well as the date (proposal pages). */
  withTime?: boolean;
  /** Called for the Report button, when the page has one. */
  onReport?: (c: Comment) => void;
}

/**
 * Comments with replies that open directly under the comment they answer (like social media).
 * One composer at a time; typed drafts are kept in memory until posted or cancelled.
 */
export function CommentThread({ parentId, comments, withTime, onReport }: Props) {
  const { t } = useTranslation('community');
  const loc = useLoc();
  const author = useAuthor();
  const add = useMut('addComment');
  const [open, setOpen] = useState<string | null>(null); // the comment being answered
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string[]>([]);
  const [said, setSaid] = useState('');
  const [toShow, setToShow] = useState<string | null>(null);
  const [back, setBack] = useState<string | null>(null); // comment whose Reply button regains focus
  const area = useRef<HTMLTextAreaElement>(null);
  const reply = useRef<Record<string, HTMLButtonElement | null>>({});

  const roots = useMemo(() => comments.filter((c) => !c.replyTo), [comments]);
  const repliesOf = (r: Comment) =>
    comments
      .filter((c) => c.replyTo && rootOf(c, comments).id === r.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const who = (c: Comment) => author(c.author, c.mine);
  const stamp = (c: Comment) =>
    withTime
      ? `${formatDate(c.createdAt, loc)}, ${formatTime(c.createdAt, loc)}`
      : formatDate(c.createdAt, loc);

  // The composer takes focus as soon as it opens.
  useEffect(() => {
    if (!open) return;
    const el = area.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.scrollIntoView?.({ block: 'nearest' });
  }, [open]);
  useEffect(() => {
    if (!back || open) return;
    reply.current[back]?.focus();
    setBack(null);
  }, [back, open]);
  // After posting, scroll the new reply into view.
  useEffect(() => {
    if (!toShow) return;
    const el = document.getElementById(`cm-${toShow}`);
    if (!el) return;
    el.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
    setToShow(null);
  }, [toShow, comments]);

  const start = (c: Comment) => {
    const root = rootOf(c, comments);
    setExpanded((e) => (e.includes(root.id) ? e : [...e, root.id]));
    // A reply to a reply starts with the person's name as a mention.
    setDrafts((d) => (c.replyTo && d[c.id] === undefined ? { ...d, [c.id]: `@${who(c)} ` } : d));
    setOpen(c.id);
  };
  const cancel = (c: Comment) => {
    setDrafts((d) => {
      const { [c.id]: _gone, ...rest } = d;
      void _gone;
      return rest;
    });
    setOpen(null);
    setBack(c.id);
  };
  const post = (c: Comment) => {
    const text = (drafts[c.id] ?? '').trim();
    if (!text || add.isPending) return;
    const root = rootOf(c, comments);
    add.mutate([parentId, text, { replyTo: root.id }], {
      onSuccess: (made) => {
        setDrafts((d) => {
          const { [c.id]: _gone, ...rest } = d;
          void _gone;
          return rest;
        });
        setOpen(null);
        setToShow(made.id);
        setSaid(t('thread.posted'));
        setBack(c.id);
        window.setTimeout(() => setSaid(''), 3000);
      },
    });
  };
  const onKey = (e: KeyboardEvent, c: Comment) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      cancel(c);
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      post(c);
    }
  };

  const composer = (c: Comment) =>
    open === c.id && (
      <div id={`reply-composer-${c.id}`} className="reply-composer" onKeyDown={(e) => onKey(e, c)}>
        <p className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mb-xs">
          {t('thread.replyingTo', { name: who(c) })}
        </p>
        <label className="sr-only" htmlFor={`reply-text-${c.id}`}>
          {t('thread.replyLabel', { name: who(c) })}
        </label>
        <div className="ux4g-textarea ux4g-textarea-default">
          <textarea
            id={`reply-text-${c.id}`}
            ref={area}
            className="ux4g-textarea-input"
            rows={3}
            value={drafts[c.id] ?? ''}
            onChange={(e) => setDrafts((d) => ({ ...d, [c.id]: e.target.value }))}
          />
        </div>
        <div className="ux4g-d-flex ux4g-flex-wrap gap-s ux4g-mt-s">
          <button
            type="button"
            className="ux4g-btn-primary ux4g-btn-s"
            disabled={!(drafts[c.id] ?? '').trim() || add.isPending}
            onClick={() => post(c)}
          >
            {t('thread.postReply')}
          </button>
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-s"
            onClick={() => cancel(c)}
          >
            {t('thread.cancel')}
          </button>
        </div>
      </div>
    );

  const head = (c: Comment) => (
    <>
      <div className="comment-head ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s">
        <strong className="ux4g-body-m-strong">{who(c)}</strong>
        {c.author !== 'anonymous' && c.author.designation?.includes('earlier batch') && (
          <Tag>{t('discussions.seniors')}</Tag>
        )}
        <span className="ux4g-body-s-default ux4g-text-neutral-secondary">{stamp(c)}</span>
      </div>
      <p className="ux4g-body-m-default ux4g-my-xs">{c.text}</p>
    </>
  );
  const actions = (c: Comment) => (
    <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-m">
      <button
        type="button"
        ref={(el) => {
          reply.current[c.id] = el;
        }}
        className="ux4g-btn-text-primary ux4g-btn-s"
        aria-expanded={open === c.id}
        aria-controls={`reply-composer-${c.id}`}
        onClick={() => (open === c.id ? cancel(c) : start(c))}
      >
        {t('discussions.reply')}
        <span className="sr-only"> {t('thread.toName', { name: who(c) })}</span>
      </button>
      {onReport && !c.mine && (
        <button
          type="button"
          className="ux4g-btn-text-primary ux4g-btn-s"
          onClick={() => onReport(c)}
        >
          {t('discussions.report')}
        </button>
      )}
    </div>
  );

  return (
    <>
      <ul className="thread">
        {roots.map((r) => {
          const kids = repliesOf(r);
          const all = expanded.includes(r.id) || kids.length <= SHOWN;
          const shown = all ? kids : kids.slice(0, SHOWN);
          return (
            <li key={r.id} id={`cm-${r.id}`} className="comment">
              {head(r)}
              {actions(r)}
              {composer(r)}
              {(shown.length > 0 || !all) && (
                <ul className="thread">
                  {shown.map((k) => (
                    <li key={k.id} id={`cm-${k.id}`} className="comment">
                      {head(k)}
                      {actions(k)}
                      {composer(k)}
                    </li>
                  ))}
                  {!all && (
                    <li>
                      <button
                        type="button"
                        className="ux4g-btn-text-primary ux4g-btn-s"
                        aria-expanded={false}
                        onClick={() => setExpanded((e) => [...e, r.id])}
                      >
                        {t('thread.viewMore', { count: kids.length - SHOWN })}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <div role="status" aria-live="polite" className="sr-only">
        {said}
      </div>
    </>
  );
}
