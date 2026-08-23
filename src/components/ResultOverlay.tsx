import { AnimatePresence, motion } from "framer-motion";
import { Star } from "@phosphor-icons/react";

export function ResultOverlay({
  win,
  stars,
  heroLine,
  accent,
  onNext,
  onRetry,
  onExit,
}: {
  win: boolean;
  stars: number;
  heroLine: string;
  accent: string;
  onNext: () => void;
  onRetry: () => void;
  onExit: () => void;
}) {
  const confettiColors = ["#FF4E6A", "#FFC531", "#24D0C4", "#9B6DFF", "#6FE04B"];
  return (
    <AnimatePresence>
      <motion.div
        className="aw-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {win &&
          Array.from({ length: 28 }).map((_, i) => (
            <motion.span
              key={i}
              className="aw-confetti"
              style={{
                background: confettiColors[i % confettiColors.length],
                left: `${(i * 37) % 100}%`,
              }}
              initial={{ y: -40, opacity: 1, rotate: 0 }}
              animate={{ y: "110vh", opacity: 0, rotate: 360 }}
              transition={{ duration: 1.6 + (i % 5) * 0.2, delay: (i % 7) * 0.05 }}
            />
          ))}
        <motion.div
          className="aw-result"
          initial={{ scale: 0.6, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
          style={{ ["--acc" as string]: accent }}
        >
          <h2 className="aw-result-title">{win ? "Шоу удалось!" : "Не досветили"}</h2>
          {win && (
            <div className="aw-stars">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className={`aw-star ${i < stars ? "on" : ""}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 300 }}
                >
                  <Star weight={i < stars ? "fill" : "regular"} />
                </motion.span>
              ))}
            </div>
          )}
          <p className="aw-result-line">{heroLine}</p>
          <div className="aw-result-cta">
            {win ? (
              <button className="aw-big" style={{ ["--btn" as string]: accent }} onClick={onNext}>
                Дальше
              </button>
            ) : (
              <button className="aw-big" style={{ ["--btn" as string]: accent }} onClick={onRetry}>
                Ещё раз
              </button>
            )}
            <button className="aw-pill" onClick={onExit}>
              На склад
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
