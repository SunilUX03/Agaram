import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import '@/i18n';
import { setViewport } from './setup';
import { StatusChip } from '@/components/StatusChip';
import { FormStepper } from '@/components/FormStepper';
import { ResponsiveTable } from '@/components/ResponsiveTable';
import { UrlTabs } from '@/components/UrlTabs';
import { ToggleButton } from '@/components/ToggleButton';
import { Timeline } from '@/components/Timeline';
import { FileViewer } from '@/components/FileViewer';
import { REQUEST_STATUSES } from '@/domain/status';
import { sanitizeHtml } from '@/domain/sanitize';
import { formatINR, formatTime, parseDMY, rangesOverlap } from '@/domain/dates';

const wrap = (ui: React.ReactNode, at = '/') => (
  <MemoryRouter initialEntries={[at]}>{ui}</MemoryRouter>
);

describe('StatusChip', () => {
  it.each([
    ['draft', 'Draft'],
    ['submitted', 'Submitted'],
    ['with-desk', 'With the desk'],
    ['ready-for-approval', 'Ready for approval'],
    ['returned', 'Returned to you'],
    ['approved', 'Approved'],
    ['rejected', 'Not approved'],
    ['withdrawn', 'Withdrawn'],
  ])('%s shows the words "%s"', (status, words) => {
    render(<StatusChip status={status} />);
    expect(screen.getByText(words)).toBeInTheDocument();
  });
  it('covers every request status', () => expect(REQUEST_STATUSES).toHaveLength(8));
});

describe('FormStepper', () => {
  const steps = (valid: { current: boolean }) => [
    { id: 'a', title: 'First', content: <p>one</p> },
    {
      id: 'b',
      title: 'Second',
      validate: () => (valid.current ? [] : ['Remarks: This field is required.']),
      content: <p>two</p>,
    },
    { id: 'c', title: 'Review', content: <p>three</p> },
  ];
  it('blocks Next on an invalid step, shows a summary, then continues', async () => {
    const valid = { current: false };
    const onAutosave = vi.fn();
    render(<FormStepper steps={steps(valid)} onSend={vi.fn()} onAutosave={onAutosave} />);
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This field is required.');
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    valid.current = true;
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(onAutosave).toHaveBeenCalledTimes(2);
  });
  it('keeps entries on Back and disables Send after the first press', async () => {
    let resolve: () => void = () => {};
    const onSend = vi.fn(() => new Promise<void>((r) => (resolve = r)));
    render(<FormStepper steps={steps({ current: true })} onSend={onSend} initialStep={2} />);
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByRole('button', { name: 'Sending' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Sending' }));
    expect(onSend).toHaveBeenCalledTimes(1);
    act(() => resolve());
  });
});

describe('ResponsiveTable', () => {
  const rows = [
    { id: '1', type: 'Casual leave', days: 3 },
    { id: '2', type: 'Earned leave', days: 1 },
  ];
  const cols = [
    { key: 'type', header: 'Leave type' },
    { key: 'days', header: 'Days', sortValue: (r: (typeof rows)[0]) => r.days },
  ];
  it('is a real table on desktop and sorts', async () => {
    setViewport(1280);
    render(
      wrap(
        <ResponsiveTable caption="Leave history" columns={cols} rows={rows} rowKey={(r) => r.id} />,
      ),
    );
    expect(screen.getByRole('table', { name: 'Leave history' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Sort by Days' }));
    expect(within(screen.getAllByRole('row')[1]).getByText('Earned leave')).toBeInTheDocument();
  });
  it('becomes stacked cards below 640 px', () => {
    setViewport(360);
    render(
      wrap(
        <ResponsiveTable caption="Leave history" columns={cols} rows={rows} rowKey={(r) => r.id} />,
      ),
    );
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.getByRole('list', { name: 'Leave history' })).toBeInTheDocument();
    setViewport(1280);
  });
});

describe('UrlTabs', () => {
  const Probe = () => <span data-testid="loc">{useLocation().search}</span>;
  it('stores the active tab in the URL and supports arrow keys', async () => {
    const tabs = [
      { id: 'a', label: 'Balance' },
      { id: 'b', label: 'History' },
    ];
    render(
      wrap(
        <>
          <UrlTabs tabs={tabs} />
          <Probe />
        </>,
        '/?tab=b',
      ),
    );
    expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
    screen.getByRole('tab', { name: 'History' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() =>
      expect(screen.getByRole('tab', { name: 'Balance' })).toHaveAttribute('aria-selected', 'true'),
    );
    expect(screen.getByTestId('loc')).toHaveTextContent('');
  });
});

describe('ToggleButton', () => {
  it('updates the state and count at once', async () => {
    render(
      <ToggleButton
        label="Back this idea"
        onLabel="Backed"
        pressed={false}
        count={12}
        onChange={() => new Promise(() => {})}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Back this idea/ }));
    const b = screen.getByRole('button', { name: /Backed/ });
    expect(b).toHaveAttribute('aria-pressed', 'true');
    expect(b).toHaveTextContent('13');
  });
});

describe('Timeline and FileViewer', () => {
  it('marks the current step', () => {
    render(
      <Timeline
        steps={[
          { id: '1', title: 'Sent' },
          { id: '2', title: 'With desk', current: true },
        ]}
      />,
    );
    expect(screen.getByText('With desk').closest('[role=listitem]')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });
  it('offers Download and Close, and closes on Escape', async () => {
    const onClose = vi.fn();
    render(<FileViewer title="G.O. 1" onClose={onClose} />);
    expect(screen.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      expect.stringContaining('sample.pdf'),
    );
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });
});

describe('domain helpers', () => {
  it('parses dd/mm/yyyy strictly', () => {
    expect(parseDMY('12/11/2026')).not.toBeNull();
    expect(parseDMY('31/02/2026')).toBeNull();
    expect(parseDMY('2026-11-12')).toBeNull();
  });
  it('detects overlapping ranges', () => {
    const d = (s: string) => parseDMY(s)!;
    expect(rangesOverlap(d('1/1/2026'), d('5/1/2026'), d('5/1/2026'), d('9/1/2026'))).toBe(true);
    expect(rangesOverlap(d('1/1/2026'), d('4/1/2026'), d('5/1/2026'), d('9/1/2026'))).toBe(false);
  });
  it('formats rupees with Indian grouping and time in 12-hour form', () => {
    expect(formatINR(1250000)).toBe('₹12,50,000');
    expect(formatTime('2026-11-12T09:35:00Z')).toBe('3:05 PM');
  });
  it('sanitises rich text', () => {
    const out = sanitizeHtml(
      '<p onclick="x()">Hi <script>alert(1)</script><a href="javascript:x">l</a><img src=x></p>',
    );
    expect(out).not.toMatch(/script|onclick|javascript|img/);
  });
});
