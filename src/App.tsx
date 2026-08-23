import { useEffect, useState } from "react";
import type { HeroId, Screen } from "./game/types";
import { BootScreen } from "./screens/BootScreen";
import { CharacterSelectScreen } from "./screens/CharacterSelectScreen";
import { DialogueScreen } from "./screens/DialogueScreen";
import { InstallScreen } from "./screens/InstallScreen";
import { LevelScreen } from "./screens/LevelScreen";
import { MapScreen } from "./screens/MapScreen";
import { PolaroidScreen } from "./screens/PolaroidScreen";
import { unlockAudio } from "./audio/sfx";
import { applyWin, loadSave, persist, type SaveState } from "./state/store";
import { dialogueFor } from "./story/script";

export default function App() {
  const [save, setSave] = useState<SaveState>(() => loadSave());
  const [screen, setScreen] = useState<Screen>("boot");
  const [levelId, setLevelId] = useState(1);
  const [highlight, setHighlight] = useState<string | null>(null);

  useEffect(() => {
    persist(save);
  }, [save]);

  useEffect(() => {
    const unlock = () => unlockAudio();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  const goLevel = (id: number) => {
    setLevelId(id);
    if (save.hero && dialogueFor(id, save.hero)) setScreen("dialogue");
    else setScreen("level");
  };

  const pickHero = (id: HeroId) => {
    setSave((s) => ({ ...s, hero: id }));
    setScreen("map");
  };

  const spendBooster = (id: HeroId) => {
    setSave((s) => ({
      ...s,
      boosters: { ...s.boosters, [id]: Math.max(0, s.boosters[id] - 1) },
    }));
  };

  const win = (stars: number) => {
    const result = applyWin(save, levelId, stars);
    setSave(result.save);
    if (result.unlockedPolaroid) {
      setHighlight(result.unlockedPolaroid);
      setScreen("polaroid");
    } else {
      setScreen("map");
    }
  };

  return (
    <div className="app-shell">
      <div className="grain" />
      {screen === "boot" && (
        <BootScreen
          hasHero={!!save.hero}
          onStart={() => setScreen(save.hero ? "map" : "select")}
        />
      )}
      {screen === "select" && (
        <CharacterSelectScreen current={save.hero} onPick={pickHero} />
      )}
      {screen === "map" && (
        <MapScreen
          save={save}
          onPlay={goLevel}
          onInstall={() => setScreen("install")}
          onPolaroids={() => {
            setHighlight(null);
            setScreen("polaroid");
          }}
          onReselect={() => setScreen("select")}
        />
      )}
      {screen === "dialogue" && save.hero && (
        <DialogueScreen
          levelId={levelId}
          hero={save.hero}
          onContinue={() => setScreen("level")}
        />
      )}
      {screen === "level" && (
        <LevelScreen
          key={levelId}
          levelId={levelId}
          save={save}
          onWin={win}
          onExit={() => setScreen("map")}
          onSpendBooster={spendBooster}
        />
      )}
      {screen === "polaroid" && (
        <PolaroidScreen
          unlocked={save.polaroids}
          highlight={highlight}
          onBack={() => setScreen("map")}
        />
      )}
      {screen === "install" && <InstallScreen onBack={() => setScreen("map")} />}
    </div>
  );
}
