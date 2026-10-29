import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/Toast';
import { api } from '@/data/api';
import { useQ } from '@/data/hooks';
import { demo, setDemo } from '@/data/store';
import { setLanguage } from '@/i18n';
import type { RequestStatus } from '@/domain/status';

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

const TARGETS: [RequestStatus, string][] = [
  ['with-desk', 'demo.toWithDesk'],
  ['ready-for-approval', 'demo.toReady'],
  ['returned', 'demo.toReturned'],
  ['approved', 'demo.toApproved'],
  ['rejected', 'demo.toRejected'],
];

export function DemoControls() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const toast = useToast();
  const requests = useQ('requests');
  const [rid, setRid] = useState('');
  const [target, setTarget] = useState<RequestStatus>('with-desk');
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
  const apply = async () => {
    const id = rid || requests.data?.find((r) => r.status !== 'draft')?.id;
    if (!id) return;
    try {
      await api.advanceRequest(id, target);
      void qc.invalidateQueries();
      toast(t('demo.done'));
    } catch {
      toast(t('demo.failed'));
    }
  };

  return (
    <details className="card demo-panel">
      <summary>{t('demo.title')}</summary>
      <div>
        <button
          type="button"
          className="btn"
          onClick={() => setLanguage(i18n.language === 'ta' ? 'en' : 'ta')}
        >
          {t('demo.language')}: {i18n.language === 'ta' ? 'EN' : 'த'}
        </button>
        <button type="button" className="btn" onClick={reset}>
          {t('demo.reset')}
        </button>
        {(['forceLoading', 'forceEmpty', 'forceError'] as const).map((k) => (
          <button
            key={k}
            type="button"
            className="btn"
            aria-pressed={flags[k]}
            style={flags[k] ? { background: 'var(--ink)', color: '#fff' } : undefined}
            onClick={() => flip(k)}
          >
            {t(`demo.${k}`)}
          </button>
        ))}
        <label className="small" htmlFor="demo-req">
          {t('demo.request')}
        </label>
        <select
          id="demo-req"
          className="input"
          style={{ minHeight: 40 }}
          value={rid}
          onChange={(e) => setRid(e.target.value)}
        >
          <option value="">
            {requests.data?.length
              ? requests.data.find((r) => r.status !== 'draft')?.title
              : t('demo.none')}
          </option>
          {requests.data
            ?.filter((r) => r.status !== 'draft')
            .map((r) => (
              <option key={r.id} value={r.id}>
                {r.title}
              </option>
            ))}
        </select>
        <label className="small" htmlFor="demo-to">
          {t('demo.moveTo')}
        </label>
        <select
          id="demo-to"
          className="input"
          style={{ minHeight: 40 }}
          value={target}
          onChange={(e) => setTarget(e.target.value as RequestStatus)}
        >
          {TARGETS.map(([v, k]) => (
            <option key={v} value={v}>
              {t(k)}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={apply}>
          {t('demo.advance')}
        </button>
      </div>
    </details>
  );
}
