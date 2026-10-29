import { useTranslation } from 'react-i18next';

/** Config-driven text (request type names, field labels). English comes from the config; Tamil from requests:cfg.*. */
export function useCfg() {
  const { t } = useTranslation('requests');
  return (type: string, part: string, fallback: string) =>
    t(`cfg.${type}.${part}`, { defaultValue: fallback });
}
