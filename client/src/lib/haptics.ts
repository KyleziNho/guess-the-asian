// Cross-platform haptic feedback.
//
// Two backends are used depending on device:
//
//   • Android / Chromium mobile → `navigator.vibrate` (W3C Vibration API).
//     Requires sticky user activation, which any real button tap already
//     grants.
//
//   • iOS Safari (17.4+) → the `<input type="checkbox" switch>` +
//     `<label>` trick. Apple has never implemented `navigator.vibrate`,
//     so we exploit Safari's native "switch toggled" haptic: a hidden
//     label/switch pair is placed in the DOM, and calling `label.click()`
//     flips the switch which emits a Taptic Engine tap.
//     (WebKit only fires haptics when the switch is toggled via an
//     associated label click — clicking the input directly is ignored.)
//
// We expose named presets (tap, success, error, victory…) so callers
// describe *what* they're reacting to, not *how* the buzz should feel.
// The presets were originally tuned as Vibration API patterns; on iOS we
// translate each pattern into a sequence of label-clicks spaced at the
// same timings so multi-bump presets still feel distinct.

type VibratePattern = number | number[];

// Presets — short, punchy, mobile-friendly.
export const HAPTIC_PRESETS = {
  // Tiny scroll/ratchet pulse. Used for incremental progress bars and
  // count-ups. Fires dozens of times back-to-back so it must stay tiny.
  tick: 4,

  // Standard UI tap — any button press.
  tap: 10,

  // Slightly firmer confirmation for a committed action.
  select: 16,

  // Snappy success chirp.
  success: [18, 40, 28] as number[],

  // Double-bump for mistakes.
  error: [24, 50, 36] as number[],

  // Triumphant rolling pattern for victory screens.
  victory: [40, 60, 30, 60, 50] as number[],

  // Heavy thud for defeat / forfeit.
  defeat: [90, 40, 90] as number[],

  // Escalating pulse for streaks.
  streak: [12, 30, 22] as number[],

  // Reaction sent/received.
  reaction: [8, 20, 8] as number[],

  // Connection events.
  join: [14, 30, 14] as number[],
  disconnect: [30, 60, 30, 60] as number[],

  // "Locked in, get ready" cue for match start.
  ready: [16, 60, 32] as number[],

  // Distinct heavy tap for Begin/Play Again CTAs.
  heavy: 28,
} as const;

export type HapticPreset = keyof typeof HAPTIC_PRESETS;

// ─────────────────────────────────────────────────────────────────────────────
// Platform detection
// ─────────────────────────────────────────────────────────────────────────────

type Backend = "vibrate" | "ios-switch" | "none";

let backend: Backend | null = null;

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // Classic iOS detection + iPadOS 13+ which masquerades as Mac but has
  // touch support.
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isIPadOS =
    ua.includes("Mac") &&
    typeof document !== "undefined" &&
    "ontouchend" in document;
  return isIOS || isIPadOS;
}

function iosSupportsSwitchHaptic(): boolean {
  // The `switch` attribute on checkboxes shipped in Safari 17.4 (March
  // 2024) and haptic emission in iOS 18. We feature-test by checking if
  // the browser understands `:state(on)` or the `switch` IDL attribute.
  if (typeof document === "undefined") return false;
  try {
    const test = document.createElement("input");
    test.type = "checkbox";
    // Setting the attribute then reading it back: Safari accepts the
    // unknown attribute regardless, so we additionally probe iOS version.
    test.setAttribute("switch", "");
    // iOS version check — need 17.4+ for the attribute and 18+ for the
    // actual haptic. Rather than UA-sniff, we trust that any iOS device
    // running a Safari recent enough to have the attribute will deliver
    // haptics on tap; on 17.4–17.x the click still succeeds silently,
    // which is no worse than today.
    const match = navigator.userAgent.match(/OS (\d+)_(\d+)/i);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major > 17 || (major === 17 && minor >= 4)) return true;
      return false;
    }
    // iPadOS masquerading as Mac — assume recent.
    return true;
  } catch {
    return false;
  }
}

function pickBackend(): Backend {
  if (backend) return backend;
  if (typeof navigator === "undefined") {
    backend = "none";
    return backend;
  }
  if (typeof navigator.vibrate === "function") {
    // Android / Chromium. navigator.vibrate exists on desktop Chrome too
    // but just no-ops — that's fine.
    backend = "vibrate";
    return backend;
  }
  if (detectIOS() && iosSupportsSwitchHaptic()) {
    backend = "ios-switch";
    return backend;
  }
  backend = "none";
  return backend;
}

// ─────────────────────────────────────────────────────────────────────────────
// User preferences
// ─────────────────────────────────────────────────────────────────────────────

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
  return userEnabled && !reducedMotion && pickBackend() !== "none";
}

// ─────────────────────────────────────────────────────────────────────────────
// iOS switch-element setup
// ─────────────────────────────────────────────────────────────────────────────

// One reusable hidden label+switch pair lives in the DOM. Each haptic call
// fires `label.click()`, which toggles the switch and triggers a native
// iOS haptic. Pre-creating the pair avoids DOM churn on every press.
let iosLabel: HTMLLabelElement | null = null;

function ensureIOSSwitch(): HTMLLabelElement | null {
  if (typeof document === "undefined") return null;
  if (iosLabel && iosLabel.isConnected) return iosLabel;

  const label = document.createElement("label");
  // Completely off-screen, non-interactive from the user's side. The
  // element MUST remain in the DOM and be visible enough for WebKit to
  // treat the click as a real toggle — so we use visibility trickery
  // rather than `display:none`.
  label.setAttribute("aria-hidden", "true");
  label.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;" +
    "opacity:0;pointer-events:none;user-select:none;-webkit-user-select:none;";

  const input = document.createElement("input");
  input.type = "checkbox";
  input.setAttribute("switch", "");
  input.tabIndex = -1;
  input.setAttribute("aria-hidden", "true");
  input.style.cssText = "pointer-events:none;";

  label.appendChild(input);
  document.body.appendChild(label);

  iosLabel = label;
  return label;
}

function fireIOSHaptic(): void {
  const label = ensureIOSSwitch();
  if (!label) return;
  try {
    // Clicking the label flips the switch and triggers the native haptic.
    label.click();
  } catch {
    /* ignore */
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core dispatch
// ─────────────────────────────────────────────────────────────────────────────

// Track active timeout IDs so we can cancel in-flight patterns (used by
// `hapticScroll` when an animation is aborted early).
const activeTimers = new Set<number>();

function cancelAllPendingClicks(): void {
  for (const id of activeTimers) clearTimeout(id);
  activeTimers.clear();
}

// Convert a Vibration-API-style pattern (either a number or an
// alternating [vibrate, pause, vibrate, pause, …] array) into absolute
// click times. Vibrate phases are even indices (0, 2, 4…); pauses are odd.
function patternToClickOffsets(pattern: VibratePattern): number[] {
  if (typeof pattern === "number") return [0];
  const offsets: number[] = [];
  let t = 0;
  for (let i = 0; i < pattern.length; i++) {
    if (i % 2 === 0) {
      // vibrate phase — schedule a click at its start
      offsets.push(t);
      t += pattern[i];
    } else {
      // pause phase
      t += pattern[i];
    }
  }
  return offsets;
}

function dispatchVibrate(pattern: VibratePattern): void {
  try {
    navigator.vibrate(pattern);
  } catch {
    /* user-activation restrictions, etc. */
  }
}

function dispatchIOSPattern(pattern: VibratePattern): void {
  const offsets = patternToClickOffsets(pattern);
  // First click fires synchronously so it's inside the user-activation
  // window — important because the click() is initiated from a button
  // handler and iOS is strict about gesture attribution.
  fireIOSHaptic();
  for (let i = 1; i < offsets.length; i++) {
    const delay = offsets[i];
    const id = window.setTimeout(() => {
      activeTimers.delete(id);
      fireIOSHaptic();
    }, delay) as unknown as number;
    activeTimers.add(id);
  }
}

function safeBuzz(pattern: VibratePattern): void {
  if (!areHapticsEnabled()) return;
  const b = pickBackend();
  if (b === "vibrate") dispatchVibrate(pattern);
  else if (b === "ios-switch") dispatchIOSPattern(pattern);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

// Fire a preset by name.
export function haptic(preset: HapticPreset): void {
  safeBuzz(HAPTIC_PRESETS[preset] as VibratePattern);
}

// Fire a custom pattern (escape hatch — prefer named presets).
export function hapticPattern(pattern: VibratePattern): void {
  safeBuzz(pattern);
}

// Scrolling/ratcheting haptic — spreads `ticks` bumps across `duration`
// ms to accompany a filling bar or count-up. Returns a cancel function
// the caller invokes if the animation is aborted.
export function hapticScroll(duration: number, ticks: number): () => void {
  if (!areHapticsEnabled() || duration <= 0 || ticks <= 0) return () => {};
  const b = pickBackend();

  if (b === "vibrate") {
    const slot = Math.max(16, Math.floor(duration / ticks));
    const pulse = Math.min(6, Math.max(3, Math.floor(slot * 0.25)));
    const gap = Math.max(1, slot - pulse);
    const pattern: number[] = [];
    for (let i = 0; i < ticks; i++) pattern.push(pulse, gap);
    dispatchVibrate(pattern);
    return () => {
      try {
        navigator.vibrate(0);
      } catch {
        /* ignore */
      }
    };
  }

  if (b === "ios-switch") {
    // Schedule evenly-spaced clicks. iOS coalesces rapid taps into a
    // single buzz if spaced < ~25ms apart, so clamp to a floor.
    const spacing = Math.max(28, Math.floor(duration / ticks));
    const ids: number[] = [];
    for (let i = 0; i < ticks; i++) {
      const delay = i * spacing;
      if (i === 0) {
        fireIOSHaptic();
        continue;
      }
      const id = window.setTimeout(() => {
        fireIOSHaptic();
        activeTimers.delete(id);
      }, delay) as unknown as number;
      activeTimers.add(id);
      ids.push(id);
    }
    return () => {
      for (const id of ids) {
        clearTimeout(id);
        activeTimers.delete(id);
      }
    };
  }

  return () => {};
}

// Call this once after first user gesture to warm up the backend. Safe
// to call multiple times. Primes the iOS switch element so the very
// first tap doesn't pay the DOM-insert cost.
export function primeHaptics(): void {
  if (pickBackend() === "ios-switch") ensureIOSSwitch();
}

// Exposed for tests / debugging.
export function __getHapticBackend(): Backend {
  return pickBackend();
}

// Cancel any scheduled clicks (used by hapticScroll internally).
export function __cancelPending(): void {
  cancelAllPendingClicks();
}
