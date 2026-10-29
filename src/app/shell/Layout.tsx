import { Suspense, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/Skeleton';
import { ToastProvider } from '@/components/Toast';
import { useIsDesktop } from '@/components/hooks';
import { AccessibilityBar } from './AccessibilityBar';
import { BottomBar } from './BottomBar';
import { ErrorBoundary } from './ErrorBoundary';
import { Footer } from './Footer';
import { OfflineBanner } from './OfflineBanner';
import { SectionTabs } from './SectionTabs';
import { TopBar } from './TopBar';

/** App shell. /login renders bare, without the bars. */
export function Layout({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const desktop = useIsDesktop();
  const bare = pathname === '/login';
  return (
    <ToastProvider>
      <AccessibilityBar />
      {!bare && <TopBar desktop={desktop} />}
      {!bare && !desktop && <SectionTabs />}
      <OfflineBanner />
      <main id="main" className="ux4g-container main" tabIndex={-1}>
        <ErrorBoundary>
          <Suspense fallback={<Skeleton variant="header" />}>{children}</Suspense>
        </ErrorBoundary>
      </main>
      {!bare && <Footer />}
      {!bare && !desktop && <BottomBar />}
    </ToastProvider>
  );
}
