/**
 * The official names of sections and pages (v2, section 7). Menus, tabs, breadcrumbs and page titles read
 * these. Changing a name needs only this file: they are merged into the English catalogue as `common:nav.*`.
 */
export const LABELS = {
  home: 'Home',
  records: 'Records & Requests',
  recordsHome: 'Records & Requests Home',
  profile: 'Profile',
  career: 'Career',
  services: 'My Services',
  downloads: 'Downloads',
  community: 'Community',
  communityHome: 'Community Home',
  proposals: 'Policy Proposals',
  discourse: 'Discourse',
  colleagues: 'Your Colleagues',
  capacity: 'Capacity Building',
  beyond: 'Beyond the File',
  awards: 'Awards',
  me: 'Me',
  notifications: 'Notifications',
  changePassword: 'Change Password',
  logout: 'Logout',
} as const;
export type LabelKey = keyof typeof LABELS;
