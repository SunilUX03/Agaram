const ALLOWED = new Set([
  'P',
  'H2',
  'H3',
  'STRONG',
  'B',
  'EM',
  'I',
  'UL',
  'OL',
  'LI',
  'A',
  'BLOCKQUOTE',
  'BR',
]);

/** Keeps a short list of tags (brief, section 11). Everything else is unwrapped; links get safe attributes. */
export function sanitizeHtml(html: string): string {
  const doc = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html');
  const walk = (node: Element) => {
    for (const child of Array.from(node.children)) {
      walk(child);
      if (!ALLOWED.has(child.tagName)) {
        if (/^(SCRIPT|STYLE)$/.test(child.tagName)) child.remove();
        else child.replaceWith(...Array.from(child.childNodes));
        continue;
      }
      for (const attr of Array.from(child.attributes)) {
        if (!(child.tagName === 'A' && attr.name === 'href')) child.removeAttribute(attr.name);
      }
      if (child.tagName === 'A') {
        const href = child.getAttribute('href') ?? '';
        if (!/^(https?:|mailto:|\/)/i.test(href)) child.removeAttribute('href');
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer');
      }
    }
  };
  walk(doc.body);
  return doc.body.innerHTML;
}
