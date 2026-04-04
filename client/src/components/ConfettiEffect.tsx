import { useState, useEffect } from "react";
import ReactConfetti from "react-confetti";

interface ConfettiEffectProps {
  fire: boolean;
}

export function ConfettiEffect({ fire }: ConfettiEffectProps) {
  const [show, setShow] = useState(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (fire) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
  }, [fire]);

  if (!show) return null;

  return (
    <ReactConfetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={100}
      gravity={0.2}
      colors={["#C4935A", "#5E8C61", "#F5EDDC", "#4A7C72", "#D4C5AD", "#E8B4B8"]}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
        pointerEvents: "none",
      }}
    />
  );
}
