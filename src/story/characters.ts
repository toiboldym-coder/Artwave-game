import { asset } from "../asset";
import type { Color, HeroId } from "../game/types";

export interface Hero {
  id: HeroId;
  name: string;
  latin: string;
  role: string;
  tagline: string;
  booster: string;
  boosterHint: string;
  accent: Color;
  accentHex: string;
  instagram: string;
  photo: string;
  frames?: string[];
  objectPos: string;
  emojiVibe: string;
}

export const HEROES: Hero[] = [
  {
    id: "aidar",
    name: "Айдар",
    latin: "AIDAR",
    role: "Свет · сцены · футажи",
    tagline: "Рисует сцену на салфетке и ставит луч так, что зал забывает дышать.",
    booster: "Поставить свет",
    boosterHint: "Ракета сносит целый ряд",
    accent: "amber",
    accentHex: "#FFC531",
    instagram: "ihsan_aidar",
    photo: asset("portraits/aidar-hall.jpg"),
    frames: [asset("portraits/aidar-hall.jpg"), asset("portraits/aidar-steps.jpg")],
    objectPos: "50% 18%",
    emojiVibe: "художник с диммером",
  },
  {
    id: "adil",
    name: "Адиль",
    latin: "ADIL",
    role: "Договоры · люди · деньги",
    tagline: "Достанет заказ из воздуха и три метра кабеля из ниоткуда. Почти.",
    booster: "Закрыть договор",
    boosterHint: "+5 ходов из воздуха",
    accent: "red",
    accentHex: "#FF4E6A",
    instagram: "adil_temerzhanov",
    photo: asset("portraits/adil.jpg"),
    frames: [asset("portraits/adil.jpg"), asset("portraits/adil-profile.jpg")],
    objectPos: "50% 16%",
    emojiVibe: "переговорщик на созвоне",
  },
  {
    id: "artem",
    name: "Артём",
    latin: "ARTEM",
    role: "LED · контент · сборка",
    tagline: "Соберёт стену из пикселей и запустит на ней то, что вы не заказывали.",
    booster: "Собрать экран",
    boosterHint: "Дискошар сносит целый цвет",
    accent: "teal",
    accentHex: "#24D0C4",
    instagram: "_babybelial_",
    photo: asset("portraits/artem-pug.jpg"),
    frames: [asset("portraits/artem-pug.jpg"), asset("portraits/artem-suit.jpg")],
    objectPos: "50% 22%",
    emojiVibe: "повелитель кабинетов",
  },
];

export const heroById = (id: HeroId) => HEROES.find((h) => h.id === id)!;
