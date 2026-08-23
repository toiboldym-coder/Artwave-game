import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "../components/Avatar";
import { BlastBoard, type BoardEffect } from "../components/BlastBoard";
import { CubeFace } from "../components/Cube";
import { ResultOverlay } from "../components/ResultOverlay";
import { duckBed, sfx } from "../audio/sfx";
import { BoosterBar } from "../components/BoosterBar";
import { boosterHintFor, heroById } from "../story/characters";
import { adjacent, boosterSwap, createSwapGrid, swapCells } from "../game/swap";
import { levelById } from "../game/levels";
import { type Color, type Grid } from "../game/types";
import { CueGame } from "../minigames/CueGame";
import { RideGame } from "../minigames/RideGame";
import { WallGame } from "../minigames/WallGame";
import type { SaveState } from "../state/store";
import {
  COMBO_LINES,
  COMBO_QUIPS,
  LOSE_LINES,
  WIN_LINES,
  randomLine,
} from "../story/script";

export function LevelScreen({
  levelId,
  save,
  onWin,
  onExit,
  onSpendBooster,
}: {
  levelId: number;
  save: SaveState;
  onWin: (stars: number) => void;
  onExit: () => void;
  onSpendBooster: (id: NonNullable<SaveState["hero"]>) => void;
}) {
  const level = levelById(levelId);
  if (level.kind === "ride")
    return <RideGame level={level} save={save} onWin={onWin} onExit={onExit} onSpendBooster={onSpendBooster} />;
  if (level.kind === "cue")
    return <CueGame level={level} save={save} onWin={onWin} onExit={onExit} onSpendBooster={onSpendBooster} />;
  if (level.kind === "wall")
    return <WallGame level={level} save={save} onWin={onWin} onExit={onExit} onSpendBooster={onSpendBooster} />;
  return (
    <SwapLevel
      levelId={levelId}
      save={save}
      onWin={onWin}
      onExit={onExit}
      onSpendBooster={onSpendBooster}
    />
  );
}

function SwapLevel({
  levelId,
  save,
  onWin,
  onExit,
  onSpendBooster,
}: {
  levelId: number;
  save: SaveState;
  onWin: (stars: number) => void;
  onExit: () => void;
  onSpendBooster: (id: NonNullable<SaveState["hero"]>) => void;
}) {
  const level = levelById(levelId);
  const hero = heroById(save.hero ?? "aidar");
  const boosterCount = save.hero ? save.boosters[save.hero] : 0;

  const [grid, setGrid] = useState<Grid>(() =>
    createSwapGrid(level.size, level.colors, level.seedPowers, level.seedCrates),
  );
  const [moves, setMoves] = useState(level.moves);
  const [progress, setProgress] = useState<Partial<Record<Color, number>>>({});
  const [effect, setEffect] = useState<BoardEffect | null>(null);
  const [status, setStatus] = useState<"play" | "win" | "lose">("play");
  const [combo, setCombo] = useState<string | null>(null);
  const [quip, setQuip] = useState<string | null>(null);
  const [picked, setPicked] = useState<{ r: number; c: number } | null>(null);
  const [impact, setImpact] = useState(1);
  const nonce = useRef(0);
  const lock = useRef(false);
  const hideCombo = useRef(0);
  const hideQuip = useRef(0);

  const isWin = (prog: Partial<Record<Color, number>>) =>
    level.goals.every((g) => (prog[g.color] || 0) >= g.need);

  useEffect(() => {
    duckBed();
  }, []);

  useEffect(() => {
    if (status !== "play") return;
    if (isWin(progress)) setStatus("win");
    else if (moves <= 0) setStatus("lose");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, moves, status]);

  const flashCombo = (text?: string) => {
    const line = text ?? randomLine(COMBO_LINES, "combo");
    const joke = randomLine(COMBO_QUIPS[hero.id], `quip-${hero.id}`);
    setCombo(line);
    setQuip(joke);
    window.clearTimeout(hideCombo.current);
    window.clearTimeout(hideQuip.current);
    hideCombo.current = window.setTimeout(() => setCombo(null), 2400);
    hideQuip.current = window.setTimeout(
      () => setQuip(null),
      Math.min(8000, Math.max(5200, 2600 + joke.length * 50)),
    );
  };

  const commit = (
    res: NonNullable<ReturnType<typeof swapCells>>,
    costMove: boolean,
  ) => {
    nonce.current += 1;
    const hit = res.blasts.length ? 3 : res.combo >= 3 || res.cleared.length >= 8 ? 3 : res.combo >= 2 ? 2 : 1;
    setImpact(hit);
    setGrid(res.grid);
    setEffect({ nonce: nonce.current, cleared: res.cleared, blasts: res.blasts });
    sfx.match(hit);
    if (res.combo >= 2) sfx.cascade(res.combo);
    if (res.blasts.length) sfx.blast();
    if (res.combo >= 2 || res.blasts.length || res.cleared.length >= 6) flashCombo();
    setProgress((prev) => {
      const np = { ...prev };
      for (const key of Object.keys(res.collected) as Color[])
        np[key] = (np[key] || 0) + (res.collected[key] || 0);
      return np;
    });
    if (costMove) setMoves((m) => m - 1);
  };

  const onTap = (r: number, c: number) => {
    if (status !== "play" || lock.current) return;
    if (!grid[r]?.[c]) return;
    if (!picked) {
      sfx.tap();
      setPicked({ r, c });
      return;
    }
    if (picked.r === r && picked.c === c) {
      setPicked(null);
      return;
    }
    const res = swapCells(grid, picked, { r, c }, level.colors, !!level.specials);
    setPicked(null);
    if (!res) {
      if (adjacent(picked, { r, c })) sfx.miss();
      else sfx.tap();
      setPicked({ r, c });
      return;
    }
    lock.current = true;
    window.setTimeout(() => (lock.current = false), 160);
    commit(res, true);
  };

  const useBooster = () => {
    if (status !== "play" || boosterCount <= 0 || !save.hero) return;
    if (hero.id === "adil") {
      setMoves((m) => m + 5);
      sfx.booster();
      flashCombo("+5 ходов из воздуха!");
      onSpendBooster(save.hero);
      return;
    }
    const res = boosterSwap(grid, hero.id, level.colors);
    if (!res) return;
    lock.current = true;
    window.setTimeout(() => (lock.current = false), 160);
    commit(res, false);
    sfx.booster();
    flashCombo(hero.id === "aidar" ? "СВЕТ ПОШЁЛ!" : "ЭКРАН СОБРАН!");
    onSpendBooster(save.hero);
  };

  const reset = () => {
    setGrid(createSwapGrid(level.size, level.colors, level.seedPowers, level.seedCrates));
    setMoves(level.moves);
    setProgress({});
    setStatus("play");
    setEffect(null);
    setCombo(null);
    setQuip(null);
    window.clearTimeout(hideCombo.current);
    window.clearTimeout(hideQuip.current);
    setPicked(null);
    nonce.current = 0;
  };

  const stars =
    moves >= level.moves * 0.4 ? 3 : moves >= level.moves * 0.15 ? 2 : 1;

  return (
    <div className="aw-screen aw-level" style={{ ["--acc" as string]: hero.accentHex }}>
      <header className="aw-lvl-head">
        <button className="aw-back" onClick={onExit}>
          ←
        </button>
        <div className="aw-lvl-title">
          <span className="mono aw-eyebrow">три в ряд · уровень {level.id}</span>
          <span className="aw-lvl-name">{level.title}</span>
        </div>
        <div className="aw-moves">
          <span className="aw-moves-num">{Math.max(0, moves)}</span>
          <span className="aw-moves-label">ходов</span>
        </div>
      </header>

      <div className="aw-goals">
        {level.goals.map((g) => {
          const got = progress[g.color] || 0;
          const remain = Math.max(0, g.need - got);
          return (
            <div key={g.color} className="aw-goal">
              <CubeFace color={g.color} power={null} size={26} />
              <motion.span
                key={remain}
                initial={{ scale: 1.4 }}
                animate={{ scale: 1 }}
                className="aw-goal-num"
              >
                {remain === 0 ? "ок" : remain}
              </motion.span>
            </div>
          );
        })}
      </div>

      <div className="aw-board-wrap">
        <BlastBoard
          grid={grid}
          onTap={onTap}
          effect={effect}
          disabled={status !== "play"}
          selected={picked}
          impact={impact}
        />
      </div>
      <div className="aw-table-talk">
        {combo && <div className="aw-combo">{combo}</div>}
        {quip && (
          <div className="aw-quip">
            <Avatar hero={hero} size={40} float={false} />
            <p>
              <b>{hero.name}</b>
              {quip}
            </p>
          </div>
        )}
      </div>

      <BoosterBar
        hero={hero}
        hint={boosterHintFor(hero.id, "swap")}
        count={boosterCount}
        onUse={useBooster}
      />

      {status !== "play" && (
        <ResultOverlay
          win={status === "win"}
          stars={stars}
          hero={hero}
          levelTitle={level.title}
          heroLine={
            status === "win"
              ? randomLine(WIN_LINES[hero.id], `win-${hero.id}`)
              : randomLine(LOSE_LINES[hero.id], `lose-${hero.id}`)
          }
          accent={hero.accentHex}
          onNext={() => onWin(stars)}
          onRetry={reset}
          onExit={onExit}
        />
      )}
    </div>
  );
}
