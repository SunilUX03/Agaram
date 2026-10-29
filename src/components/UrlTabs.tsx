import { useEffect, useRef, type KeyboardEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface TabDef {
  id: string;
  label: string;
  count?: number;
}

/** Active tab id stored in the URL query so Back and shared links work. */
export function useUrlTab(tabs: TabDef[], param = 'tab') {
  const [params, setParams] = useSearchParams();
  const raw = params.get(param);
  const active = tabs.find((t) => t.id === raw)?.id ?? tabs[0].id;
  const setActive = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === tabs[0].id) next.delete(param);
    else next.set(param, id);
    setParams(next, { replace: false });
  };
  return [active, setActive] as const;
}

/** UX4G underline tabs with arrow-key navigation. On phones the row scrolls sideways with the active tab in view. */
export function UrlTabs({
  tabs,
  param = 'tab',
  label,
}: {
  tabs: TabDef[];
  param?: string;
  label?: string;
}) {
  const { t } = useTranslation();
  const [active, setActive] = useUrlTab(tabs, param);
  const list = useRef<HTMLUListElement>(null);

  useEffect(() => {
    list.current
      ?.querySelector<HTMLElement>('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
  }, [active]);

  const onKey = (e: KeyboardEvent) => {
    const i = tabs.findIndex((x) => x.id === active);
    const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const next = tabs[(to + tabs.length) % tabs.length];
    setActive(next.id);
    requestAnimationFrame(() =>
      list.current?.querySelector<HTMLElement>(`[data-tab="${next.id}"]`)?.focus(),
    );
  };

  return (
    <div className="ux4g-tab ux4g-tab-underline ux4g-tab-m tabs-scroll ux4g-mb-l">
      <ul
        className="ux4g-tab-list"
        role="tablist"
        aria-label={label ?? t('ui.tabs')}
        ref={list}
        onKeyDown={onKey}
      >
        {tabs.map((tab) => (
          <li key={tab.id} role="presentation" className="tab-li">
            <button
              type="button"
              role="tab"
              data-tab={tab.id}
              id={`tab-${tab.id}`}
              className={`ux4g-tab-item${tab.id === active ? ' is-active active' : ''}`}
              aria-selected={tab.id === active}
              aria-controls="tabpanel"
              tabIndex={tab.id === active ? 0 : -1}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ux4g-tag-tonal-neutral ux4g-tag-s ux4g-ml-xs">{tab.count}</span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
