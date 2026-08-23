import { DeviceMobile, DownloadSimple, ShareNetwork } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { BigButton, Eyebrow } from "../components/Chrome";
import {
  canPromptInstall,
  isAndroid,
  isIos,
  isStandalone,
  promptInstall,
  subscribeInstall,
} from "../install/pwa";

export function InstallScreen({ onBack }: { onBack: () => void }) {
  const [ready, setReady] = useState(canPromptInstall);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(isStandalone());

  useEffect(() => subscribeInstall(() => {
    setReady(canPromptInstall());
    setDone(isStandalone());
  }), []);

  const install = async () => {
    setBusy(true);
    const result = await promptInstall();
    setBusy(false);
    if (result === "accepted") setDone(true);
  };

  return (
    <div className="aw-screen aw-install">
      <div className="aw-poly-head">
        <Eyebrow>одна игра · на телефон</Eyebrow>
        <h2 className="aw-h2">{done ? "Artwave уже на телефоне" : "Поставь Artwave себе"}</h2>
        <p className="aw-muted">
          Это не две разные версии. Тот же сайт становится приложением на экране
          «Домой» — и на Android, и на iPhone. Потом открывается без браузера и без сети.
        </p>
      </div>

      {done ? (
        <div className="aw-install-card">
          <h3 className="aw-install-plat">Готово</h3>
          <p className="aw-muted">Запускай с иконки. Склад уже твой.</p>
        </div>
      ) : ready ? (
        <div className="aw-install-card">
          <h3 className="aw-install-plat">Android</h3>
          <p className="aw-muted">Одно нажатие — иконка в меню приложений.</p>
          <div className="aw-install-cta">
            <BigButton onClick={install} color="#24D0C4">
              {busy ? "Ставим…" : "Скачать на телефон"}
            </BigButton>
          </div>
        </div>
      ) : (
        <>
          {(isIos() || !isAndroid()) && (
            <div className="aw-install-card">
              <h3 className="aw-install-plat">
                <ShareNetwork weight="fill" /> iPhone
              </h3>
              <ol className="aw-steps">
                <li>Открой artwavegame.kz в <b>Safari</b>.</li>
                <li>Нажми <b>Поделиться</b> — квадрат со стрелкой вверх.</li>
                <li>Выбери <b>На экран «Домой»</b>.</li>
                <li>Готово. Иконка как у обычного приложения.</li>
              </ol>
            </div>
          )}
          {(isAndroid() || !isIos()) && (
            <div className="aw-install-card">
              <h3 className="aw-install-plat">
                <DownloadSimple weight="fill" /> Android
              </h3>
              <ol className="aw-steps">
                <li>Открой ссылку в <b>Chrome</b>.</li>
                <li>Меню <b>⋮</b> → <b>Установить приложение</b>.</li>
                <li>Или «Добавить на главный экран», если Chrome ещё не предложил.</li>
              </ol>
            </div>
          )}
        </>
      )}

      <div className="aw-install-note">
        <DeviceMobile weight="fill" />
        <span>
          Отдельный файл из App Store или Google Play не нужен. Нативный APK можно
          собрать позже, если захотите кинуть файл в WhatsApp — это та же игра.
        </span>
      </div>

      <div className="aw-poly-cta">
        <BigButton onClick={onBack} color="#9B6DFF">
          На склад
        </BigButton>
      </div>
    </div>
  );
}
