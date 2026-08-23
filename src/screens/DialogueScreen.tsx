import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { Avatar } from "../components/Avatar";
import { BigButton, Eyebrow } from "../components/Chrome";
import type { HeroId } from "../game/types";
import { HEROES, heroById } from "../story/characters";
import { dialogueFor } from "../story/script";

export function DialogueScreen({
  levelId,
  hero,
  onContinue,
}: {
  levelId: number;
  hero: HeroId;
  onContinue: () => void;
}) {
  const pack = dialogueFor(levelId, hero);
  const [idx, setIdx] = useState(0);

  if (!pack || pack.lines.length === 0) {
    onContinue();
    return null;
  }

  const line = pack.lines[idx];
  const last = idx >= pack.lines.length - 1;
  const speaker =
    line.speaker === "you" ? heroById(hero) : heroById(line.speaker);
  const isYou = line.speaker === "you";

  return (
    <div className="aw-screen aw-dialogue">
      <div className="aw-dlg-head">
        <Eyebrow>уровень {levelId}</Eyebrow>
        <h2 className="aw-h2">{pack.title}</h2>
      </div>

      <div className="aw-dlg-stage">
        <div className="aw-dlg-cast">
          {HEROES.map((h) => (
            <div
              key={h.id}
              className={`aw-dlg-castitem ${speaker.id === h.id ? "is-speaking" : ""}`}
            >
              <Avatar hero={h} size={64} active={speaker.id === h.id} float={speaker.id === h.id} />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="aw-bubble"
            style={{ ["--acc" as string]: speaker.accentHex }}
          >
            <span className="aw-bubble-name">
              {isYou ? `${speaker.name} (ты)` : speaker.name}
            </span>
            <p className="aw-bubble-text">{line.text}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="aw-dlg-cta">
        <div className="aw-dlg-dots">
          {pack.lines.map((_, i) => (
            <span key={i} className={`aw-dot ${i === idx ? "on" : ""}`} />
          ))}
        </div>
        <BigButton
          onClick={() => (last ? onContinue() : setIdx((i) => i + 1))}
          color={speaker.accentHex}
        >
          {last ? "К уровню →" : "Дальше"}
        </BigButton>
      </div>
    </div>
  );
}
