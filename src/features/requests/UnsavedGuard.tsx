import { useContext, useEffect } from 'react';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';

/** Asks before leaving a form with unsaved changes. Never asks on a form with no changes. */
/** Set `bypass.current = true` just before navigating away on purpose (after Send or Post). */
export function UnsavedGuard({ dirty, bypass }: { dirty: boolean; bypass?: { current: boolean } }) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  const hasDataRouter = !!useContext(UNSAFE_DataRouterContext);
  return hasDataRouter ? <Inner dirty={dirty} bypass={bypass} /> : null;
}

function Inner({ dirty, bypass }: { dirty: boolean; bypass?: { current: boolean } }) {
  const { t } = useTranslation('requests');
  const blocker = useBlocker(() => dirty && !bypass?.current);
  if (blocker.state !== 'blocked') return null;
  return (
    <ConfirmDialog
      title={t('form.leave')}
      body={t('form.leaveBody')}
      confirmLabel={t('form.leaveBtn')}
      cancelLabel={t('form.stay')}
      onConfirm={() => blocker.proceed()}
      onCancel={() => blocker.reset()}
    />
  );
}
