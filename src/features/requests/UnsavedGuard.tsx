import { useContext, useEffect } from 'react';
import { UNSAFE_DataRouterContext, useBlocker } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ConfirmDialog } from '@/components/ConfirmDialog';

/** Asks before leaving a form with unsaved changes. Never asks on a form with no changes. */
export function UnsavedGuard({ dirty }: { dirty: boolean }) {
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
  const hasDataRouter = !!useContext(UNSAFE_DataRouterContext);
  return hasDataRouter ? <Inner dirty={dirty} /> : null;
}

function Inner({ dirty }: { dirty: boolean }) {
  const { t } = useTranslation('requests');
  const blocker = useBlocker(dirty);
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
