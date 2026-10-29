import '@testing-library/jest-dom/vitest';

window.scrollTo = () => {};

// jsdom has no matchMedia. Tests run as a desktop-width screen unless they override it.
export function setViewport(width: number) {
  window.matchMedia = ((query: string) => {
    const max = /max-width:\s*(\d+)px/.exec(query);
    const min = /min-width:\s*(\d+)px/.exec(query);
    const matches = (max ? width <= +max[1] : true) && (min ? width >= +min[1] : true);
    return {
      matches,
      media: query,
      addEventListener() {},
      removeEventListener() {},
      addListener() {},
      removeListener() {},
      onchange: null,
      dispatchEvent: () => false,
    } as MediaQueryList;
  }) as typeof window.matchMedia;
}
setViewport(1280);
