import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@/components/Icon';
import { RouteHeader } from '@/app/usePage';
import { SERVICE_CARDS, supportsPast, type ServiceCardDef } from '@/config/services';
import { useQ } from '@/data/hooks';
import { PastChooser } from './shared';

function ServiceTile({ card }: { card: ServiceCardDef }) {
  const { t } = useTranslation('records');
  const rows = useQ(card.data);
  const bal = useQ('leaveBalance');
  const summary =
    rows.data && (card.key !== 'leave' || bal.data)
      ? card.summary(rows.data as unknown[], {
          balance: bal.data,
          year: new Date().getFullYear(),
        })
      : null;
  return (
    <article className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad service-tile">
      <div className="ux4g-d-flex ux4g-ai-center gap-s ux4g-mb-xs">
        <span className="tile-icon" aria-hidden="true">
          <Icon name={card.icon} size={28} />
        </span>
        <h2 className="ux4g-heading-s-strong">{card.title}</h2>
      </div>
      <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-mb-m">
        {summary ?? <span className="skel skel-text" aria-hidden="true" />}
      </p>
      <div className="ux4g-d-flex ux4g-flex-wrap ux4g-ai-center gap-m card-foot">
        <Link to={`/records/services/${card.key}/new`} className="ux4g-btn-primary ux4g-btn-m">
          {card.main}
        </Link>
        <Link to={`/records/services/${card.key}`} className="ux4g-text-link-m">
          {t('services.history')}
          <span className="sr-only"> {card.title}</span>
        </Link>
      </div>
    </article>
  );
}

/** My Services. The cards come from `services.cards`; adding one needs only a config entry. */
export default function ServicesPage() {
  const { t } = useTranslation('records');
  const [past, setPast] = useState(false);
  const any = SERVICE_CARDS.some(supportsPast);
  return (
    <>
      <RouteHeader id="records.services" main={{ to: '/records/services/leave/new' }} />
      <div className="services-grid">
        {SERVICE_CARDS.map((c) => (
          <ServiceTile key={c.key} card={c} />
        ))}
      </div>
      {any && (
        <p className="ux4g-mt-l">
          <button
            type="button"
            className="ux4g-text-link-m link-label"
            onClick={() => setPast(true)}
          >
            {t('services.addPast')}
          </button>
        </p>
      )}
      {past && <PastChooser includeLtc={false} onClose={() => setPast(false)} />}
    </>
  );
}
