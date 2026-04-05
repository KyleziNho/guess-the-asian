// Thin wrapper around the Vibration API (navigator.vibrate).
// Works on Android browsers + most Chromium. iOS Safari silently no-ops —
// which is fine, `navigator.vibrate` is speced to return false on unsupported
// hardware without throwing.
//
// Design: expose named presets instead of raw millisecond arrays so callers
// describe *what* they're reacting to, not *how* the buzz should feel. That
// keeps the vibration vocabulary consistent across the whole app.

type VibratePattern = number | number[];

// Presets — short, punchy, mobile-friendly. Keep each under ~120ms total so
// we never block subsequent events or feel laggy on devices with slower
// actuators.
export const HAPTIC_PRESETS = {
  // Tiny scroll/ratchet pulse. Used for incremental progress (count-ups,
  // bars filling, streak ticks). Must stay very short — this fires dozens
  // of times back-to-back during an animation.
  tick: 4,

  // Standard UI tap — any button press.
  tap: 10,

  // Slightly firmer confirmation for a committed action (picking an answer,
  // toggling ready, etc.).
  select: 16,

  // Snappy success chirp.
  success: [18, 40, 28] as number[],

  // Double-bump for mistakes — short enough to feel like a single "nope".
  error: [24, 50, 36] as number[],

  // Triumphant rolling pattern for victory screens.
  victory: [40, 60, 30, 60, 50] as number[],

  // Heavy thud for defeat / forfeit.
  defeat: [90, 40, 90] as number[],

  // Escalating pulse — used when a streak grows.
  streak: [12, 30, 22] as number[],

  // Broadcasty reaction sent/received.
  reaction: [8, 20, 8] as number[],

  // Connection events (join, disconnect, reconnect).
  join: [14, 30, 14] as number[],
  disconnect: [30, 60, 30, 60] as number[],

  // "Locked in, get ready" cue — used when a match is about to start.
  ready: [16, 60, 32] as number[],

  // Distinct heavy tap for the Begin/Play Again CTAs.
  heavy: 28,
} as const;

export type HapticPreset = keyof typeof HAPTIC_PRESETS;

// Cached support flag — checked once to avoid poking navigator every call.
let supported: boolean | null = null;

function isSupported(): boolean {
  if (supported !== null) return supported;
  if (typeof navigator === "undefined") {
    supported = false;
  } else {
    supported = typeof navigator.vibrate === "function";
  }
  return supported;
}

// User-toggleable kill switch. Respects stored preference + prefers-reduced-motion.
let userEnabled = true;
let reducedMotion = false;

if (typeof window !== "undefined") {
  try {
    const stored = localStorage.getItem("gta-haptics-enabled");
    if (stored === "false") userEnabled = false;
  } catch {
    /* ignore */
  }
  try {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion = mq.matches;
    mq.addEventListener?.("change", (e) => {
      reducedMotion = e.matches;
    });
  } catch {
    /* ignore */
  }
}

export function setHapticsEnabled(enabled: boolean): void {
  userEnabled = enabled;
  try {
    localStorage.setItem("gta-haptics-enabled", enabled ? "true" : "false");
  } catch {
    /* ignore */
  }
}

export function areHapticsEnabled(): boolean {
  return userEnabled && !reducedMotion && isSupported();
}

function safeVibrate(pattern: VibratePattern): void {
  if (!areHapticsEnabled()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore — user-activation restrictions, etc. */
  }
}

// Fire a preset by name.
export function haptic(preset: HapticPreset): void {
  safeVibrate(HAPTIC_PRESETS[preset] as VibratePattern);
}

// Fire a custom pattern (escape hatch — prefer named presets).
export function hapticPattern(pattern: VibratePattern): void {
  safeVibrate(pattern);
}

// Scrolling/ratcheting haptic — fires evenly-spaced ticks over a duration to
// accompany a filling bar or count-up. The pattern alternates [pulse, gap,
// pulse, gap, …] so each tick registers as a distinct bump.
//
// `duration` is the total animation length in ms. `ticks` is how many bumps
// to spread across it. Returns a cancel function the caller can invoke if
// the animation is aborted.
export function hapticScroll(duration: number, ticks: number): () => void {
  if (!areHapticsEnabled() || duration <= 0 || ticks <= 0) return () => {};
  // Build a pattern of [pulse, gap, pulse, gap, …] for `ticks` bumps.
  // Each pulse is very short so we don't sound like a buzzsaw; the gap fills
  // the rest of the slot.
  const slot = Math.max(16, Math.floor(duration / ticks));
  const pulse = Math.min(6, Math.max(3, Math.floor(slot * 0.25)));
  const gap = Math.max(1, slot - pulse);
  const pattern: number[] = [];
  for (let i = 0; i < ticks; i++) {
    pattern.push(pulse, gap);
  }
  safeVibrate(pattern);
  return () => {
    if (!isSupported()) return;
    try {
      navigator.vibrate(0);
    } catch {
      /* ignore */
    }
  };
}
