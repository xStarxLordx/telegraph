// The needle sweeps 240° (from -120° to +120°) on a log scale, full at 1000.
const SWEEP_DEGREES = 240;
const FULL_SCALE = 1000;

/** Needle angle in degrees for a count; 0° points straight up. */
export default function needleAngle(count) {
  const ratio = Math.min(1, Math.log10(Math.max(0, count) + 1) / Math.log10(FULL_SCALE + 1));
  return -SWEEP_DEGREES / 2 + ratio * SWEEP_DEGREES;
}
