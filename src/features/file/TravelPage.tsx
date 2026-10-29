import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon';
import { MenuButton } from '@/components/MenuButton';
import { QueryView } from '@/components/QueryView';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { RouteHeader, usePageText } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { TravelRecord } from '@/domain/types';
import { OrderLink } from './Order';

const KINDS: TravelRecord['kind'][] = ['foreign', 'tour', 'private'];
const TYPE = { foreign: 'foreign-visit', tour: 'tour', private: 'private-visit' };

export default function TravelPage() {
  const { t, i18n } = useTranslation('file');
  const p = usePageText('file.travel');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const tabs = KINDS.map((k) => ({ id: k, label: t(`travel.tabs.${k}`) }));
  const [tab] = useUrlTab(tabs);
  const q = useQ('travels');
  return (
    <>
      <RouteHeader
        id="file.travel"
        main={
          <MenuButton
            label={p.main}
            options={KINDS.map((k) => ({
              label: t(`travel.apply.${k}`),
              to: `/requests/new/${TYPE[k]}`,
            }))}
          />
        }
      />
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="row">
          {(rows) => {
            const shown = rows
              .filter((r) => r.kind === tab)
              .sort((a, b) => b.from.localeCompare(a.from));
            if (!shown.length)
              return <p className="ux4g-text-neutral-secondary">{t('travel.empty')}</p>;
            return (
              <ul className="plain-list">
                {shown.map((r) => (
                  <li key={r.id} className="list-row">
                    <span className="list-row-icon">
                      <Icon name="plane" />
                    </span>
                    <span className="list-row-main">
                      <span className="ux4g-body-m-strong">{r.place}</span>
                      <span className="ux4g-body-s-default ux4g-text-neutral-secondary">
                        {formatDate(r.from, loc)} – {formatDate(r.to, loc)}
                        {r.purpose ? ` · ${r.purpose}` : ''}
                      </span>
                      {r.kind === 'foreign' && (
                        <span className="checks" style={{ marginTop: 6 }}>
                          {r.politicalClearance && (
                            <Tag>
                              <Icon name="check" size={12} /> {t('travel.political')}
                            </Tag>
                          )}
                          {r.fcraClearance && (
                            <Tag>
                              <Icon name="check" size={12} /> {t('travel.fcra')}
                            </Tag>
                          )}
                        </span>
                      )}
                    </span>
                    <StatusChip status={r.status} />
                    <OrderLink orderId={r.orderId} />
                  </li>
                ))}
              </ul>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
