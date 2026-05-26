var interfaceConfig = {

    // Показывать водяной знак — НЕТ
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,

    // Кнопки на панели инструментов
    TOOLBAR_BUTTONS: [
        'microphone', 'camera', 'closedcaptions', 'desktop',
        'fullscreen', 'fodeviceselection', 'hangup',
        'profile', 'chat', 'settings', 'raisehand',
        'videoquality', 'filmstrip', 'shortcuts',
        'tileview', 'help', 'mute-everyone'
    ],

    // Название удаленного участника по умолчанию
    DEFAULT_REMOTE_DISPLAY_NAME: 'Пациент',

    // Язык по умолчанию
    DEFAULT_LANGUAGE: 'ru',

    // Автосоединение
    AUTO_JOIN: true,

    // Не показывать "Powered by Jitsi"
    SHOW_POWERED_BY: false,

    // Отключить Deep Linking
    DISABLE_DEEP_LINKING: true,

    // Без страницы предприсоединения
    ENABLE_PREJOIN_PAGE: false,

    // Максимум активных видео (врач + пациент)
    MAX_ACTIVE_VIDEO_PARTICIPANTS: 2,
};
