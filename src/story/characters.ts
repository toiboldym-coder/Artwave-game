import { asset } from "../asset";
import type { Color, HeroId, LevelKind } from "../game/types";

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
    role: "Поставит свет, от которого зал молчит",
    tagline:
      "Нарисует сцену на салфетке и соберёт её так, что выход забудут искать. Луч ляжет туда, куда он сказал — даже если прибора три.",
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
    role: "Закроет заказ, за который никто не садится",
    tagline:
      "Достанет деньги и договорится даже с тем клиентом, с которым остальные уже не берут трубку. Договор — следствие. Человек — причина.",
    booster: "Закрыть заказ",
    boosterHint: "+5 ходов из воздуха",
    accent: "red",
    accentHex: "#FF4E6A",
    instagram: "adil_temerzhanov",
    photo: asset("portraits/adil-suit.jpg"),
    frames: [asset("portraits/adil-suit.jpg"), asset("portraits/adil-gym.jpg")],
    objectPos: "50% 14%",
    emojiVibe: "переговорщик на созвоне",
  },
  {
    id: "artem",
    name: "Артём",
    latin: "ARTEM",
    role: "Соберёт картинку, которой ещё нет",
    tagline:
      "Поставит стену из кабинетов и запустит на ней то, что потом все будут просить на повтор. Ровно, в срок, даже если кабель короче на три метра.",
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

export function boosterHintFor(id: HeroId, kind: LevelKind) {
  if (id === "aidar") {
    if (kind === "ride") return "Ямы вспыхнут на три секунды";
    if (kind === "cue") return "Следующий луч сам попадёт";
    if (kind === "wall") return "Нижний ряд соберётся сам";
    return "Ракета сносит целый ряд";
  }
  if (id === "adil") {
    if (kind === "ride") return "+7 секунд в договоре";
    if (kind === "cue") return "Один промах спишем со сметы";
    if (kind === "wall") return "Клиент подождёт автосброс";
    return "+5 ходов из воздуха";
  }
  if (kind === "ride") return "Кабели сами в кузов";
  if (kind === "cue") return "Снять все лучи в одной колонке";
  if (kind === "wall") return "Кабинет встанет куда надо";
  return "Дискошар сносит целый цвет";
}
