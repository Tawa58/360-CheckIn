export function Avatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md';
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
  const box = size === 'sm' ? 'h-9 w-9 text-xs' : 'h-10 w-10 text-sm';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name}
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
      />
    );
  }

  return (
    <span
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-full bg-brand-50 font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300`}>
      {initials || '?'}
    </span>
  );
}
