# =============================================================
#  config.js — Основная конфигурация Jitsi Meet
#  Путь внутри контейнера: /config/config.js
# =============================================================

var config = {

    // XMPP подключение
    hosts: {
        domain: 'meet.jitsi',
        muc: 'conference.meet.jitsi',
        bridge: 'jitsi-videobridge.meet.jitsi'
    },

    // BOSH (через nginx)
    bosh: '/http-bind',

    // WebSocket (через nginx)
    websocket: 'wss://msi-2.dialog.ip/xmpp-websocket',

    // Отключить WebRTC для аудио (не использовать)
    disableAudioLevels: false,

    // Качество видео
    resolution: 720,
    constraints: {
        video: {
            height: { ideal: 720, max: 720, min: 240 }
        }
    },

    // P2P — отключить (всегда через JVB для контроля)
    p2p: {
        enabled: false
    },

    // Старт с выключенным микрофоном (врач сам включит)
    startWithAudioMuted: true,

    // Старт с выключенной камерой
    startWithVideoMuted: false,

    // Отключить цифровой шумоподавитель (плагин)
    disableAP: false,

    // Канал данных
    openBridgeChannel: true,

    // JWT авторизация
    tokenAuthUrl: 'http://token-api/',

    // Язык
    i18n: {
        language: 'ru'
    },

    // Отключить профиль (не нужно)
    disableProfile: false,

    // Отключить звонки по телефону
    enablePhone: false,

    // Время ожидания
    channelLastN: 2,

    // Таймаут
    testing: {
        enableNoisyMicDetection: true
    },

    // Выключить запись
    recording: {
        enabled: false
    },

    // Ливстриминг выключен
    liveStreaming: {
        enabled: false
    }
};
