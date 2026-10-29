import { useTranslation } from 'react-i18next';
import { HelpTip } from './HelpTip';

/** An abbreviation with a "What is this?" tip. Use the first time it appears on a page. */
export function Abbr({
  k,
  children,
}: {
  k: 'CL' | 'RH' | 'EL' | 'HPL' | 'LTC' | 'GPF' | 'HBA' | 'IPR' | 'MHA' | 'SAF';
  children?: string;
}) {
  const { t } = useTranslation();
  return (
    <span className="abbr">
      {children ?? k}
      <HelpTip text={t(`abbr.${k}`)} />
    </span>
  );
}
