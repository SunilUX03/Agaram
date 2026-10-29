import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { ToggleButton } from '@/components/ToggleButton';
import { useMut } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { Article, Idea, PersonRef, Post } from '@/domain/types';

export const useLoc = () => (useTranslation().i18n.language === 'ta' ? 'ta-IN' : 'en-IN');

/** Author line. Anonymous posts never show a name to other officers (brief, section 9). */
export function useAuthor() {
  const { t } = useTranslation('community');
  return (a: PersonRef | 'anonymous', mine = false) =>
    a === 'anonymous' ? (mine ? t('common.youAnonymous') : t('common.anonymous')) : a.name;
}

export function BackButton({ idea }: { idea: Idea }) {
  const { t } = useTranslation('community');
  const back = useMut('backIdea');
  return (
    <ToggleButton
      label={t('ideas.back')}
      onLabel={t('ideas.backed')}
      pressed={idea.backedByMe}
      count={idea.backerCount}
      disabled={idea.mine}
      title={idea.mine ? t('ideas.ownTip') : undefined}
      onChange={(on) => back.mutateAsync([idea.id, on])}
    />
  );
}

export function IdeaCard({ idea }: { idea: Idea }) {
  const { t } = useTranslation('community');
  const loc = useLoc();
  return (
    <article className="card idea-card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <StatusChip status={`idea:${idea.status}`} />
        <div className="tags">
          <Tag>{idea.type}</Tag>
          {idea.grievance && <Tag>{t('ideas.badge.grievance')}</Tag>}
        </div>
      </div>
      <h3 style={{ marginTop: 12 }}>
        <Link to={`/community/ideas/${idea.id}`} className="stretch">
          {idea.title}
        </Link>
      </h3>
      <p className="card-meta clamp-2">{idea.description}</p>
      <p className="card-meta" style={{ marginTop: 8 }}>
        {idea.author.name}
        {idea.department ? `, ${idea.department}` : ''} · {formatDate(idea.createdAt, loc)}
      </p>
      <div className="card-foot">
        <BackButton idea={idea} />
        <span className="card-meta">
          <Icon name="community" size={14} /> {t('common.comments', { count: idea.commentCount })}
        </span>
      </div>
    </article>
  );
}

export function PostRow({ post }: { post: Post }) {
  const { t } = useTranslation('community');
  const loc = useLoc();
  const author = useAuthor();
  const excerpt = post.body.replace(/<[^>]+>/g, ' ');
  return (
    <Link to={`/community/discussions/${post.id}`} className="list-row post-row">
      <span className="list-row-main">
        <span className="tags">
          <Tag>{t(`common.kind.${post.kind}`)}</Tag>
          <Tag>{t(`common.audience.${post.audience}`)}</Tag>
          {post.askSeniors && <Tag>{t('common.asked')}</Tag>}
        </span>
        <span className="list-row-title" style={{ marginTop: 6 }}>
          {post.title}
        </span>
        <span className="list-row-meta clamp-2">{excerpt}</span>
        <span className="list-row-meta">
          {author(post.author, false)} · {t('common.replies', { count: post.replyCount })} ·{' '}
          {t('common.lastActivity', { date: formatDate(post.lastActivityAt, loc) })}
        </span>
      </span>
      <Icon name="chevron" size={18} />
    </Link>
  );
}

export function ArticleCard({ a }: { a: Article }) {
  const { t } = useTranslation('community');
  const save = useMut('toggleSaved');
  return (
    <article className="card article-card">
      <div className="card-image article-lead" aria-hidden="true">
        {a.leadImageUrl ? <img src={a.leadImageUrl} alt="" /> : <span className="lead-tint" />}
      </div>
      <div className="tags">
        {a.status === 'draft' && <Tag>{t('knowledge.draft')}</Tag>}
        {a.kind === 'handover-note' && <Tag>{t('knowledge.handoverNote')}</Tag>}
      </div>
      <h3 style={{ marginTop: 6 }}>
        <Link to={`/community/knowledge/${a.id}`} className="stretch">
          {a.title}
        </Link>
      </h3>
      <p className="card-meta">
        {a.authorRole}
        {a.district ? `, ${a.district}` : ''}
      </p>
      <p className="clamp-2" style={{ marginTop: 6 }}>
        {a.summary}
      </p>
      <div className="tags" style={{ marginTop: 8 }}>
        {a.tags.map((x) => (
          <Tag key={x}>{x}</Tag>
        ))}
      </div>
      <div className="card-foot">
        <ToggleButton
          label={t('knowledge.save')}
          onLabel={t('knowledge.saved')}
          icon="bookmark"
          pressed={a.savedByMe}
          onChange={(on) => save.mutateAsync(['article', a.id, on])}
        />
      </div>
    </article>
  );
}
