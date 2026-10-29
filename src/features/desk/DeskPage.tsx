import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { QueryView } from '@/components/QueryView';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { DatePicker } from '@/components/form/inputs';
import { RouteHeader } from '@/app/usePage';
import { useMut, useQ } from '@/data/hooks';
import { formatDate, parseDMY } from '@/domain/dates';
import type { DeskTask } from '@/domain/types';
import { ColleagueCard } from '../people/ColleaguesPage';

export default function DeskPage() {
  const { t } = useTranslation('desk');
  const tabs = ['tasks', 'notes', 'people', 'items'].map((id) => ({ id, label: t(`tabs.${id}`) }));
  const [tab, setTab] = useUrlTab(tabs);
  const focusTask = () => {
    setTab('tasks');
    setTimeout(() => document.getElementById('task-text')?.focus(), 50);
  };
  return (
    <>
      <RouteHeader id="desk" main={{ onClick: focusTask }} />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'tasks' && <Tasks />}
        {tab === 'notes' && <Notes />}
        {tab === 'people' && <People />}
        {tab === 'items' && <Items />}
      </div>
    </>
  );
}

function Tasks() {
  const { t, i18n } = useTranslation('desk');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('tasks');
  const add = useMut('addTask');
  const toggle = useMut('toggleTask');
  const del = useMut('deleteTask');
  const [text, setText] = useState('');
  const [due, setDue] = useState('');
  const [err, setErr] = useState('');
  const [rm, setRm] = useState<DeskTask | null>(null);
  const [showDone, setShowDone] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const go = () => {
    if (!text.trim()) return setErr(t('tasks.needText'));
    setErr('');
    const d = parseDMY(due);
    add.mutate([text.trim(), d ? d.toISOString().slice(0, 10) : undefined], {
      onSuccess: () => (setText(''), setDue('')),
    });
  };
  return (
    <>
      <form className="task-add" onSubmit={(e) => (e.preventDefault(), go())}>
        <div className="grow">
          <label htmlFor="task-text" className="sr-only">
            {t('tasks.label')}
          </label>
          <div className="ux4g-input-container ux4g-input-l ux4g-input-default">
            <div className="ux4g-input">
              <input
                id="task-text"
                ref={input}
                className="ux4g-input-input"
                placeholder={t('tasks.placeholder')}
                value={text}
                onChange={(e) => setText(e.target.value)}
                aria-invalid={!!err}
                aria-describedby={err ? 'task-err' : undefined}
              />
            </div>
          </div>
          {err && (
            <div id="task-err" className="ux4g-body-s-default ux4g-text-error">
              {err}
            </div>
          )}
        </div>
        <div className="task-due">
          <DatePicker name="task-due" label={t('tasks.due')} value={due} onChange={setDue} />
        </div>
        <button type="submit" className="ux4g-btn-primary ux4g-btn-m" disabled={add.isPending}>
          {t('tasks.add')}
        </button>
      </form>
      <QueryView query={q} skeleton="row" skeletonCount={4} empty={{ message: t('tasks.empty') }}>
        {(all) => {
          const open = all.filter((x) => !x.done);
          const done = all.filter((x) => x.done);
          const row = (x: DeskTask) => (
            <li key={x.id} className="task-row ux4g-d-flex ux4g-ai-center ux4g-jc-between gap-s">
              <label htmlFor={`tk-${x.id}`} className="ux4g-checkbox ux4g-checkbox-m grow">
                <input
                  type="checkbox"
                  id={`tk-${x.id}`}
                  className="ux4g-checkbox-input"
                  checked={x.done}
                  onChange={() => toggle.mutate([x.id])}
                />
                <span className="ux4g-checkbox-control">
                  <span className="ux4g-checkmark"></span>
                </span>
                <span className="ux4g-checkbox-content task-text">
                  <span className={`ux4g-body-m-strong${x.done ? ' is-done' : ''}`}>{x.text}</span>
                  {x.due && (
                    <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                      {t('tasks.due2', { date: formatDate(x.due, loc) })}
                    </span>
                  )}
                </span>
              </label>
              <button
                type="button"
                className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-m"
                aria-label={t('tasks.delete', { text: x.text })}
                onClick={() => setRm(x)}
              >
                <Icon name="close" />
              </button>
            </li>
          );
          return (
            <>
              <ul className="plain-list">{open.map(row)}</ul>
              {done.length > 0 && (
                <div>
                  <button
                    type="button"
                    className="ux4g-btn-text-primary ux4g-btn-s"
                    aria-expanded={showDone}
                    onClick={() => setShowDone(!showDone)}
                  >
                    {t('tasks.showDone', { n: done.length })}
                  </button>
                  {showDone && <ul className="plain-list">{done.map(row)}</ul>}
                </div>
              )}
            </>
          );
        }}
      </QueryView>
      {rm && (
        <ConfirmDialog
          title={t('tasks.delTitle')}
          confirmLabel={t('tasks.delBtn')}
          cancelLabel={t('tasks.cancel')}
          onCancel={() => setRm(null)}
          onConfirm={() => del.mutate([rm.id], { onSuccess: () => setRm(null) })}
        />
      )}
    </>
  );
}

function Notes() {
  const { t, i18n } = useTranslation('desk');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const q = useQ('notes');
  const add = useMut('addNote2');
  const del = useMut('deleteNote');
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  return (
    <>
      {open ? (
        <div className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad ux4g-mb-m">
          <label htmlFor="note-text" className="sr-only">
            {t('notes.label')}
          </label>
          <div className="ux4g-textarea ux4g-textarea-default">
            <textarea
              className="ux4g-textarea-input"
              id="note-text"

              rows={3}
              placeholder={t('notes.placeholder')}
              value={text}
              autoFocus
              onChange={(e) => setText(e.target.value)}
            />
          </div>
          <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s ux4g-mt-s">
            <button
              type="button"
              className="ux4g-btn-primary ux4g-btn-s"
              disabled={!text.trim()}
              onClick={() =>
                add.mutate([text.trim()], { onSuccess: () => (setText(''), setOpen(false)) })
              }
            >
              {t('notes.save')}
            </button>
            <button
              type="button"
              className="ux4g-btn-outline-primary ux4g-btn-s"
              onClick={() => setOpen(false)}
            >
              {t('notes.cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m ux4g-mb-m"
          onClick={() => setOpen(true)}
        >
          {t('notes.add')}
        </button>
      )}
      <QueryView query={q} skeleton="card" skeletonCount={3} empty={{ message: t('notes.empty') }}>
        {(all) => (
          <ul className="sticky-grid plain-list">
            {all.map((n) => (
              <li key={n.id} className="sticky-note">
                <p>{n.text}</p>
                <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s ux4g-jc-between">
                  <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                    {formatDate(n.createdAt, loc)}
                  </span>
                  <button
                    type="button"
                    className="ux4g-icon-btn ux4g-icon-btn-text-primary ux4g-icon-btn-m"
                    aria-label={t('notes.delete')}
                    onClick={() => del.mutate([n.id])}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </QueryView>
    </>
  );
}

function People() {
  const { t } = useTranslation('desk');
  const saved = useQ('saved');
  const people = useQ('colleagues');
  const rm = useMut('toggleSaved');
  const ids = saved.data?.filter((s) => s.kind === 'person').map((s) => s.refId) ?? [];
  if (saved.isPending || people.isPending)
    return (
      <QueryView query={saved} skeleton="card">
        {() => null}
      </QueryView>
    );
  const rows = people.data?.filter((c) => ids.includes(c.id)) ?? [];
  if (!rows.length)
    return (
      <EmptyState
        message={t('people.empty')}
        icon="user"
        actionLabel={t('routes.people_colleagues.headline', { ns: 'people' })}
        to="/people/colleagues"
      />
    );
  return (
    <div className="grid-cards">
      {rows.map((c) => (
        <div key={c.id}>
          <ColleagueCard c={c} />
          <button
            type="button"
            className="ux4g-btn-text-primary ux4g-btn-s"
            onClick={() => rm.mutate(['person', c.id, false])}
          >
            {t('people.remove')}
          </button>
        </div>
      ))}
    </div>
  );
}

function Items() {
  const { t } = useTranslation('desk');
  const saved = useQ('saved');
  const ideas = useQ('ideas');
  const articles = useQ('articles');
  const lib = useQ('library');
  const rm = useMut('toggleSaved');
  if ([saved, ideas, articles, lib].some((x) => x.isPending))
    return (
      <QueryView query={saved} skeleton="row">
        {() => null}
      </QueryView>
    );
  const items = (saved.data ?? [])
    .filter((s) => s.kind !== 'person')
    .map((s) => {
      if (s.kind === 'idea') {
        const i = ideas.data?.find((x) => x.id === s.refId);
        return i && { s, title: i.title, to: `/community/ideas/${i.id}` };
      }
      if (s.kind === 'article') {
        const a = articles.data?.find((x) => x.id === s.refId);
        return a && { s, title: a.title, to: `/community/knowledge/${a.id}` };
      }
      const l = lib.data?.find((x) => x.id === s.refId);
      return (
        l && { s, title: l.title, to: l.kind === 'form' ? '/library/forms' : '/library/circulars' }
      );
    })
    .filter(Boolean) as {
    s: { id: string; kind: 'idea' | 'article' | 'library'; refId: string };
    title: string;
    to: string;
  }[];
  if (!items.length) return <EmptyState message={t('items.empty')} icon="bookmark" />;
  return (
    <ul className="plain-list">
      {items.map((x) => (
        <li key={x.s.id} className="list-row">
          <Link to={x.to} className="list-row-main">
            <span className="ux4g-body-m-strong">{x.title}</span>
            <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
              {t(`items.kind.${x.s.kind}`)}
            </span>
          </Link>
          <button
            type="button"
            className="ux4g-btn-text-primary ux4g-btn-s"
            aria-label={t('items.removeName', { name: x.title })}
            onClick={() => rm.mutate([x.s.kind, x.s.refId, false])}
          >
            {t('items.remove')}
          </button>
        </li>
      ))}
    </ul>
  );
}
