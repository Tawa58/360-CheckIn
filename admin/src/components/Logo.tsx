const LOCKUP = {
  color: '/brand/logo.png',
  light: '/brand/logo-light.png',
} as const;

const ALT = 'CheckIn360 — Smarter Workforce Management';

export function Logo({
  variant = 'color',
  className = '',
}: {
  /** `auto` follows the active theme: colour in light mode, white in dark mode. */
  variant?: 'color' | 'light' | 'auto';
  className?: string;
}) {
  if (variant === 'auto') {
    return (
      <>
        <img
          src={LOCKUP.color}
          alt={ALT}
          width={602}
          height={132}
          draggable={false}
          className={`${className} dark:hidden`}
        />
        <img
          src={LOCKUP.light}
          alt={ALT}
          width={602}
          height={132}
          draggable={false}
          className={`hidden ${className} dark:block`}
        />
      </>
    );
  }

  return (
    <img
      src={LOCKUP[variant]}
      alt={ALT}
      width={602}
      height={132}
      draggable={false}
      className={className}
    />
  );
}

export function LogoMark({className}: {className?: string}) {
  return (
    <img
      src="/brand/mark.png"
      alt=""
      aria-hidden
      width={113}
      height={124}
      draggable={false}
      className={className}
    />
  );
}
