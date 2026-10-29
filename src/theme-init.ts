// Applies the saved theme before first paint (design.md: avoid flash of wrong theme).
try {
  const saved = localStorage.getItem('theme');
  const dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch {
  /* storage unavailable: keep default light theme */
}
