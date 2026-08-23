export type HeroId = "aidar" | "adil" | "artem";

export type Color = "red" | "amber" | "teal" | "violet" | "lime";

export type Power = "rocketH" | "rocketV" | "bomb" | "disco";

export type Screen =
  | "boot"
  | "select"
  | "map"
  | "dialogue"
  | "level"
  | "win"
  | "lose"
  | "polaroid"
  | "install";

export type LevelKind = "swap" | "ride" | "cue" | "wall";

export interface Cube {
  id: string;
  color: Color;
  power: Power | null;
  crate?: number;
}

export type Grid = (Cube | null)[][];

export interface Goal {
  color: Color;
  need: number;
}

export interface RideConfig {
  collect: number;
  hits: number;
  seconds: number;
  speed: number;
  theme: "day" | "city" | "rain";
}

export interface CueConfig {
  need: number;
  misses: number;
  tempo: number;
}

export interface WallConfig {
  cols: number;
  rows: number;
  needRows: number;
  dropMs: number;
}

export interface LevelDef {
  id: number;
  act: 1 | 2 | 3;
  kind: LevelKind;
  title: string;
  blurb: string;
  moves: number;
  size: number;
  colors: Color[];
  goals: Goal[];
  seedPowers?: number;
  seedCrates?: number;
  specials?: boolean;
  ride?: RideConfig;
  cue?: CueConfig;
  wall?: WallConfig;
}

export const COLOR_META: Record<
  Color,
  { name: string; fill: string; glow: string; deep: string; light: string }
> = {
  red: {
    name: "Микрофон",
    fill: "#FF4E6A",
    glow: "#FF9BB0",
    deep: "#B4123A",
    light: "#FFD3DC",
  },
  amber: {
    name: "Гитара",
    fill: "#FFC531",
    glow: "#FFE08A",
    deep: "#C98600",
    light: "#FFEFC0",
  },
  teal: {
    name: "Клавиши",
    fill: "#24D0C4",
    glow: "#8AF0E8",
    deep: "#0B857D",
    light: "#C4F6F1",
  },
  violet: {
    name: "Колонка",
    fill: "#9B6DFF",
    glow: "#C9AEFF",
    deep: "#5A2FBD",
    light: "#E4D6FF",
  },
  lime: {
    name: "Кабель",
    fill: "#6FE04B",
    glow: "#B4F59B",
    deep: "#369417",
    light: "#DAF9CC",
  },
};

export const ALL_COLORS: Color[] = ["red", "amber", "teal", "violet", "lime"];
