type BrandLoaderProps = {
  label?: string;
};

export function BrandLoader({label = 'Signing in…'}: BrandLoaderProps) {
  return (
    <div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-brand-900/85 px-6 backdrop-blur-sm"
      role="status"
      aria-live="polite">
      <div className="relative h-36 w-36">
        <svg
          className="absolute inset-0 h-full w-full animate-spin"
          viewBox="0 0 144 144"
          fill="none"
          aria-hidden>
          <circle
            cx="72"
            cy="72"
            r="58"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="7"
          />
          <circle
            cx="72"
            cy="72"
            r="58"
            stroke="#E36414"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="92 280"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <svg className="h-12 w-12" viewBox="0 0 80 110" aria-hidden>
            <path
              d="M40 2C22 2 8 16 8 34c0 25 32 74 32 74s32-49 32-74C72 16 58 2 40 2z"
              fill="#E36414"
            />
            <circle cx="40" cy="34" r="12" fill="#fff" />
          </svg>
          <span className="mt-1 text-lg font-bold tracking-[0.22em] text-white">360</span>
        </div>
      </div>
      <p className="mt-6 text-sm font-medium text-white/85">{label}</p>
    </div>
  );
}
