import { useEffect, useId, useRef, useState, type RefObject } from 'react';

export function useMediaQuery(query: string): boolean {
  const get = () => (typeof matchMedia === 'function' ? matchMedia(query).matches : false);
  const [matches, setMatches] = useState(get);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia(query);
    const on = () => setMatches(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, [query]);
  return matches;
}

/** Breakpoints from the brief, section 4. */
export const useIsDesktop = () => useMediaQuery('(min-width: 1024px)');
export const useIsMobile = () => useMediaQuery('(max-width: 639px)');

export function useDebounced<T>(value: T, ms = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

export function useOutsideClick(
  ref: RefObject<HTMLElement | null>,
  onOutside: () => void,
  active = true,
) {
  const cb = useRef(onOutside);
  useEffect(() => {
    cb.current = onOutside;
  });
  useEffect(() => {
    if (!active) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) cb.current();
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, active]);
}

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Traps Tab inside `ref`, closes on Escape, returns focus to the opener. */
export function useDialogFocus(
  ref: RefObject<HTMLElement | null>,
  onClose: () => void,
  initial?: string,
) {
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  });
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const first =
      (initial && node?.querySelector<HTMLElement>(initial)) ||
      node?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close.current();
      }
      if (e.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) return;
      const [a, z] = [items[0], items[items.length - 1]];
      if (e.shiftKey && document.activeElement === a) {
        e.preventDefault();
        z.focus();
      } else if (!e.shiftKey && document.activeElement === z) {
        e.preventDefault();
        a.focus();
      }
    };
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('keydown', key);
      opener?.focus?.();
    };
  }, [ref, initial]);
}

export const useUid = (prefix = 'id') => `${prefix}-${useId().replace(/:/g, '')}`;
