import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useDebounced } from './hooks';

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  /** Result count shown under the box. */
  count?: number;
}

/** Debounced 250 ms. Typing updates the box at once; `onChange` fires after the pause. */
export const SearchField = forwardRef<HTMLInputElement, Props>(function SearchField(
  { label, placeholder, value, onChange, count },
  ref,
) {
  const { t } = useTranslation();
  const [text, setText] = useState(value);
  const debounced = useDebounced(text, 250);
  useEffect(() => setText(value), [value]);
  useEffect(() => {
    if (debounced !== value) onChange(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);
  return (
    <div className="search" role="search">
      <label className="sr-only" htmlFor="sf-input">
        {label}
      </label>
      <Icon name="search" size={18} />
      <input
        id="sf-input"
        ref={ref}
        type="search"
        autoComplete="off"
        placeholder={placeholder ?? label}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      {text && (
        <button
          type="button"
          className="icon-btn icon-btn-sm"
          aria-label={t('ui.search.clear')}
          onClick={() => {
            setText('');
            onChange('');
          }}
        >
          <Icon name="close" size={16} />
        </button>
      )}
      {count !== undefined && (
        <span className="search-count" aria-live="polite">
          {t('ui.search.results', { count })}
        </span>
      )}
    </div>
  );
});
