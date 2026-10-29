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
import { Icon } from './Icon';

interface ToastItem {
  id: number;
  text: string;
}
type Show = (text: string) => void;
const Ctx = createContext<Show>(() => {});
export const useToast = () => useContext(Ctx);

export const TOAST_MS = 5000;
const MAX = 3;

/** Short messages that stay about 5 seconds, stack at most three, and are announced politely. */
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
          <div key={it.id} className="toast" role="status">
            <span>{it.text}</span>
            <button
              type="button"
              className="icon-btn icon-btn-sm"
              aria-label={t('ui.toast.dismiss')}
              onClick={() => dismiss(it.id)}
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
