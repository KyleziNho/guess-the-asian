interface AnimatedBackgroundProps {
  blur?: number;
  darken?: number;
}

export function AnimatedBackground({
  blur = 0,
  darken = 0.2,
}: AnimatedBackgroundProps) {
  return (
    <div className="fixed inset-0 -z-10 bg-bg">
      <img
        src="/bg.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          filter: blur > 0 ? `blur(${blur}px)` : undefined,
          transform: blur > 0 ? "scale(1.08)" : undefined,
          transition: "filter 0.5s ease, transform 0.5s ease",
        }}
        draggable={false}
      />
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
