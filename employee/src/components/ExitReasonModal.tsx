import {useEffect, type FormEvent} from 'react';
import {createPortal} from 'react-dom';
import {Clock3, Loader2, MapPinOff, X} from 'lucide-react';
import {EXIT_REASONS} from '@shared/types';

type Props = {
  secondsOutside: string;
  leftAt: string;
  reason: string;
  reasonNote: string;
  reasonSaving: boolean;
  reasonError: string;
  onReasonChange: (value: string) => void;
  onReasonNoteChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onClose: () => void;
  firstName: string;
};

export function ExitReasonModal({
  secondsOutside,
  leftAt,
  reason,
  reasonNote,
  reasonSaving,
  reasonError,
  onReasonChange,
  onReasonNoteChange,
  onSubmit,
  onClose,
  firstName,
}: Props) {
  useEffect(() => {
    const html = document.documentElement;
    const previousHtmlOverflow = html.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    html.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exit-reason-title"
      className="fixed inset-x-4 top-24 z-[60] mx-auto max-w-lg min-h-[26.4rem] animate-slide-up rounded-[1.75rem] bg-white px-5 pb-[3.6rem] pt-5 shadow-float ring-1 ring-slate-200/80 dark:bg-slate-900 dark:ring-slate-700">
      <form onSubmit={onSubmit}>
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
            <MapPinOff className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-rose-500">
              Outside premises
            </p>
            <h2
              id="exit-reason-title"
              className="mt-0.5 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
              {firstName}, why did you leave?
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-slate-50 px-3 py-3.5 dark:bg-slate-800/80">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              <Clock3 className="h-3 w-3" />
              Time out
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {secondsOutside}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-3 py-3.5 dark:bg-slate-800/80">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Left at
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
              {leftAt}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          {EXIT_REASONS.map(option => {
            const selected = reason === option;
            return (
              <button
                key={option}
                type="button"
                onClick={() => onReasonChange(option)}
                className={`min-h-[52px] rounded-2xl px-3 text-sm font-medium transition ${
                  selected
                    ? 'bg-brand-800 text-white shadow-sm dark:bg-brand-600'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}>
                {option}
              </button>
            );
          })}
        </div>

        {reason ? (
          <textarea
            rows={3}
            wrap="soft"
            className="field-input mt-3 min-h-[5.5rem] resize-none overflow-hidden break-words [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            placeholder={reason === 'Other' ? 'Enter reason' : 'Extra detail (optional)'}
            value={reasonNote}
            onChange={event => {
              const field = event.currentTarget;
              field.style.height = 'auto';
              field.style.height = `${field.scrollHeight}px`;
              onReasonNoteChange(event.target.value);
            }}
          />
        ) : null}

        {reasonError ? (
          <p className="mt-3 text-sm text-red-600 dark:text-red-300">{reasonError}</p>
        ) : null}

        <button
          type="submit"
          className="btn-primary mt-5 w-full"
          disabled={reasonSaving || !reason || (reason === 'Other' && !reasonNote.trim())}>
          {reasonSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {reasonSaving ? 'Saving…' : 'Submit reason'}
        </button>
      </form>
    </div>,
    document.body,
  );
}
