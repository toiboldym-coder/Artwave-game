import type { Color, LevelDef } from "./types";

const A: Color[] = ["red", "amber", "teal", "violet"];
const B: Color[] = ["red", "amber", "teal", "violet", "lime"];
const C: Color[] = ["red", "amber", "teal", "violet", "lime"];

const swap = (
  partial: Omit<LevelDef, "kind" | "blurb"> & { blurb?: string },
): LevelDef => ({
  kind: "swap",
  blurb: partial.blurb ?? "Поменяй двух соседей — собери три в ряд",
  ...partial,
});

export const LEVELS: LevelDef[] = [
  swap({
    id: 1,
    act: 1,
    title: "Гараж Artwave",
    blurb: "Поменяй двух соседей — одна цель",
    moves: 30,
    size: 8,
    colors: A,
    goals: [{ color: "amber", need: 56 }],
  }),
  swap({
    id: 2,
    act: 1,
    title: "Первый скетч",
    blurb: "Появился кабель — пятый цвет",
    moves: 32,
    size: 8,
    colors: B,
    goals: [
      { color: "lime", need: 36 },
      { color: "amber", need: 40 },
    ],
  }),
  swap({
    id: 3,
    act: 1,
    title: "Не хватает кабеля",
    blurb: "Кейс клиента ломается от соседнего ряда",
    moves: 34,
    size: 8,
    colors: B,
    seedCrates: 2,
    goals: [
      { color: "teal", need: 40 },
      { color: "violet", need: 38 },
    ],
  }),
  {
    id: 4,
    act: 1,
    kind: "ride",
    title: "Со склада",
    blurb: "Погрузка: забери кабель, не поймай яму",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "lime", need: 12 }],
    ride: { collect: 12, hits: 3, seconds: 42, speed: 1, theme: "day" },
  },
  swap({
    id: 5,
    act: 1,
    title: "Первый выезд закрыт",
    moves: 34,
    size: 8,
    colors: B,
    specials: true,
    seedPowers: 1,
    goals: [
      { color: "teal", need: 42 },
      { color: "violet", need: 38 },
      { color: "amber", need: 36 },
    ],
  }),
  swap({
    id: 6,
    act: 2,
    title: "Корпоратив",
    blurb: "Ящики ломаются от соседнего ряда",
    moves: 34,
    size: 8,
    colors: B,
    specials: true,
    seedCrates: 6,
    goals: [
      { color: "red", need: 46 },
      { color: "teal", need: 44 },
    ],
  }),
  {
    id: 7,
    act: 2,
    kind: "cue",
    title: "03:12 и лазеры",
    blurb: "Жми, когда луч в зоне",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "red", need: 14 }],
    cue: { need: 14, misses: 4, tempo: 1 },
  },
  {
    id: 8,
    act: 2,
    kind: "ride",
    title: "Логистика ада",
    blurb: "Два заказа, один фургон",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "lime", need: 16 }],
    ride: { collect: 16, hits: 3, seconds: 40, speed: 1.25, theme: "city" },
  },
  {
    id: 9,
    act: 2,
    kind: "wall",
    title: "Стена LED",
    blurb: "Урони кабинеты, собери ряды",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "teal", need: 4 }],
    wall: { cols: 4, rows: 6, needRows: 4, dropMs: 2400 },
  },
  swap({
    id: 10,
    act: 2,
    title: "Город наш",
    moves: 36,
    size: 8,
    colors: C,
    specials: true,
    seedPowers: 2,
    seedCrates: 8,
    goals: [
      { color: "red", need: 44 },
      { color: "amber", need: 44 },
      { color: "lime", need: 38 },
    ],
  }),
  swap({
    id: 11,
    act: 3,
    title: "Open-air",
    moves: 36,
    size: 8,
    colors: C,
    specials: true,
    seedCrates: 8,
    goals: [
      { color: "violet", need: 48 },
      { color: "teal", need: 46 },
    ],
  }),
  {
    id: 12,
    act: 3,
    kind: "ride",
    title: "Дождь пошёл",
    blurb: "Мокрый выезд, тот же кабель",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "lime", need: 18 }],
    ride: { collect: 18, hits: 2, seconds: 38, speed: 1.35, theme: "rain" },
  },
  {
    id: 13,
    act: 3,
    kind: "wall",
    title: "Гала-концерт",
    blurb: "Стена выше, время злее",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "teal", need: 5 }],
    wall: { cols: 5, rows: 7, needRows: 5, dropMs: 1900 },
  },
  {
    id: 14,
    act: 3,
    kind: "cue",
    title: "Синхрон",
    blurb: "Луч, пиксель, доля",
    moves: 0,
    size: 0,
    colors: A,
    goals: [{ color: "violet", need: 18 }],
    cue: { need: 18, misses: 3, tempo: 1.25 },
  },
  swap({
    id: 15,
    act: 3,
    title: "Большая волна",
    blurb: "Свап, ящики, спешлы",
    moves: 38,
    size: 8,
    colors: C,
    specials: true,
    seedPowers: 2,
    seedCrates: 8,
    goals: [
      { color: "red", need: 42 },
      { color: "amber", need: 42 },
      { color: "teal", need: 38 },
      { color: "violet", need: 36 },
    ],
  }),
];

export const levelById = (id: number) =>
  LEVELS.find((l) => l.id === id) ?? LEVELS[0];

export const TOTAL_LEVELS = LEVELS.length;

export const KIND_META: Record<
  LevelDef["kind"],
  { label: string; accent: string }
> = {
  swap: { label: "Три в ряд", accent: "#FF4E6A" },
  ride: { label: "Выезд", accent: "#6FE04B" },
  cue: { label: "Свет", accent: "#FFC531" },
  wall: { label: "LED", accent: "#24D0C4" },
};

export const ACTS: Record<1 | 2 | 3, { title: string; sub: string }> = {
  1: { title: "Акт 1", sub: "Гараж и первый выезд" },
  2: { title: "Акт 2", sub: "Корпоративы и стена LED" },
  3: { title: "Акт 3", sub: "Большая сцена" },
};
