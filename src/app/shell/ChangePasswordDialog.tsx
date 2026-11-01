import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog } from '@/components/Dialog';
import { useToast } from '@/components/Toast';
import { PasswordField } from '@/components/form/inputs';

/** Change Password: three fields, checked here (demo only, nothing is stored). */
export function ChangePasswordDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation('auth');
  const toast = useToast();
  const [v, setV] = useState({ current: '', next: '', confirm: '' });
  const [tried, setTried] = useState(false);
  const set = (k: keyof typeof v) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const errs = {
    current: v.current ? undefined : t('password.required'),
    next: v.next.length >= 8 ? undefined : t('password.short'),
    confirm: v.confirm === v.next && v.confirm ? undefined : t('password.mismatch'),
  };
  const ok = !errs.current && !errs.next && !errs.confirm;
  const send = () => {
    setTried(true);
    if (!ok) return;
    toast(t('password.done'));
    onClose();
  };
  return (
    <Dialog
      title={t('password.title')}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="ux4g-btn-outline-primary ux4g-btn-m" onClick={onClose}>
            {t('password.cancel')}
          </button>
          <button type="button" className="ux4g-btn-primary ux4g-btn-m" onClick={send}>
            {t('password.save')}
          </button>
        </>
      }
    >
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <PasswordField
          name="pw-current"
          label={t('password.current')}
          value={v.current}
          onChange={set('current')}
          error={tried ? errs.current : undefined}
          required
          autoComplete="current-password"
          showLabel={t('login.show')}
          hideLabel={t('login.hide')}
        />
        <PasswordField
          name="pw-new"
          label={t('password.new')}
          value={v.next}
          onChange={set('next')}
          error={tried ? errs.next : undefined}
          required
          autoComplete="new-password"
          showLabel={t('login.show')}
          hideLabel={t('login.hide')}
        />
        <PasswordField
          name="pw-confirm"
          label={t('password.confirm')}
          value={v.confirm}
          onChange={set('confirm')}
          error={tried ? errs.confirm : undefined}
          required
          autoComplete="new-password"
          showLabel={t('login.show')}
          hideLabel={t('login.hide')}
        />
      </form>
    </Dialog>
  );
}
