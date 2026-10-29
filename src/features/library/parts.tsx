import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileViewer } from '@/components/FileViewer';
import { ToggleButton } from '@/components/ToggleButton';
import { useMut } from '@/data/hooks';
import { formatDate } from '@/domain/dates';
import type { LibraryItem } from '@/domain/types';

/** One library entry: number, date, subject, View, Download and an optional Save toggle. */
export function LibraryRow({ item, save }: { item: LibraryItem; save?: boolean }) {
  const { t, i18n } = useTranslation('library');
  const loc = i18n.language === 'ta' ? 'ta-IN' : 'en-IN';
  const [view, setView] = useState(false);
  const toggle = useMut('toggleSaved');
  return (
    <li className="lib-row">
      <div className="lib-main">
        <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
          {[item.number, formatDate(item.date, loc)].filter(Boolean).join(' · ')}
        </p>
        <h3>{item.title}</h3>
        {item.description && (
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary">{item.description}</p>
        )}
        {item.situation && (
          <p className="ux4g-body-s-default ux4g-text-neutral-secondary">
            {t('forms.use', { situation: item.situation })}
          </p>
        )}
      </div>
      <div className="lib-actions">
        {item.fileUrl && (
          <>
            <button
              type="button"
              className="ux4g-btn-outline-primary ux4g-btn-s"
              onClick={() => setView(true)}
            >
              {t('common.view')}
            </button>
            <a className="ux4g-btn-outline-primary ux4g-btn-s" href={item.fileUrl} download>
              {t('common.download')}
            </a>
          </>
        )}
        {save && (
          <ToggleButton
            label={t('common.save')}
            onLabel={t('common.saved')}
            icon="bookmark"
            pressed={!!item.savedByMe}
            onChange={(on) => toggle.mutateAsync(['library', item.id, on])}
          />
        )}
      </div>
      {view && item.fileUrl && (
        <FileViewer
          title={item.number ?? item.title}
          url={item.fileUrl}
          onClose={() => setView(false)}
        />
      )}
    </li>
  );
}
