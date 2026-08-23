import type { HeroId, Screen } from "../game/types";
import { TOTAL_LEVELS } from "../game/levels";
import { POLAROIDS } from "../story/script";

const KEY = "artwave-save-v3";

export interface SaveState {
  hero: HeroId | null;
  completed: number;
  boosters: Record<HeroId, number>;
  polaroids: string[];
  stars: number;
  bestStars: Record<number, number>;
}

const empty = (): SaveState => ({
  hero: null,
  completed: 0,
  boosters: { aidar: 2, adil: 2, artem: 2 },
  polaroids: [],
  stars: 0,
  bestStars: {},
});

export function loadSave(): SaveState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<SaveState>;
    return { ...empty(), ...parsed, bestStars: parsed.bestStars ?? {} };
  } catch {
    return empty();
  }
}

export function persist(save: SaveState) {
  localStorage.setItem(KEY, JSON.stringify(save));
}

export function nextLevel(save: SaveState) {
  return Math.min(save.completed + 1, TOTAL_LEVELS);
}

export function applyWin(
  save: SaveState,
  levelId: number,
  earnedStars: number,
): { save: SaveState; unlockedPolaroid: string | null } {
  const firstClear = levelId > save.completed;
  const completed = Math.max(save.completed, levelId);
  const prevBest = save.bestStars[levelId] ?? 0;
  const polaroid = POLAROIDS.find((p) => p.afterLevel === levelId);
  const isNewPolaroid = !!polaroid && !save.polaroids.includes(polaroid.id);
  const polaroids = isNewPolaroid
    ? [...save.polaroids, polaroid!.id]
    : save.polaroids;
  const boosters = { ...save.boosters };
  if (firstClear && save.hero) boosters[save.hero] += 1;
  if (earnedStars === 3 && prevBest < 3 && save.hero) boosters[save.hero] += 1;
  return {
    save: {
      ...save,
      completed,
      polaroids,
      boosters,
      bestStars: { ...save.bestStars, [levelId]: Math.max(prevBest, earnedStars) },
      stars: save.stars + Math.max(0, earnedStars - (firstClear ? 0 : prevBest)),
    },
    unlockedPolaroid: isNewPolaroid ? polaroid!.id : null,
  };
}

export type Route = Screen;
