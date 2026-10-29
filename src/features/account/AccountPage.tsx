import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar } from '@/components/Avatar';
import { QueryView } from '@/components/QueryView';
import { useToast } from '@/components/Toast';
import { Checkbox, PasswordField, RadioGroup, TextField } from '@/components/form/inputs';
import { RouteHeader } from '@/app/usePage';
import { features } from '@/config/features';
import { useMut, useQ } from '@/data/hooks';
import { session } from '@/data/store';
import { setLanguage } from '@/i18n';
import type { Officer, Settings } from '@/domain/types';

export default function AccountPage() {
  const o = useQ('officer');
  const s = useQ('settings');
  return (
    <QueryView query={o} skeleton="card" skeletonCount={4}>
      {(officer) => (
        <QueryView query={s} skeleton="card">
          {(settings) => <Form officer={officer} settings={settings} />}
        </QueryView>
      )}
    </QueryView>
  );
}

function Form({ officer, settings }: { officer: Officer; settings: Settings }) {
  const { t, i18n } = useTranslation('account');
  const toast = useToast();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { hash } = useLocation();
  const save = useMut('saveSettings');
  const [contact, setContact] = useState({
    mobile1: officer.contact.mobile1,
    mobile2: officer.contact.mobile2 ?? '',
    personalEmail: officer.contact.personalEmail ?? '',
  });
  const [prefs, setPrefs] = useState(settings);
  const [pw, setPw] = useState({ cur: '', next: '', confirm: '' });
  const [pwErr, setPwErr] = useState<{ next?: string; confirm?: string; cur?: string }>({});
  const req = t('ui.errors.required', { ns: 'common' });
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView?.({ block: 'start' });
  }, [hash]);
  const [photo, setPhoto] = useState<string | undefined>();

  const changePw = () => {
    const e = {
      cur: pw.cur ? undefined : req,
      next: pw.next.length >= 8 ? undefined : t('password.short'),
      confirm: pw.confirm === pw.next ? undefined : t('password.mismatch'),
    };
    setPwErr(e);
    if (!e.cur && !e.next && !e.confirm) {
      setPw({ cur: '', next: '', confirm: '' });
      toast(t('password.changed'));
    }
  };
  const set = (k: 'sharePhone' | 'shareEmail') => (v: boolean) => setPrefs({ ...prefs, [k]: v });
  const note = (k: keyof Settings['notify']) => (v: boolean) =>
    setPrefs({ ...prefs, notify: { ...prefs.notify, [k]: v } });
  const sw = { show: t('password.show'), hide: t('password.hide') };
  return (
    <>
      <RouteHeader
        id="account"
        main={{
          onClick: () =>
            save.mutate(
              [
                prefs,
                {
                  mobile1: contact.mobile1,
                  mobile2: contact.mobile2 || undefined,
                  personalEmail: contact.personalEmail || undefined,
                },
              ],
              { onSuccess: () => toast(t('saved')) },
            ),
          disabled: save.isPending,
        }}
        image={
          <div className="row">
            <Avatar name={officer.name} photoUrl={photo ?? officer.photoUrl} size={72} />
            <label className="link" style={{ cursor: 'pointer' }}>
              {t('photo')}
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPhoto(URL.createObjectURL(f));
                }}
              />
            </label>
          </div>
        }
      />
      <div className="form-narrow stack">
        <section id="contact" className="card" aria-labelledby="h-contact">
          <h2 id="h-contact" className="h-sm">
            {t('contact.title')}
          </h2>
          <TextField
            name="acc-m1"
            label={t('contact.mobile1')}
            autoComplete="tel"
            value={contact.mobile1}
            onChange={(v) => setContact({ ...contact, mobile1: v })}
          />
          <TextField
            name="acc-m2"
            label={t('contact.mobile2')}
            autoComplete="tel"
            value={contact.mobile2}
            onChange={(v) => setContact({ ...contact, mobile2: v })}
          />
          <TextField
            name="acc-pe"
            label={t('contact.personalEmail')}
            type="email"
            autoComplete="email"
            value={contact.personalEmail}
            onChange={(v) => setContact({ ...contact, personalEmail: v })}
          />
          <TextField
            name="acc-oe"
            label={t('contact.officialEmail')}
            help={t('contact.officialNote')}
            value={officer.contact.officialEmail}
            onChange={() => {}}
            locked
          />
        </section>
        <section id="password" className="card" aria-labelledby="h-pw">
          <h2 id="h-pw" className="h-sm">
            {t('password.title')}
          </h2>
          <PasswordField
            name="acc-cur"
            label={t('password.current')}
            autoComplete="current-password"
            value={pw.cur}
            onChange={(v) => setPw({ ...pw, cur: v })}
            error={pwErr.cur}
            {...{ showLabel: sw.show, hideLabel: sw.hide }}
          />
          <PasswordField
            name="acc-new"
            label={t('password.new')}
            autoComplete="new-password"
            value={pw.next}
            onChange={(v) => setPw({ ...pw, next: v })}
            error={pwErr.next}
            {...{ showLabel: sw.show, hideLabel: sw.hide }}
          />
          <PasswordField
            name="acc-conf"
            label={t('password.confirm')}
            autoComplete="new-password"
            value={pw.confirm}
            onChange={(v) => setPw({ ...pw, confirm: v })}
            error={pwErr.confirm}
            {...{ showLabel: sw.show, hideLabel: sw.hide }}
          />
          <button type="button" className="btn" onClick={changePw}>
            {t('password.change')}
          </button>
        </section>
        <section id="language" className="card" aria-labelledby="h-lang">
          <h2 id="h-lang" className="h-sm">
            {t('language.title')}
          </h2>
          <RadioGroup
            name="acc-lang"
            legend={t('language.title')}
            value={i18n.language}
            onChange={setLanguage}
            options={features.i18n.enabledLocales.map((l) => ({
              value: l,
              label: t(`language.${l}`),
            }))}
          />
        </section>
        <section id="notifications" className="card" aria-labelledby="h-notif">
          <h2 id="h-notif" className="h-sm">
            {t('notifications.title')}
          </h2>
          <p className="help">{t('notifications.help')}</p>
          {(['requests', 'replies', 'circulars', 'trainings'] as const).map((k) => (
            <Checkbox
              key={k}
              name={`acc-n-${k}`}
              label={t(`notifications.${k}`)}
              checked={prefs.notify[k]}
              onChange={note(k)}
            />
          ))}
        </section>
        <section id="privacy" className="card" aria-labelledby="h-priv">
          <h2 id="h-priv" className="h-sm">
            {t('privacy.title')}
          </h2>
          <p className="help">{t('privacy.help')}</p>
          <Checkbox
            name="acc-sp"
            label={t('privacy.phone')}
            checked={prefs.sharePhone}
            onChange={set('sharePhone')}
          />
          <Checkbox
            name="acc-se"
            label={t('privacy.email')}
            checked={prefs.shareEmail}
            onChange={set('shareEmail')}
          />
        </section>
        <div>
          <button
            type="button"
            className="btn"
            onClick={() => (session.end(), qc.clear(), nav('/login'))}
          >
            {t('signOut')}
          </button>
        </div>
      </div>
    </>
  );
}
