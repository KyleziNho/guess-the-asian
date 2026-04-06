import { useState } from "react";

// Tiny (98B) blurred placeholder — renders instantly while the real image loads.
const LQIP =
  "data:image/webp;base64,UklGRloAAABXRUJQVlA4IE4AAADQAwCdASoYAAsAPu1orU2ppqSiMAgBMB2JQBOgA8IXQbcoCpxFIwAA/NO78/+OJgws5U524QQlJj0Shs2NhKfeoVyIpFL4Us6Yo1hAAAA=";

interface AnimatedBackgroundProps {
  blur?: number;
  darken?: number;
}

export function AnimatedBackground({
  blur = 0,
  darken = 0.2,
}: AnimatedBackgroundProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    // `.anim-bg-fill` resolves to the largest possible viewport on every
    // browser (100lvh / 100dvh / 100vh fallback chain), so the background
    // reaches edge-to-edge on iOS Safari — even underneath the status bar
    // and the URL bar.
    <div className="anim-bg-fill fixed top-0 left-0 -z-10 bg-bg">
      {/* LQIP — always visible underneath, paints on first frame. */}
      <img
        src={LQIP}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: "blur(20px)",
          transform: "scale(1.15)",
        }}
        draggable={false}
      />

      {/* Real image — mobile gets a 147KB portrait-cropped WebP, desktop
          gets the 337KB landscape one, with a JPEG fallback for very old
          browsers. Fades in once decoded. */}
      <picture>
        <source
          media="(max-width: 768px)"
          srcSet="/bg-mobile.webp"
          type="image/webp"
        />
        <source srcSet="/bg.webp" type="image/webp" />
        <img
          src="/bg.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            opacity: loaded ? 1 : 0,
            filter: blur > 0 ? `blur(${blur}px)` : undefined,
            transform: blur > 0 ? "scale(1.08)" : undefined,
            transition:
              "opacity 0.5s ease, filter 0.5s ease, transform 0.5s ease",
          }}
          draggable={false}
        />
      </picture>

      <div
        className="absolute inset-0"
        style={{
          background: `rgba(44, 36, 24, ${darken})`,
          transition: "background 0.5s ease",
        }}
      />
    </div>
  );
}
