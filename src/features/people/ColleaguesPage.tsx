import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SearchField } from '@/components/SearchField';
import { UrlTabs, useUrlTab, type TabDef } from '@/components/UrlTabs';
import { useUrlState } from '@/components/useUrlState';
import { RouteHeader } from '@/app/usePage';
import { PeopleTab } from './PeopleTab';
import { SubjectTab } from './SubjectTab';

/** Your Colleagues: people and subjects in one page, one shared search box (v2, section 4.4). */
export default function ColleaguesPage() {
  const { t } = useTranslation('people');
  const [q, setQ] = useUrlState('q');
  const [, setParams] = useSearchParams();
  const box = useRef<HTMLInputElement>(null);
  const tabs: TabDef[] = [
    { id: 'people', label: t('tabs.people') },
    { id: 'subject', label: t('tabs.subject') },
  ];
  const [tab] = useUrlTab(tabs);
  /** Switch tab and keep the search text. */
  const go = (id: string) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      n.set('tab', id);
      return n;
    });
  return (
    <>
      <RouteHeader id="community.colleagues" main={{ onClick: () => box.current?.focus() }} />
      <SearchField
        ref={box}
        label={t(`tabs.search.${tab}`)}
        placeholder={t(`tabs.search.${tab}`)}
        value={q}
        onChange={setQ}
      />
      <div className="ux4g-mt-m">
        <UrlTabs tabs={tabs} label={t('tabs.label')} />
      </div>
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'subject' ? (
          <SubjectTab q={q} onSwitch={() => go('people')} />
        ) : (
          <PeopleTab q={q} onSwitch={() => go('subject')} />
        )}
      </div>
    </>
  );
}
