export const LEAVE_TYPES = [
  'Casual leave',
  'Special casual leave',
  'Restricted holiday',
  'Earned leave',
  'Ex-India leave',
  'Half-pay leave (with medical certificate)',
  'Half-pay leave',
  'Child care leave',
  'Paternity leave',
  'Maternity leave',
  'Medical leave',
  'Leave not due',
  'EL surrender',
  'Extraordinary leave',
  'Compulsory wait',
];
export const COUNTRIES = [
  'Singapore',
  'United Kingdom',
  'United States',
  'Japan',
  'Germany',
  'France',
  'Australia',
  'United Arab Emirates',
  'Sri Lanka',
  'Netherlands',
  'Canada',
  'Switzerland',
];
export const STATE_DISTRICTS: Record<string, string[]> = {
  'Tamil Nadu': [
    'Ariyalur',
    'Chengalpattu',
    'Chennai',
    'Coimbatore',
    'Cuddalore',
    'Madurai',
    'Salem',
    'Thanjavur',
    'Tiruchirappalli',
    'Tirunelveli',
    'Vellore',
  ],
  Kerala: ['Ernakulam', 'Kozhikode', 'Thiruvananthapuram'],
  Karnataka: ['Bengaluru Urban', 'Mysuru'],
  'Andhra Pradesh': ['Visakhapatnam', 'Guntur'],
  Delhi: ['New Delhi'],
};
export const TN_DISTRICTS = STATE_DISTRICTS['Tamil Nadu'];
export const DEPARTMENTS = [
  'Public Department',
  'Finance Department',
  'Revenue and Disaster Management',
  'Rural Development and Panchayat Raj',
  'School Education',
  'Health and Family Welfare',
  'Agriculture and Farmers Welfare',
  'Municipal Administration and Water Supply',
];
export const SOURCE_OF_FUNDS = [
  'Savings',
  'Loan',
  'Gift',
  'Sale of property',
  'Inheritance',
  'Other',
];
export const FUNDING = [
  'Self',
  'State Government',
  'Central Government',
  'Organisation',
  'University',
  'Others',
];
export const toOptions = (list: string[]) => list.map((v) => ({ value: v, label: v }));
