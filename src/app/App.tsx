import { lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PAGE_FLAGS, features } from '@/config/features';
import { REDIRECTS, ROUTES } from '@/config/routes';
import { DemoControls, useDemoMode } from './DemoControls';
import { NotFound } from './NotFound';
import { PAGES } from './pages';
import { RequireAuth } from './auth';
import { Layout } from './shell/Layout';

const RoutePlaceholder = lazy(() =>
  import('./RoutePlaceholder').then((m) => ({ default: m.RoutePlaceholder })),
);
const Gallery = lazy(() => import('@/dev/ComponentGallery'));

export function App() {
  const demo = useDemoMode();
  return (
    <Layout>
      <Routes>
        {REDIRECTS.map((r) => (
          <Route key={r.from} path={r.from} element={<Navigate to={r.to} replace />} />
        ))}
        {ROUTES.filter((r) => features.pages[PAGE_FLAGS[r.id]] !== false).map((r) => {
          const Page = PAGES[r.id];
          const el = Page ? <Page /> : <RoutePlaceholder route={r} />;
          return (
            <Route
              key={r.id}
              path={r.path}
              element={r.id === 'login' ? el : <RequireAuth>{el}</RequireAuth>}
            />
          );
        })}
        {demo && <Route path="/dev/components" element={<Gallery />} />}
        <Route path="*" element={<NotFound />} />
      </Routes>
      {demo && <DemoControls />}
    </Layout>
  );
}
