import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PAGE_FLAGS, features } from '@/config/features';
import { REDIRECTS, ROUTES } from '@/config/routes';
import { DemoControls, useDemoMode } from './DemoControls';
import { NotFound } from './NotFound';

const RoutePlaceholder = lazy(() =>
  import('./RoutePlaceholder').then((m) => ({ default: m.RoutePlaceholder })),
);

export function App() {
  const { t } = useTranslation();
  const demo = useDemoMode();
  return (
    <>
      <a href="#main" className="skip-link">
        {t('app.skipToMain')}
      </a>
      <main id="main" className="wrap" style={{ paddingTop: 24, paddingBottom: 48 }}>
        <Suspense fallback={null}>
          <Routes>
            {REDIRECTS.map((r) => (
              <Route key={r.from} path={r.from} element={<Navigate to={r.to} replace />} />
            ))}
            {ROUTES.filter((r) => features.pages[PAGE_FLAGS[r.id]] !== false).map((r) => (
              <Route key={r.id} path={r.path} element={<RoutePlaceholder route={r} />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
      {demo && <DemoControls />}
    </>
  );
}
