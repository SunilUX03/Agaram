import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/Toast';
import { api } from '@/data/api';
import { useQ } from '@/data/hooks';
import { demo, setDemo } from '@/data/store';
import { setLanguage } from '@/i18n';

/** Development-only panel, opened with ?demo=1 (remembered for the tab). */
export function useDemoMode(): boolean {
  try {
    if (new URLSearchParams(location.search).get('demo') === '1')
      sessionStorage.setItem('demo', '1');
    return sessionStorage.getItem('demo') === '1';
  } catch {
    return false;
  }
}

export function DemoControls() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const requests = useQ('requests');
  const [rid, setRid] = useState('');
  const [reason, setReason] = useState('');
  const [flags, setFlags] = useState({ ...demo });

  const flip = (k: keyof typeof demo) => {
    const next = { ...flags, [k]: !flags[k] };
    setFlags(next);
    setDemo(next);
    void qc.resetQueries();
  };
  const reset = async () => {
    await api.resetDemo();
    void qc.resetQueries();
    toast(t('demo.resetDone'));
  };
  const submitted = requests.data?.filter((r) => r.status === 'submitted') ?? [];
  const decide = async (to: 'approved' | 'returned' | 'rejected') => {
    const id = rid || submitted[0]?.id;
    if (!id) return toast(t('demo.noneSubmitted'));
    try {
      await api.decideRequest(id, to, reason || undefined);
      void qc.invalidateQueries();
      toast(t('demo.done'));
    } catch {
      toast(t('demo.failed'));
    }
  };
  const sample = async () => {
    await api.createSampleReturned();
    void qc.invalidateQueries();
    toast(t('demo.sampleDone'));
  };

  return (
    <details className="ux4g-card ux4g-card-outline ux4g-card-vertical card-pad demo-panel">
      <summary>{t('demo.title')}</summary>
      <div>
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m"
          onClick={() => setLanguage(i18n.language === 'ta' ? 'en' : 'ta')}
        >
          {t('demo.language')}: {i18n.language === 'ta' ? 'EN' : 'த'}
        </button>
        <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={reset}>
          {t('demo.reset')}
        </button>
        {(['forceLoading', 'forceEmpty', 'forceError'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-m"
            aria-pressed={flags[k]}
            style={
              flags[k] ? { background: 'var(--ux4g-bg-primary-strong)', color: '#fff' } : undefined
            }
            onClick={() => flip(k)}
          >
            {t(`demo.${k}`)}
          </button>
        ))}
        <label className="ux4g-body-s-default" htmlFor="demo-req">
          {t('demo.request')}
        </label>
        <div className="ux4g-input-container ux4g-input-s ux4g-input-default">
          <select id="demo-req" value={rid} onChange={(e) => setRid(e.target.value)}>
            <option value="">{submitted[0]?.title ?? t('demo.noneSubmitted')}</option>
            {submitted.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
          </select>
        </div>
        <label className="ux4g-body-s-default" htmlFor="demo-reason">
          {t('demo.reason')}
        </label>
        <div className="ux4g-input-container ux4g-input-s ux4g-input-default">
          <input id="demo-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button
          type="button"
          className="ux4g-btn-primary ux4g-btn-m"
          onClick={() => decide('approved')}
        >
          {t('demo.approve')}
        </button>
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m"
          onClick={() => decide('returned')}
        >
          {t('demo.return')}
        </button>
        <button
          type="button"
          className="ux4g-btn-outline-primary ux4g-btn-m"
          onClick={() => decide('rejected')}
        >
          {t('demo.reject')}
        </button>
        <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={sample}>
          {t('demo.sample')}
        </button>
      </div>
    </details>
  );
}
