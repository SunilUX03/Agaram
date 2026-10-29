/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import purgecss from '@fullhuman/postcss-purgecss';

/** The UX4G stylesheet covers every component (8 MB). Keep only the classes this app's source mentions. */
const purge = purgecss({
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  safelist: {
    // Classes the source assembles from parts, for example `ux4g-avatar-${size}` or `ux4g-input-${l|m|s|xl}`.
    // Plain words keep the element selectors of the resets (html, body, button, ...).
    standard: [
      /^[a-z][a-z0-9]*$/,
      /^ux4g-avatar/,
      /^ux4g-dropdown-(default|error)$/,
      /^ux4g-input-(xl|l|m|s)$/,
    ],
  },
});

/** Rules with no class in their selector (resets, :root tokens, :focus-visible, [data-*]) or using :is/:where/:not/:has, which PurgeCSS cannot read, are always kept. */
const keepGlobals = {
  postcssPlugin: 'keep-ux4g-globals',
  Once(root: import('postcss').Root, { postcss }: import('postcss').Helpers) {
    root.walkRules((rule) => {
      if (!rule.selector.includes('.') || /:(is|where|not|has)\(/.test(rule.selector))
        rule.prepend(postcss.comment({ text: 'purgecss ignore current' }));
    });
  },
};

/**
 * The UX4G stylesheet embeds seven fonts as base64 (7.5 MB). In production builds keep only the Outlined icon
 * font, served from /public/fonts as a cacheable file, and drop the text fonts (Noto Sans comes from Google Fonts).
 */
const slimFonts = {
  postcssPlugin: 'slim-ux4g-fonts',
  AtRule: {
    'font-face': (rule: import('postcss').AtRule) => {
      const family = rule.nodes?.find((n) => n.type === 'decl' && n.prop === 'font-family');
      if (
        family?.type !== 'decl' ||
        family.value.replace(/["']/g, '') !== 'UX4G Material Icons Outlined'
      )
        return void rule.remove();
      rule.walkDecls('src', (d) => {
        d.value = 'url(../fonts/ux4g-material-icons-outlined.otf) format("opentype")';
      });
      rule.walkDecls('font-display', (d) => {
        d.value = 'block'; // icons are ligature text: hide it until the font arrives
      });
    },
  },
};

export default defineConfig(({ command }) => ({
  // Dev keeps the full package stylesheet; only builds slim it down.
  css: { postcss: { plugins: command === 'build' ? [slimFonts, keepGlobals, purge] : [] } },
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
}));
