import { Component, type ReactNode } from 'react';
import { withTranslation, type WithTranslation } from 'react-i18next';
import { ErrorState } from '@/components/EmptyState';

class Boundary extends Component<WithTranslation & { children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <ErrorState onRetry={() => this.setState({ failed: false })} />
    ) : (
      this.props.children
    );
  }
}
export const ErrorBoundary = withTranslation()(Boundary);
