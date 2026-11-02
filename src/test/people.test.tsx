import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildSeed } from '@/data/seed';
import { getDirectReports, getReportingLine } from '@/domain/people';
import { renderApp } from './utils';

const db = buildSeed();
const cols = db.colleagues;

describe('reporting structure data', () => {
  it('has exactly one top post per department and no cycles', () => {
    db.departments.forEach((d) => {
      expect(d.posts.filter((p) => !p.reportsToPostId)).toHaveLength(1);
      d.posts.forEach((p) => {
        const seen = new Set<string>();
        let up = p.reportsToPostId;
        while (up) {
          expect(seen.has(up)).toBe(false);
          seen.add(up);
          up = d.posts.find((x) => x.id === up)!.reportsToPostId;
        }
      });
    });
    cols.forEach((c) =>
      expect(getReportingLine(cols, c.id, 99).every((b) => b.id !== c.id)).toBe(true),
    );
  });
  it('keeps every colleague consistent with the post they hold', () => {
    expect(cols).toHaveLength(60);
    cols.forEach((c) => {
      const d = db.departments.find((x) => x.posts.some((p) => p.id === c.postId))!;
      const post = d.posts.find((p) => p.id === c.postId)!;
      expect(post.officerId).toBe(c.id);
      expect(c.designation).toBe(post.title);
      if (c.reportsToId) {
        const boss = cols.find((x) => x.id === c.reportsToId)!;
        expect(db.departments.find((x) => x.posts.some((p) => p.id === boss.postId))).toBe(d);
      } else expect(post.reportsToPostId).toBeUndefined();
      expect(c.qualifications.length).toBeGreaterThanOrEqual(1);
      expect(c.qualifications.length).toBeLessThanOrEqual(3);
      expect(c.officePhone).toMatch(/^\+91 44 0000 11\d\d$/);
    });
  });
  it('includes the awkward cases on purpose', () => {
    expect(cols.some((c) => !c.reportsToId)).toBe(true);
    expect(cols.some((c) => getDirectReports(cols, c.id).length >= 8)).toBe(true);
    expect(cols.some((c) => c.previousPostings.length === 0)).toBe(true);
    expect(cols.some((c) => c.languages.length === 0)).toBe(true);
    expect(cols.some((c) => c.statusNote === 'On leave')).toBe(true);
    expect(cols.some((c) => !c.photoUrl)).toBe(true);
  });
  it('derives the reporting line upward, at most four levels', () => {
    const deep = cols.find((c) => getReportingLine(cols, c.id).length >= 3)!;
    const line = getReportingLine(cols, deep.id);
    expect(line.length).toBeLessThanOrEqual(4);
    expect(line[0].id).toBe(deep.reportsToId);
    expect(getDirectReports(cols, line[0].id).map((c) => c.id)).toContain(deep.id);
  });
});

describe('colleague profile', () => {
  it('shows the real information and the reporting structure, with no dashes or private data', async () => {
    renderApp('/community/colleagues/col-4');
    const c = cols.find((x) => x.id === 'col-4')!;
    expect(await screen.findByRole('heading', { level: 1, name: c.name })).toBeInTheDocument();
    // The name appears once as text on the page (the breadcrumb is hidden on phones but present).
    expect(screen.getAllByText(c.name).length).toBeLessThanOrEqual(2);
    ['Reporting structure', 'Contact', 'About', 'Current posting', 'Previous postings'].forEach(
      (h) => expect(screen.getByRole('heading', { name: h })).toBeInTheDocument(),
    );
    expect(screen.getByText('Personal numbers are not shown.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Email' })).toHaveAttribute(
      'href',
      `mailto:${c.officialEmail}`,
    );
    expect(await screen.findByRole('link', { name: 'See in By subject' })).toHaveAttribute(
      'href',
      expect.stringContaining('/community/colleagues/subject/'),
    );
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/\s[—–-]\s*$/m);
    ['Date of birth', 'Religion', 'Caste', '+91 90000'].forEach((x) =>
      expect(text).not.toContain(x),
    );
  });
  it('hides cards and rows that have no data, and the manager block at the top', async () => {
    const none = cols.find((c) => c.previousPostings.length === 0)!;
    const first = renderApp(`/community/colleagues/${none.id}`);
    await screen.findByRole('heading', { level: 1, name: none.name });
    expect(screen.queryByRole('heading', { name: 'Previous postings' })).toBeNull();
    first.unmount();
    const noLang = cols.find((c) => c.languages.length === 0)!;
    renderApp(`/community/colleagues/${noLang.id}`);
    await screen.findByRole('heading', { level: 1, name: noLang.name });
    expect(screen.queryByText('Languages known')).toBeNull();
  });
  it('shows the head of department as reporting to nobody, and opens the full list of direct reports', async () => {
    const boss = cols.find((c) => getDirectReports(cols, c.id).length >= 8)!;
    const first = renderApp(`/community/colleagues/${boss.id}`);
    await screen.findByRole('heading', { level: 1, name: boss.name });
    await userEvent.click(await screen.findByRole('button', { name: /^See all \d+/ }));
    const panel = await screen.findByRole('dialog');
    await waitFor(() =>
      expect(within(panel).getAllByRole('link').length).toBe(
        getDirectReports(cols, boss.id).length,
      ),
    );
    first.unmount();
    const top = cols.find((c) => !c.reportsToId)!;
    renderApp(`/community/colleagues/${top.id}`);
    await screen.findByRole('heading', { level: 1, name: top.name });
    expect(screen.getByText('Reports to: none (head of department)')).toBeInTheDocument();
  });
});

describe('section page', () => {
  it('shows the officer card, who it reports to, and its team', async () => {
    const d = db.departments[0];
    const post = d.posts.find(
      (p) => d.posts.some((x) => x.reportsToPostId === p.id) && p.reportsToPostId,
    )!;
    renderApp(`/community/colleagues/subject/${d.id}/${post.id}`);
    await screen.findByRole('heading', { level: 1, name: post.title });
    expect(await screen.findByRole('link', { name: "Open officer's profile" })).toBeInTheDocument();
    const above = d.posts.find((p) => p.id === post.reportsToPostId)!;
    expect(
      screen.getByRole('link', { name: `${above.title}: ${above.officerName}` }),
    ).toHaveAttribute('href', `/community/colleagues/subject/${d.id}/${above.id}`);
    expect(screen.getByText('Team')).toBeInTheDocument();
  });
  it('says so when nobody holds the post', async () => {
    renderApp('/community/colleagues/subject/dep-3/post-3-4');
    expect(
      await screen.findByText('The department has not recorded who holds this post.'),
    ).toBeInTheDocument();
  });
});
