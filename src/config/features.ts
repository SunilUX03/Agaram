/** Pending product decisions as switchable options (brief, section 13). */
export const features = {
  nav: { items: ['home', 'file', 'requests', 'community', 'people', 'learnLibrary'] as string[] },
  home: {
    quickActions: [
      'apply-leave',
      'start-request',
      'share-idea',
      'ask-question',
      'find-colleague',
      'open-file',
    ] as string[],
    heroImage: 'illustration' as 'illustration' | 'none',
  },
  features: { anonymousPosts: true, askSeniors: true },
  privacy: { sharePhoneDefault: false, shareEmailDefault: false },
  pages: { awards: true, experts: true, resources: true, knowledge: true },
  i18n: { defaultLocale: 'en', enabledLocales: ['en', 'ta'] as string[] },
  knowledge: { handoverNotesVisibility: 'successor-and-department' },
  uploads: { maxSizeMB: 10, accept: ['pdf', 'jpg', 'png'] as string[] },
  session: { idleMinutes: 20 },
  ideas: {
    statuses: ['submitted', 'under-review', 'accepted', 'not-taken-forward'] as string[],
  },
  requests: { uploadOnlyOption: true },
};

/** Route ids whose page is switched off by a `pages.*` flag. */
export const PAGE_FLAGS: Record<string, keyof typeof features.pages> = {
  'learn.awards': 'awards',
  'people.experts': 'experts',
  'learn.resources': 'resources',
  'community.knowledge': 'knowledge',
  'community.article': 'knowledge',
  'community.knowledge.new': 'knowledge',
};
