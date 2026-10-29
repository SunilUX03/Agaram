import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { Illustration } from '@/components/Illustration';
import { PasswordField, Select, TextField } from '@/components/form/inputs';
import { useToast } from '@/components/Toast';
import { PageHeader } from '@/components/PageHeader';
import { LangSwitch } from '@/app/shell/LangSwitch';
import { usePageText } from '@/app/usePage';
import { Emblem } from '@/app/shell/TopBar';
import { session } from '@/data/store';

/** Demo sign-in: any non-empty email or ID and password signs in as the mock officer. */
export default function LoginPage() {
  const { t } = useTranslation('auth');
  const p = usePageText('login');
  const nav = useNavigate();
  const toast = useToast();
  const from = (useLocation().state as { from?: string } | null)?.from ?? '/home';
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [errs, setErrs] = useState<{ id?: string; pw?: string }>({});
  const [busy, setBusy] = useState(false);
  const [dialog, setDialog] = useState<'forgot' | 'access' | null>(null);
  const required = t('ui.errors.required', { ns: 'common' });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next = { id: id.trim() ? undefined : required, pw: pw ? undefined : required };
    setErrs(next);
    if (next.id || next.pw) return;
    setBusy(true);
    setTimeout(() => {
      session.start();
      nav(from, { replace: true });
    }, 600);
  };

  return (
    <div className="login">
      <div className="login-art" aria-hidden="true">
        <Illustration name="building" size={420} />
      </div>
      <div className="login-main">
        <div className="login-brand">
          <Emblem />
          <span>{t('app.name', { ns: 'common' })}</span>
        </div>
        <PageHeader headline={p.headline} tagline={p.tagline} />
        <form className="card login-card" onSubmit={submit} noValidate>
          <TextField
            name="login-id"
            label={t('login.idLabel')}
            value={id}
            onChange={setId}
            error={errs.id}
            required
            autoComplete="username"
          />
          <PasswordField
            name="login-pw"
            label={t('login.password')}
            value={pw}
            onChange={setPw}
            error={errs.pw}
            required
            autoComplete="current-password"
            showLabel={t('login.show')}
            hideLabel={t('login.hide')}
          />
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={busy}
            aria-busy={busy}
          >
            {busy ? t('login.signingIn') : p.main}
          </button>
          <div className="login-links">
            <button type="button" className="link-btn" onClick={() => setDialog('forgot')}>
              {t('login.forgot')}
            </button>
            <button type="button" className="link-btn" onClick={() => setDialog('access')}>
              {t('login.askAccess')}
            </button>
          </div>
          <p className="small muted">{t('login.demoHint')}</p>
        </form>
        <LangSwitch />
      </div>
      {dialog === 'forgot' && (
        <Dialog
          title={t('login.forgotTitle')}
          onClose={() => setDialog(null)}
          footer={
            <button type="button" className="btn btn-primary" onClick={() => setDialog(null)}>
              {t('login.close')}
            </button>
          }
        >
          <p>{t('login.forgotBody')}</p>
        </Dialog>
      )}
      {dialog === 'access' && (
        <AccessDialog
          onClose={() => setDialog(null)}
          onSent={() => (setDialog(null), toast(t('login.sent')))}
        />
      )}
    </div>
  );
}

function AccessDialog({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const { t } = useTranslation('auth');
  const [v, setV] = useState({ name: '', email: '', service: '' });
  const [tried, setTried] = useState(false);
  const req = t('ui.errors.required', { ns: 'common' });
  const e = (k: keyof typeof v) => (tried && !v[k].trim() ? req : undefined);
  return (
    <Dialog
      title={t('login.accessTitle')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            {t('login.cancel')}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => (setTried(true), v.name && v.email && v.service && onSent())}
          >
            {t('login.send')}
          </button>
        </>
      }
    >
      <TextField
        name="acc-name"
        label={t('login.name')}
        value={v.name}
        onChange={(x) => setV({ ...v, name: x })}
        error={e('name')}
        required
      />
      <TextField
        name="acc-email"
        label={t('login.email')}
        type="email"
        value={v.email}
        onChange={(x) => setV({ ...v, email: x })}
        error={e('email')}
        required
      />
      <Select
        name="acc-service"
        label={t('login.service')}
        value={v.service}
        onChange={(x) => setV({ ...v, service: x })}
        error={e('service')}
        required
        options={['IAS', 'IPS', 'IFS', 'TNCS'].map((s) => ({ value: s, label: s }))}
      />
    </Dialog>
  );
}
