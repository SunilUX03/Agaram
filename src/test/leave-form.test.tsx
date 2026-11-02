import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { daysLeft } from '@/domain/requests';
import { renderApp } from './utils';

const balance = {
  cl: { allowed: 20, used: 8 },
  rh: { allowed: 3, used: 1 },
  el: { allowed: 300, used: 180 },
  hpl: { allowed: 120, used: 30 },
};

describe('days left beside each leave type', () => {
  it('maps the types that have a balance, and no others', () => {
    expect(daysLeft('Casual leave', balance)).toBe(12);
    expect(daysLeft('Restricted holiday', balance)).toBe(2);
    expect(daysLeft('Earned leave', balance)).toBe(120);
    expect(daysLeft('Half-pay leave', balance)).toBe(90);
    expect(daysLeft('Half-pay leave (with medical certificate)', balance)).toBe(90);
    expect(daysLeft('Maternity leave', balance)).toBeUndefined();
    expect(daysLeft('Casual leave', undefined)).toBeUndefined();
  });

  it.each(['/records/services/leave/new', '/records/services/leave/add-past'])(
    'shows the numbers in the selector and the helper line on %s',
    async (path) => {
      renderApp(path);
      const btn = await screen.findByRole('button', { name: /Leave type/ });
      // wait for the balance to arrive
      await waitFor(
        async () => {
          await userEvent.click(btn);
          expect(screen.getByRole('option', { name: /Casual leave \(CL\)/ })).toHaveTextContent(
            '12 left',
          );
        },
        { timeout: 4000 },
      );
      const list = screen.getByRole('listbox', { name: /Leave type/ });
      const opt = (name: RegExp) => within(list).getByRole('option', { name });
      expect(opt(/Restricted holiday \(RH\)/)).toHaveTextContent('2 left');
      expect(opt(/Earned leave \(EL\)/)).toHaveTextContent('120 left');
      expect(opt(/^Half-pay leave90 left$/)).toBeInTheDocument();
      expect(opt(/Half-pay leave \(with medical certificate\)/)).toHaveTextContent('90 left');
      expect(opt(/Maternity leave/)).not.toHaveTextContent(/\d/);
      await userEvent.click(opt(/Casual leave \(CL\)/));
      expect(await screen.findByText('You have 12 days of Casual leave left.')).toBeInTheDocument();
    },
  );
});
