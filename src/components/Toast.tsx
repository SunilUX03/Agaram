import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';

interface ToastItem {
  id: number;
  text: string;
}
type Show = (text: string) => void;
const Ctx = createContext<Show>(() => {});
export const useToast = () => useContext(Ctx);

export const TOAST_MS = 5000;
const MAX = 3;

/** UX4G success alerts stacked at the corner: stay about 5 seconds, at most three, announced politely. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((x) => x.id !== id)), []);
  const show = useCallback<Show>(
    (text) => {
      const id = ++seq.current;
      setItems((l) => [...l, { id, text }].slice(-MAX));
      setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss],
  );
  const value = useMemo(() => show, [show]);
  return (
    <Ctx.Provider value={value}>
      {children}
      <div
        className="toasts"
        role="region"
        aria-label={t('ui.toast.region')}
        aria-live="polite"
        aria-atomic="false"
      >
        {items.map((it) => (
          <div key={it.id} className="ux4g-alert ux4g-alert-success" role="status">
            <div className="ux4g-alert-content">
              <span className="ux4g-alert-message">{it.text}</span>
            </div>
            <button
              type="button"
              className="ux4g-alert-close"
              aria-label={t('ui.toast.dismiss')}
              onClick={() => dismiss(it.id)}
            >
              <i className="ux4g-icon-outlined" aria-hidden="true">
                close
              </i>
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
