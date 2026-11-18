import {CheckCircle2} from 'lucide-react';

type CenterToastProps = {
  message: string;
};

export function CenterToast({message}: CenterToastProps) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-brand-900/50 px-6 backdrop-blur-sm">
      <div
        role="status"
        aria-live="polite"
        className="w-full max-w-sm rounded-3xl bg-white px-8 py-8 text-center shadow-float dark:border dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <p className="mt-4 text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
          {message}
        </p>
      </div>
    </div>
  );
}
