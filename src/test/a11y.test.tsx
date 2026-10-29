import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import '@/i18n';
import { setViewport } from './setup';
import { App } from '@/app/App';

async function serious(container: HTMLElement) {
  const r = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } }); // jsdom has no layout; contrast is checked in the browser audit
  return r.violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => `${v.id}: ${v.nodes[0].html}`);
}

describe.each([360, 1280])('accessibility at %i px', (width) => {
  it.each(['/home', '/dev/components', '/nope'])('%s has no serious issues', async (path) => {
    setViewport(width);
    sessionStorage.setItem('demo', '1');
    const { container, findByRole } = render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    await findByRole('heading', { level: 1 });
    expect(await serious(container)).toEqual([]);
  });
});
