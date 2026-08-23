import { BigButton, Eyebrow } from "../components/Chrome";

export function InstallScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="aw-screen aw-install">
      <div className="aw-poly-head">
        <Eyebrow>без App Store и Google Play</Eyebrow>
        <h2 className="aw-h2">Поставь Artwave на телефон</h2>
        <p className="aw-muted">
          Иконка появится на экране «Домой», как у обычного приложения.
        </p>
      </div>

      <div className="aw-install-card">
        <h3 className="aw-install-plat"> iPhone (Safari)</h3>
        <ol className="aw-steps">
          <li>Открой ссылку в <b>Safari</b>.</li>
          <li>Нажми кнопку <b>«Поделиться»</b> (квадрат со стрелкой вверх).</li>
          <li>Выбери <b>«На экран «Домой»»</b>.</li>
          <li>Готово — запускай Artwave с иконки.</li>
        </ol>
      </div>

      <div className="aw-install-card">
        <h3 className="aw-install-plat"> Android (Chrome)</h3>
        <ol className="aw-steps">
          <li>Открой ссылку в <b>Chrome</b>.</li>
          <li>Меню <b>⋮</b> → <b>«Установить приложение»</b> (или «Добавить на главный экран»).</li>
          <li>Подтверди — иконка появится в меню приложений.</li>
        </ol>
        <p className="aw-muted aw-small">
          Либо поставь APK, который можно собрать из проекта и скинуть в WhatsApp.
        </p>
      </div>

      <div className="aw-poly-cta">
        <BigButton onClick={onBack} color="#9B6DFF">
          Назад
        </BigButton>
      </div>
    </div>
  );
}
