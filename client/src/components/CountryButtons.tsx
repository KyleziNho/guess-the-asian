import { motion } from "framer-motion";
import { COUNTRY_MAP } from "../lib/constants";
import { haptic } from "../lib/haptics";

interface CountryButtonsProps {
  options: string[];
  onGuess: (country: string) => void;
  disabled: boolean;
  correctCountry?: string;
  guessedCountry?: string;
}

export function CountryButtons({
  options,
  onGuess,
  disabled,
  correctCountry,
  guessedCountry,
}: CountryButtonsProps) {
  const showResult = correctCountry !== undefined;

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((name) => {
        const flag = COUNTRY_MAP[name] ?? "";
        const isCorrect = showResult && name === correctCountry;
        const isWrongGuess =
          showResult &&
          name === guessedCountry &&
          guessedCountry !== correctCountry;
        const isDimmed = showResult && !isCorrect && !isWrongGuess;

        let borderColor = "rgba(221, 176, 124, 0.35)";
        let background =
          "linear-gradient(135deg, rgba(30,22,14,0.85), rgba(44,36,24,0.9))";
        let shadow =
          "inset 0 1px 0 rgba(245, 237, 220, 0.06), 0 2px 8px rgba(0,0,0,0.3)";

        if (isCorrect) {
          borderColor = "#5E8C61";
          background =
            "linear-gradient(135deg, rgba(94,140,97,0.28), rgba(94,140,97,0.15))";
          shadow =
            "0 0 20px rgba(94,140,97,0.35), inset 0 1px 0 rgba(94,140,97,0.2)";
        } else if (isWrongGuess) {
          borderColor = "#B85C5C";
          background =
            "linear-gradient(135deg, rgba(184,92,92,0.28), rgba(184,92,92,0.15))";
          shadow =
            "0 0 20px rgba(184,92,92,0.35), inset 0 1px 0 rgba(184,92,92,0.2)";
        }

        const interactive = !showResult && !disabled;

        return (
          <motion.button
            key={name}
            onClick={() => {
              haptic("select");
              onGuess(name);
            }}
            disabled={disabled}
            className="relative flex flex-col items-center justify-center gap-1 h-[60px] rounded-xl
                       cursor-pointer disabled:cursor-not-allowed"
            style={{
              background,
              border: `1.5px solid ${borderColor}`,
              boxShadow: shadow,
              textShadow: "0 1px 3px rgba(0, 0, 0, 0.5)",
              transition:
                "border-color 0.25s ease, box-shadow 0.25s ease, opacity 0.25s ease",
              opacity: isDimmed ? 0.3 : 1,
            }}
            whileHover={interactive ? { scale: 1.03 } : undefined}
            whileTap={interactive ? { scale: 0.96 } : undefined}
          >
            <span className="text-2xl leading-none">{flag}</span>
            <span className="text-[12px] font-semibold tracking-wide text-parchment-solid leading-none">
              {name}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
