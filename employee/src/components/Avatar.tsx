export function Avatar({
  name,
  photoUrl,
  size = 'md',
}: {
  name: string;
  photoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
  const box =
    size === 'lg' ? 'h-24 w-24 text-2xl' : size === 'sm' ? 'h-9 w-9 text-xs' : 'h-12 w-12 text-sm';

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt=""
        className={`${box} shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-slate-800`}
      />
    );
  }

  return (
    <span
      className={`${box} inline-flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-800 dark:bg-brand-500/20 dark:text-brand-200`}>
      {initials || '?'}
    </span>
  );
}
