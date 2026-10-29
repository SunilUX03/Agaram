import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Breadcrumb, type Crumb } from './Breadcrumb';

interface Props {
  headline: string;
  tagline?: ReactNode;
  /** The page's single filled button. Moves under the tagline on mobile. */
  main?: ReactNode;
  secondary?: ReactNode;
  image?: ReactNode;
  breadcrumb?: Crumb[];
  /** Also show the main button in a sticky bar on mobile (hidden in the header there). */
  stickyMain?: boolean;
}

/**
 * Standard page header. Owns the page's one H1: on mount it scrolls to top,
 * moves focus to the H1 and sets the document title to "{Headline} | Agaram".
 */
export function PageHeader({
  headline,
  tagline,
  main,
  secondary,
  image,
  breadcrumb,
  stickyMain,
}: Props) {
  const { t } = useTranslation();
  const h1 = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo(0, 0);
    h1.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    document.title = t('app.title', { headline });
  }, [headline, t]);
  return (
    <header className="page-header ux4g-mb-l">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <div className="ux4g-d-flex ux4g-jc-between ux4g-gap-xl">
        <div className="page-header-text">
          <h1 ref={h1} tabIndex={-1} className="ux4g-heading-l-strong">
            {headline}
          </h1>
          {tagline && (
            <p className="ux4g-body-m-default ux4g-text-neutral-secondary ux4g-mt-xs">{tagline}</p>
          )}
          {(main || secondary) && (
            <div
              className={`ux4g-d-flex ux4g-flex-wrap ux4g-gap-s ux4g-mt-m${stickyMain ? ' hide-mobile' : ''}`}
            >
              {main}
              {secondary}
            </div>
          )}
        </div>
        {image && <div className="ux4g-d-none ux4g-lg-d-block page-header-image">{image}</div>}
      </div>
      {stickyMain && main && <div className="sticky-bar">{main}</div>}
    </header>
  );
}

/** Neutral placeholder until real art exists (brief, section 4). Decorative. */
export const ImagePlaceholder = () => (
  <div className="ux4g-ratio-16-9 ux4g-bg-neutral-soft" aria-hidden="true" />
);
