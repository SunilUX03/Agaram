import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog } from '@/components/Dialog';
import { features } from '@/config/features';
import { session } from '@/data/store';

/** Routes needing sign-in redirect to /login and return afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const loc = useLocation();
  if (!session.active)
    return <Navigate to="/login" replace state={{ from: loc.pathname + loc.search }} />;
  return (
    <>
      {children}
      <IdleGuard />
    </>
  );
}

/** After 20 minutes with no activity: a dialog with a 60 second countdown, then sign out. */
function IdleGuard() {
  const { t } = useTranslation('auth');
  const nav = useNavigate();
  const qc = useQueryClient();
  const [left, setLeft] = useState<number | null>(null);
  const timer = useRef<number>();
  const arm = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setLeft(60), features.session.idleMinutes * 60 * 1000);
  };
  useEffect(() => {
    arm();
    const on = () => left === null && arm();
    const evs = ['pointerdown', 'keydown', 'scroll'] as const;
    evs.forEach((e) => window.addEventListener(e, on, { passive: true }));
    return () => {
      window.clearTimeout(timer.current);
      evs.forEach((e) => window.removeEventListener(e, on));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === null]);
  const out = () => {
    session.end();
    qc.clear();
    nav('/login', { replace: true });
  };
  useEffect(() => {
    if (left === null) return;
    if (left <= 0) return out();
    const id = window.setTimeout(() => setLeft(left - 1), 1000);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);
  if (left === null) return null;
  return (
    <Dialog
      title={t('session.title')}
      role="alertdialog"
      onClose={() => (setLeft(null), arm())}
      footer={
        <>
          <button type="button" className="btn" onClick={out}>
            {t('session.signOut')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => (setLeft(null), arm())}>
            {t('session.stay')}
          </button>
        </>
      }
    >
      <p aria-live="polite">{t('session.body', { seconds: left })}</p>
    </Dialog>
  );
}
