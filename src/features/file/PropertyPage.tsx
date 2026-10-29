import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Abbr } from '@/components/Abbr';
import { Icon } from '@/components/Icon';
import { QueryView } from '@/components/QueryView';
import { Tag } from '@/components/Tag';
import { UrlTabs, useUrlTab } from '@/components/UrlTabs';
import { RouteHeader, usePageText } from '@/app/usePage';
import { useQ } from '@/data/hooks';
import { formatINR } from '@/domain/dates';

const KINDS = ['immovable', 'movable', 'intimation'] as const;

export default function PropertyPage() {
  const { t, i18n } = useTranslation('file');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const tabs = KINDS.map((k) => ({ id: k, label: t(`property.tabs.${k}`) }));
  const [tab] = useUrlTab(tabs);
  const q = useQ('properties');
  const p = usePageText('file.property');
  return (
    <>
      <RouteHeader
        id="file.property"
        tagline={
          <span className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-s">
            <Icon name="lock" size={16} label={t('property.private')} />
            {p.tagline}
          </span>
        }
        main={{ to: '/requests/new/immovable' }}
        secondary={
          <Link to="/requests/new/intimation" className="ux4g-btn-outline-primary ux4g-btn-m">
            {t('property.secondary')}
          </Link>
        }
      />
      <p className="callout">
        <Icon name="info" />
        <span>
          <Abbr k="IPR">IPR</Abbr> {t('property.iprHelp')}
        </span>
      </p>
      <UrlTabs tabs={tabs} />
      <div id="tabpanel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        <QueryView query={q} skeleton="card" skeletonCount={2}>
          {(rows) => {
            const shown = rows.filter((r) => r.kind === tab);
            if (!shown.length)
              return <p className="ux4g-text-neutral-secondary">{t('property.empty')}</p>;
            return (
              <div className="grid-cards">
                {shown.map((r) => (
                  <div
                    key={r.id}
                    className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad"
                  >
                    <h3 className="ux4g-heading-xs-strong">{r.type}</h3>
                    <p>{r.details}</p>
                    <dl className="kv ux4g-mt-s">
                      <div className="kv-item">
                        <dt>{t('property.fund')}</dt>
                        <dd>{r.funding}</dd>
                      </div>
                      <div className="kv-item">
                        <dt>{t('property.cost')}</dt>
                        <dd>{formatINR(r.cost, loc)}</dd>
                      </div>
                      <div className="kv-item">
                        <dt>{t('property.ipr')}</dt>
                        <dd>{r.shownInReturn ? t('property.yes') : t('property.no')}</dd>
                      </div>
                      <div className="kv-item">
                        <dt>{t('property.selfFamily')}</dt>
                        <dd>
                          <Tag>{r.selfOrFamily}</Tag>
                        </dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            );
          }}
        </QueryView>
      </div>
    </>
  );
}
