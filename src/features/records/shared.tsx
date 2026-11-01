import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { Icon } from '@/components/Icon';
import { ListRow } from '@/components/ListRow';
import { MenuButton } from '@/components/MenuButton';
import { StatusChip } from '@/components/StatusChip';
import { Tag } from '@/components/Tag';
import { getRequestType } from '@/config/requests';
import { SERVICE_CARDS, supportsPast } from '@/config/services';
import { formatDate } from '@/domain/dates';
import type { Request } from '@/domain/types';

export const useLocale = () => {
  const { i18n } = useTranslation();
  return i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
};

/** "Add a past record": a small chooser. LTC is recorded with its own button, so My Services leaves it out. */
export function PastChooser({ onClose, includeLtc }: { onClose: () => void; includeLtc: boolean }) {
  const { t } = useTranslation('records');
  const cards = SERVICE_CARDS.filter((c) => supportsPast(c) || (includeLtc && c.key === 'ltc'));
  return (
    <Dialog title={t('past.title')} onClose={onClose} variant="sheet">
      <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-mb-m">{t('past.intro')}</p>
      <ul className="ux4g-list ux4g-list-default ux4g-list-m">
        {cards.map((c) => (
          <li key={c.key} className="ux4g-list-item">
            <Link
              to={`/records/services/${c.key}/${c.key === 'ltc' ? 'new' : 'add-past'}`}
              className="ux4g-list-item-row more-link"
              onClick={onClose}
            >
              <Icon name={c.icon} /> {t(`past.${c.key}`, { defaultValue: c.title })}
            </Link>
          </li>
        ))}
      </ul>
    </Dialog>
  );
}

/** One item per service card (from `services.cards`), then the past-record chooser and Update my details. */
const newRequestOptions = (
  t: (k: string, o?: { defaultValue: string }) => string,
  openPast: () => void,
) => [
  ...SERVICE_CARDS.map((c) => ({
    label: t(`menu.${c.key}`, { defaultValue: c.main }),
    to: `/records/services/${c.key}/new`,
  })),
  { label: t('menu.past'), onClick: openPast },
  { label: t('menu.update'), to: '/records/profile' },
];

/** The "New request" menu button used on Records & Requests Home and on Home. */
export function NewRequestMenu({ primary = true }: { primary?: boolean }) {
  const { t } = useTranslation('records');
  const [past, setPast] = useState(false);
  const options = newRequestOptions(t, () => setPast(true));
  return (
    <>
      <MenuButton label={t('menu.new')} options={options} primary={primary} />
      {past && <PastChooser includeLtc onClose={() => setPast(false)} />}
    </>
  );
}

/** The floating "New request" button on phones and tablets. */
export function NewRequestFab() {
  const { t } = useTranslation('records');
  const [past, setPast] = useState(false);
  return (
    <>
      <MenuButton
        label={t('menu.new')}
        wrapperClass="fab-wrap"
        buttonClass="ux4g-radius-full"
        up
        options={newRequestOptions(t, () => setPast(true))}
      />
      {past && <PastChooser includeLtc onClose={() => setPast(false)} />}
    </>
  );
}

/** One request as a list row: type icon, plain title, sent date, status chip and the next-step line. */
export function RequestRow({ r, extra }: { r: Request; extra?: ReactNode }) {
  const { t } = useTranslation('records');
  const loc = useLocale();
  const type = getRequestType(r.type);
  const meta = [
    r.status === 'draft'
      ? undefined
      : t('request.sent', { date: formatDate(r.submittedAt ?? r.createdAt, loc) }),
    t(`nextStep.${r.status}`),
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <ListRow
      to={`/records/requests/${r.id}`}
      icon={<Icon name={type?.icon ?? 'file'} />}
      title={r.title}
      meta={meta}
      chip={
        <>
          {extra}
          {r.source === 'paper' && <Tag>{t('source.paper')}</Tag>}
          <StatusChip status={r.status} />
        </>
      }
    />
  );
}

/** Section heading with an optional link on the right. */
export function SectionHead({
  title,
  tagline,
  link,
  to,
  id,
}: {
  title: string;
  tagline?: string;
  link?: string;
  to?: string;
  id?: string;
}) {
  return (
    <div className="ux4g-d-flex ux4g-jc-between ux4g-ai-center gap-m ux4g-mb-s">
      <div>
        <h2 id={id} className="ux4g-heading-m-strong">
          {title}
        </h2>
        {tagline && <p className="ux4g-body-m-default ux4g-text-neutral-secondary">{tagline}</p>}
      </div>
      {link && to && (
        <Link to={to} className="ux4g-text-link-m">
          {link}
        </Link>
      )}
    </div>
  );
}
