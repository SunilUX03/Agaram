/** Pending product decisions as switchable options (v2, section 9). Nothing here is hard-coded in a component. */
export const features = {
  /** Who approves every request. The title is read from here everywhere; the internal role id stays "approver". */
  approver: { role: 'approver', title: 'Under Secretary' },
  nav: {
    /** A visible "Home" link next to the two sections. The logo and the mobile Home tab always open Home. */
    showHomeLink: false,
  },
  home: {
    /** Order, visibility and titles of the Home sections. Home is provisional, so rearranging is a config change. */
    sections: [
      { key: 'search', enabled: true },
      { key: 'waiting', enabled: true },
      { key: 'quick', enabled: true },
      { key: 'glance', enabled: true },
      { key: 'requests', enabled: true },
      { key: 'downloads', enabled: true },
      { key: 'community', enabled: true },
    ] as { key: string; enabled: boolean }[],
    quickActions: [
      'apply-leave',
      'record-ltc',
      'new-medical',
      'submit-proposal',
      'start-discussion',
      'find-colleague',
    ] as string[],
    heroImage: 'illustration' as 'illustration' | 'none',
  },
  services: {
    /** Which cards offer "Add a past ...". LTC records past trips with its normal form. */
    pastRecords: { leave: true, medical: true, gpf: true, ltc: false } as Record<string, boolean>,
  },
  profile: {
    /** Which profile fields are locked and which are editable. The product owner may move a field. */
    fieldAccess: {
      locked: [
        'photo',
        'name',
        'identityNo',
        'serviceStatus',
        'allotmentYear',
        'batch',
        'cadreAndDomicile',
        'recruitmentType',
        'dateOfJoining',
        'dateOfRetirement',
        'classPayScale',
        'grade',
        'seniorityNumber',
        'lastPromotionDate',
        'ifhrmsId',
        'gender',
        'dateOfBirth',
        'religion',
        'caste',
        'mobile1',
        'officialEmail',
        'currentPosting.postingIn',
        'currentPosting.department',
        'currentPosting.designation',
        'currentPosting.postType',
        'currentPosting.locationChange',
      ] as string[],
      editable: [
        'languagesKnown',
        'personalEmail',
        'residentialAddress',
        'education',
        'officeContact',
      ] as string[],
    },
  },
  requests: {
    /** The order-details block on service forms: optional, hidden or required. */
    officerOrderDetails: 'optional' as 'optional' | 'hidden' | 'required',
  },
  uploads: { maxSizeMB: 10, accept: ['pdf', 'jpg', 'png'] as string[], communityMaxSizeMB: 25 },
  features: { anonymousPosts: true, askSeniors: true },
  /** Community pages. A page switched off leaves the menu and its route shows the 404 page. */
  community: {
    pages: {
      proposals: true,
      discourse: true,
      colleagues: true,
      capacity: true,
      beyond: true,
      awards: true,
    } as Record<string, boolean>,
  },
  medical: { concurrenceLabel: 'Medical concurrence' },
  i18n: { defaultLocale: 'en', enabledLocales: ['en', 'ta'] as string[] },
  session: { idleMinutes: 20 },
  ideas: {
    statuses: ['submitted', 'under-review', 'accepted', 'not-taken-forward'] as string[],
  },
};

/** Route id to the `community.pages` key that switches it off. */
export const PAGE_FLAGS: Record<string, string> = {
  'community.proposals': 'proposals',
  'community.proposal': 'proposals',
  'community.proposals.new': 'proposals',
  'community.discourse': 'discourse',
  'community.post': 'discourse',
  'community.discourse.new': 'discourse',
  'community.colleagues': 'colleagues',
  'community.colleague': 'colleagues',
  'community.subject': 'colleagues',
  'community.capacity': 'capacity',
  'community.beyond': 'beyond',
  'community.awards': 'awards',
};
