import {useEffect, type ReactNode} from 'react';
import {X} from 'lucide-react';

export function Modal({
  title,
  description,
  children,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-slate-950/50 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={event => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}>
      <div className="max-h-[92dvh] w-full max-w-md animate-sheet-up overflow-y-auto rounded-t-3xl bg-white shadow-float dark:bg-slate-900 sm:animate-slide-up sm:rounded-3xl">
        <div className="sticky top-0 z-10 rounded-t-3xl border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-slate-200 dark:bg-slate-700 sm:hidden" />
          <div className="flex items-start justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {title}
              </h2>
              {description ? (
                <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="px-5 pb-6 pt-5">{children}</div>
      </div>
    </div>
  );
}
