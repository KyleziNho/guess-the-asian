import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Person } from "../lib/types";
import { isImageCached, prioritizeImage } from "../lib/imageCache";

interface PhotoCardProps {
  person: Person;
  roundKey: number;
}

export function PhotoCard({ person, roundKey }: PhotoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(() => {
    const cached = isImageCached(person.image_url);
    // Not cached yet — the user is about to look at this one, so jump it to
    // the front of the background queue.
    if (!cached) prioritizeImage(person.image_url);
    return cached;
  });
  const [imageError, setImageError] = useState(false);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={roundKey}
        className="relative w-full h-full rounded-xl overflow-hidden bg-border"
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 skeleton" />
        )}

        {!imageError ? (
          <img
            src={person.image_url}
            alt="Who is this person?"
            className={`w-full h-full object-cover object-top transition-opacity duration-500 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface">
            <div className="text-center text-text-muted">
              <div className="text-4xl mb-3 opacity-40">?</div>
              <p className="text-xs">Photo unavailable</p>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
