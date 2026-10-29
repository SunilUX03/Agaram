import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, createHashRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'ux4g-web-components/styles.css';
import './i18n';
import './styles/app.css';
import { App } from './app/App';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false, staleTime: 15_000 } },
});
// A data router lets forms warn before leaving with unsaved changes.
const routes = [{ path: '*', element: <App /> }];
// The static build uses hash URLs so it works from any folder or file host.
const router =
  import.meta.env.VITE_ROUTER === 'hash'
    ? createHashRouter(routes)
    : createBrowserRouter(routes, {
        basename: import.meta.env.BASE_URL.replace(/\/$/, '') || undefined,
      });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
