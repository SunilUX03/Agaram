/** Calm line drawings used where the brief asks for a decorative illustration. Always decorative. */
const art: Record<string, JSX.Element> = {
  building: (
    <>
      <path d="M20 150h200M30 150V80h180v70M20 80l100-50 100 50M60 150V100M95 150V100M130 150V100M165 150V100M200 150V100" />
      <path d="M105 150v-30h30v30M120 30v-12M120 18l14 5-14 5" />
    </>
  ),
  people: (
    <>
      <circle cx="70" cy="70" r="18" />
      <path d="M36 150c0-26 14-40 34-40s34 14 34 40" />
      <circle cx="160" cy="76" r="15" />
      <path d="M134 150c0-22 11-34 26-34s26 12 26 34" />
      <path d="M96 40h60a10 10 0 0 1 10 10v22l-14-8H96a10 10 0 0 1-10-10V50a10 10 0 0 1 10-10z" />
    </>
  ),
  tick: (
    <>
      <circle cx="60" cy="60" r="40" />
      <path d="M42 62l14 14 26-30" />
    </>
  ),
  bell: (
    <>
      <path d="M60 100V68a24 24 0 0 1 48 0v32l10 12H50z" />
      <path d="M76 124a8 8 0 0 0 16 0" />
    </>
  ),
};
export function Illustration({ name, size = 240 }: { name: keyof typeof art; size?: number }) {
  return (
    <svg
      className="illustration"
      width={size}
      height={size * 0.75}
      viewBox="0 0 240 180"
      fill="none"
      stroke="var(--ux4g-text-neutral-primary)"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="2"
        y="2"
        width="236"
        height="176"
        rx="20"
        fill="var(--ux4g-bg-primary-subtle)"
        stroke="none"
      />
      <g transform={name === 'tick' || name === 'bell' ? 'translate(60 20)' : undefined}>
        {art[name]}
      </g>
      <circle cx="205" cy="30" r="6" fill="var(--ux4g-bg-primary-strong)" stroke="none" />
    </svg>
  );
}
