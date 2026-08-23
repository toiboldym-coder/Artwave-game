# Artwave

Мобильная веб-игра в духе Royal Match про компанию Artwave.

Айдар — свет и сцены. Адиль — договоры. Артём — LED.

## Запуск

```bash
npm install
npm run dev
```

На этом компьютере: http://localhost:5173  
С телефона в той же Wi-Fi: http://192.168.31.229:5173

## Поставить как приложение

Магазины не нужны.

- iPhone: Safari → Поделиться → На экран Домой
- Android: Chrome → Добавить на главный экран

APK для WhatsApp (нужны Android Studio и Java):

```bash
npm run cap:sync
npm run cap:open
```

В Android Studio: Build → Build APK(s). Файл кидаешь в чат.
