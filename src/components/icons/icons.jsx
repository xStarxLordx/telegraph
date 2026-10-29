// Stroke icons on a 24 px grid, 1.8 px stroke (docs/design-system.md). They draw with
// `currentColor`, so the parent's color token decides how they look, and are hidden from
// assistive technology: the control that contains an icon carries the accessible name.
import PropTypes from 'prop-types';

function StrokeIcon({ children, size = 20, strokeWidth = 1.8 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

StrokeIcon.propTypes = {
  children: PropTypes.node.isRequired,
  size: PropTypes.number,
  strokeWidth: PropTypes.number,
};

export function SunIcon() {
  return (
    <StrokeIcon strokeWidth={2}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
    </StrokeIcon>
  );
}

export function MoonIcon() {
  return (
    <StrokeIcon strokeWidth={2}>
      <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" />
    </StrokeIcon>
  );
}

export function HomeIcon() {
  return (
    <StrokeIcon>
      <path d="M3 11l9-7 9 7v9h-6v-6H9v6H3z" />
    </StrokeIcon>
  );
}

export function FeedIcon() {
  return (
    <StrokeIcon>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </StrokeIcon>
  );
}

export function TweetsIcon() {
  return (
    <StrokeIcon>
      <path d="M4 5h16v11H9l-5 4z" />
    </StrokeIcon>
  );
}

export function FollowingIcon() {
  return (
    <StrokeIcon>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M17 8h5M19.5 5.5v5" />
    </StrokeIcon>
  );
}

export function FollowersIcon() {
  return (
    <StrokeIcon>
      <circle cx="9" cy="8" r="3.5" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 14.5c2.6 0 4.6 1.6 5.5 4.5" />
    </StrokeIcon>
  );
}

export function PenIcon() {
  return (
    <StrokeIcon size={18} strokeWidth={2.2}>
      <path d="M4 20l4-1 11-11-3-3L5 16z" />
    </StrokeIcon>
  );
}

export function GoogleIcon() {
  return (
    <StrokeIcon size={18} strokeWidth={2.2}>
      <path d="M20.5 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h4.8a4.2 4.2 0 0 1-1.8 2.7" />
      <path d="M15 16.6A7.5 7.5 0 1 1 17.1 6.7" />
    </StrokeIcon>
  );
}

export function LogoutIcon() {
  return (
    <StrokeIcon size={18}>
      <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
    </StrokeIcon>
  );
}

/** The Telegraph gear. `size` in px; decorative unless a label is given by the parent. */
export function GearIcon({ size = 36, hubWidth = 2.5 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="24" cy="24" r="17" strokeWidth="7" strokeDasharray="4.4 3.6" />
      <circle cx="24" cy="24" r="12" strokeWidth={hubWidth} />
      <circle cx="24" cy="24" r="4" strokeWidth={hubWidth} />
    </svg>
  );
}

GearIcon.propTypes = {
  size: PropTypes.number,
  hubWidth: PropTypes.number,
};
