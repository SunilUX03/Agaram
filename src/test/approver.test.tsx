import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { api } from '@/data/api';
import { resetDb } from '@/data/store';
import { renderApp } from './utils';

describe('the approver is the Under Secretary', () => {
  it('names the Under Secretary in the banner and the timeline', async () => {
    renderApp('/records/requests/req-4');
    expect(
      await screen.findByText(/The Under Secretary returned this request\. Reason:/),
    ).toBeInTheDocument();
    expect(screen.getByText('Under review by the Under Secretary')).toBeInTheDocument();
  });
  it('names the Under Secretary on the past-record form', async () => {
    renderApp('/records/services/leave/add-past');
    expect(
      await screen.findByText(
        /such as leave taken on paper\. The Under Secretary will check it before it appears in your record\./,
      ),
    ).toBeInTheDocument();
  });
  it('records the Under Secretary as the person who decided', async () => {
    resetDb();
    const r = await api.createSampleReturned();
    expect(r.timeline.at(-1)?.role).toBe('Under Secretary');
  });
});
