import { useRef, useState } from "react";
import { HEROES, type Hero } from "../story/characters";
import { COMBO_QUIPS, randomLine } from "../story/script";
import type { HeroId } from "../game/types";

export function useShiftTalk(selfId: HeroId) {
  const [line, setLine] = useState<{ speaker: Hero; text: string } | null>(null);
  const hide = useRef(0);
  const said = useRef(0);

  const say = (force = false) => {
    if (!force && said.current >= 3) return;
    if (!force && Math.random() > 0.45) return;
    said.current += 1;
    const others = HEROES.filter((h) => h.id !== selfId);
    const speaker = others[Math.floor(Math.random() * others.length)] ?? HEROES[0];
    const text = randomLine(COMBO_QUIPS[speaker.id], `mini-${speaker.id}`);
    setLine({ speaker, text });
    window.clearTimeout(hide.current);
    hide.current = window.setTimeout(() => setLine(null), 5200);
  };

  return { line, say };
}
