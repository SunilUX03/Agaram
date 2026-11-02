import type { Colleague, Department, OrgPost } from './types';

/** The officers above this one, nearest first, up to `max` levels. A guard stops any loop. */
export function getReportingLine(all: Colleague[], id: string, max = 4): Colleague[] {
  const byId = new Map(all.map((c) => [c.id, c]));
  const line: Colleague[] = [];
  const seen = new Set([id]);
  let next = byId.get(id)?.reportsToId;
  while (next && !seen.has(next) && line.length < max) {
    const boss = byId.get(next);
    if (!boss) break;
    line.push(boss);
    seen.add(next);
    next = boss.reportsToId;
  }
  return line;
}

/** The officers who report to this one, in post order. */
export function getDirectReports(all: Colleague[], id: string): Colleague[] {
  return all.filter((c) => c.reportsToId === id);
}

/** The post an officer holds, with its department. */
export function postOf(
  departments: Department[],
  c: Colleague,
): { dept: Department; post: OrgPost } | undefined {
  for (const dept of departments) {
    const post = dept.posts.find((p) => p.id === c.postId);
    if (post) return { dept, post };
  }
  return undefined;
}

/** The posts that report to this one. */
export const teamOf = (dept: Department, post: OrgPost) =>
  dept.posts.filter((p) => p.reportsToPostId === post.id);
