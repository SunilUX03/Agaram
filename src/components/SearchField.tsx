import { forwardRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounced } from './hooks';

interface Props {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  /** Result count shown under the box. */
  count?: number;
}

/** UX4G search field, debounced 250 ms. Typing updates the box at once; `onChange` fires after the pause. */
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
    <div role="search">
      <div className="ux4g-search-container ux4g-search-m">
        <label className="sr-only" htmlFor="sf-input">
          {label}
        </label>
        <div className="ux4g-search">
          <i className="ux4g-icon-outlined ux4g-search-leading-icon" aria-hidden="true">
            search
          </i>
          <input
            id="sf-input"
            ref={ref}
            type="search"
            className="ux4g-search-input"
            autoComplete="off"
            placeholder={placeholder ?? label}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text && (
            <button
              type="button"
              className="ux4g-search-clear"
              aria-label={t('ui.search.clear')}
              onClick={() => (setText(''), onChange(''))}
            >
              <i className="ux4g-icon-outlined" aria-hidden="true">
                close
              </i>
            </button>
          )}
        </div>
      </div>
      {count !== undefined && (
        <p
          className="ux4g-body-s-default ux4g-text-neutral-secondary ux4g-mt-xs"
          aria-live="polite"
        >
          {t('ui.search.results', { count })}
        </p>
      )}
    </div>
  );
});
