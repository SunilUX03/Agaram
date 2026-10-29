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
      <div className="ux4g-mb-l">
        <p className="ux4g-body-m-default ux4g-text-neutral-secondary">
          {t('ui.stepper.step', { n: i + 1, total: steps.length })}
        </p>
        <div
          className="ux4g-progress-bar ux4g-my-s"
          data-ux-progress-bar
          data-ux-shape="rounded"
          role="progressbar"
          aria-label={t('ui.stepper.progress')}
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={i + 1}
          style={{ '--ux4g-progress-value': ((i + 1) / steps.length) * 100 } as React.CSSProperties}
        >
          <div className="ux4g-progress-bar-track">
            <div className="ux4g-progress-bar-fill" />
          </div>
        </div>
        <h2 className="ux4g-heading-s-strong ux4g-mt-l">{steps[i].title}</h2>
      </div>
      {errors.length > 0 && (
        <div
          ref={summary}
          tabIndex={-1}
          role="alert"
          className="ux4g-alert ux4g-alert-error ux4g-mb-m"
        >
          <div className="ux4g-alert-content">
            <strong className="ux4g-alert-title">{t('ui.field.errorSummary')}</strong>
            <ul className="ux4g-alert-message">
              {errors.map((e, k) => (
                <li key={k}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <div>{steps[i].content}</div>
      <div className="stepper-bar ux4g-d-flex ux4g-ai-center gap-s">
        {i > 0 && (
          <button
            type="button"
            className="ux4g-btn-outline-primary ux4g-btn-m"
            onClick={() => (setErrors([]), setI(i - 1))}
          >
            {t('ui.stepper.back')}
          </button>
        )}
        {onSaveDraft && (
          <button type="button" className="ux4g-btn-text-primary ux4g-btn-m" onClick={onSaveDraft}>
            {t('ui.stepper.saveDraft')}
          </button>
        )}
        <span className="ux4g-flex-1" />
        {last ? (
          <button
            type="button"
            className="ux4g-btn-primary ux4g-btn-m"
            disabled={busy}
            aria-busy={busy}
            onClick={send}
          >
            {busy ? t('ui.stepper.sending') : (sendLabel ?? t('ui.stepper.send'))}
          </button>
        ) : (
          <button type="button" className="ux4g-btn-primary ux4g-btn-m" onClick={next}>
            {t('ui.stepper.next')}
          </button>
        )}
      </div>
    </form>
  );
}
