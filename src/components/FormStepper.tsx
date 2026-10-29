import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface StepDef {
  id: string;
  title: string;
  content: ReactNode;
  /** Return error messages. An empty array means the step is valid. */
  validate?: () => string[] | Promise<string[]>;
}

interface Props {
  steps: StepDef[];
  /** Called after every successful Next, so the form can autosave a draft. */
  onAutosave?: (stepIndex: number) => void;
  onSaveDraft?: () => void;
  onSend: () => void | Promise<void>;
  initialStep?: number;
  /** Final-step button text. Defaults to "Send". */
  sendLabel?: string;
  /** Lets the Review step jump back to an earlier step. */
  stepRef?: React.MutableRefObject<{ goTo: (i: number) => void } | null>;
}

/** Multi-step form frame: progress, Back/Next, per-step validation, error summary, sticky mobile bar. */
export function FormStepper({
  steps,
  onAutosave,
  onSaveDraft,
  onSend,
  initialStep = 0,
  sendLabel,
  stepRef,
}: Props) {
  const { t } = useTranslation();
  const [i, setI] = useState(initialStep);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const summary = useRef<HTMLDivElement>(null);
  const last = i === steps.length - 1;
  useEffect(() => {
    if (stepRef) stepRef.current = { goTo: (n) => (setErrors([]), setI(n)) };
  }, [stepRef]);

  const fail = (list: string[]) => {
    setErrors(list);
    requestAnimationFrame(() => summary.current?.focus());
  };

  const next = async () => {
    const errs = (await steps[i].validate?.()) ?? [];
    if (errs.length) return fail(errs);
    setErrors([]);
    onAutosave?.(i);
    setI(i + 1);
  };
  const send = async () => {
    if (busy) return;
    const errs = (await steps[i].validate?.()) ?? [];
    if (errs.length) return fail(errs);
    setBusy(true); // no double submits
    await onSend();
  };

  return (
    <form className="stepper" noValidate onSubmit={(e) => e.preventDefault()}>
      <div className="stepper-progress">
        <span>{t('ui.stepper.step', { n: i + 1, total: steps.length })}</span>
        <progress max={steps.length} value={i + 1} aria-label={t('ui.stepper.progress')} />
        <strong>{steps[i].title}</strong>
      </div>
      {errors.length > 0 && (
        <div ref={summary} tabIndex={-1} role="alert" className="banner banner-critical">
          <div>
            <strong>{t('ui.field.errorSummary')}</strong>
            <ul>
              {errors.map((e, k) => (
                <li key={k}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div className="stepper-body">{steps[i].content}</div>
      <div className="stepper-bar">
        {i > 0 && (
          <button type="button" className="btn" onClick={() => (setErrors([]), setI(i - 1))}>
            {t('ui.stepper.back')}
          </button>
        )}
        {onSaveDraft && (
          <button type="button" className="btn" onClick={onSaveDraft}>
            {t('ui.stepper.saveDraft')}
          </button>
        )}
        <span className="spacer" />
        {last ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            aria-busy={busy}
            onClick={send}
          >
            {busy ? t('ui.stepper.sending') : (sendLabel ?? t('ui.stepper.send'))}
          </button>
        ) : (
          <button type="button" className="btn btn-primary" onClick={next}>
            {t('ui.stepper.next')}
          </button>
        )}
      </div>
    </form>
  );
}
