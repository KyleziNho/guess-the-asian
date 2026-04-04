import { motion } from "framer-motion";
import type { PlayerProfile } from "../../lib/multiplayerTypes";
import {
  AVATARS,
  COLOR_THEMES,
  getColorTheme,
} from "../../lib/multiplayerConstants";

interface ProfileEditorProps {
  profile: PlayerProfile;
  onChange: (next: PlayerProfile) => void;
  compact?: boolean;
}

export function ProfileEditor({
  profile,
  onChange,
  compact = false,
}: ProfileEditorProps) {
  const theme = getColorTheme(profile.color);

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Identity orb + name input */}
      <div className="flex items-center gap-3">
        <div
          className={`${
            compact ? "w-14 h-14 text-[32px]" : "w-[72px] h-[72px] text-[42px]"
          } rounded-full flex items-center justify-center flex-shrink-0`}
          style={{
            background: `radial-gradient(circle at 35% 30%, ${theme.base}40, ${theme.dim}22 55%, transparent 90%)`,
            border: `2px solid ${theme.base}`,
            boxShadow: `0 0 20px ${theme.glow}, inset 0 2px 0 rgba(245,237,220,0.12)`,
          }}
        >
          <span className="leading-none select-none">{profile.avatar}</span>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label
            className="text-[9px] tracking-[0.25em] uppercase font-semibold"
            style={{
              color: "rgba(245, 237, 220, 0.6)",
              textShadow: "0 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            Your Name
          </label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              onChange({ ...profile, name: e.target.value.slice(0, 16) })
            }
            maxLength={16}
            className="w-full h-10 rounded-lg px-3 font-serif text-[15px] font-bold outline-none"
            style={{
              background: "rgba(20, 14, 8, 0.72)",
              border: `1.5px solid ${theme.base}55`,
              color: theme.base,
              textShadow: "0 1px 3px rgba(0,0,0,0.6)",
              boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 0 0 ${theme.glow}`,
              transition: "box-shadow 0.2s ease, border-color 0.2s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 12px ${theme.glow}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = `inset 0 1px 3px rgba(0,0,0,0.5), 0 0 0 0 ${theme.glow}`;
            }}
            placeholder="Enter name…"
          />
        </div>
      </div>

      {/* Avatar grid */}
      <div className="flex flex-col gap-2">
        <p
          className="text-[9px] tracking-[0.25em] uppercase font-semibold"
          style={{
            color: "rgba(245, 237, 220, 0.6)",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          Choose Your Avatar
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {AVATARS.map((emoji) => {
            const selected = profile.avatar === emoji;
            return (
              <motion.button
                key={emoji}
                onClick={() => onChange({ ...profile, avatar: emoji })}
                className="aspect-square rounded-lg flex items-center justify-center text-[22px] cursor-pointer"
                style={{
                  background: selected
                    ? `radial-gradient(circle at 35% 30%, ${theme.base}35, ${theme.dim}18 60%, transparent 95%)`
                    : "rgba(30, 22, 14, 0.65)",
                  border: `1.5px solid ${
                    selected ? theme.base : "rgba(221, 176, 124, 0.2)"
                  }`,
                  boxShadow: selected
                    ? `0 0 14px ${theme.glow}, inset 0 1px 0 rgba(245,237,220,0.08)`
                    : "inset 0 1px 0 rgba(245,237,220,0.04)",
                  transition:
                    "border-color 0.18s ease, box-shadow 0.18s ease, background 0.18s ease",
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                <span className="leading-none">{emoji}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Color picker */}
      <div className="flex flex-col gap-2">
        <p
          className="text-[9px] tracking-[0.25em] uppercase font-semibold"
          style={{
            color: "rgba(245, 237, 220, 0.6)",
            textShadow: "0 1px 3px rgba(0,0,0,0.7)",
          }}
        >
          Your Color
        </p>
        <div className="grid grid-cols-6 gap-1.5">
          {COLOR_THEMES.map((c) => {
            const selected = profile.color === c.id;
            return (
              <motion.button
                key={c.id}
                onClick={() => onChange({ ...profile, color: c.id })}
                aria-label={c.label}
                className="aspect-square rounded-lg cursor-pointer relative"
                style={{
                  background: `radial-gradient(circle at 40% 35%, ${c.base}, ${c.dim})`,
                  border: `1.5px solid ${
                    selected ? "#F5EDDC" : "rgba(28, 17, 8, 0.5)"
                  }`,
                  boxShadow: selected
                    ? `0 0 16px ${c.glow}, inset 0 1px 0 rgba(245,237,220,0.25)`
                    : "inset 0 1px 0 rgba(245,237,220,0.12), 0 2px 6px rgba(0,0,0,0.4)",
                  transition: "box-shadow 0.18s ease, border-color 0.18s ease",
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
              >
                {selected && (
                  <motion.div
                    layoutId="color-selected"
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                      border: "1.5px solid rgba(245,237,220,0.9)",
                      boxShadow: `0 0 12px ${c.glow}`,
                    }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
