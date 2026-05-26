# Спецификация: Подсистема видеоконсультаций в МИС

## Цель
Реализовать в МИС (1С:Enterprise 8.3.27, веб-клиент) возможность проведения видеоконсультаций через платформу EmAI между врачом и пациентом. Врач заходит на видеоконсультацию из МИС, пациент — через мобильное приложение.

## Стек технологий
- **Платформа 1С:** 8.3.27, веб-клиент
- **Конфигурация МИС:** МИС Казахстана (точное имя конфигурации уточняется)
- **Видеосвязь:** Jitsi Meet (self-hosted, Docker)
- **Оркестрация:** EmAI Gateway (https://emai-dev.comprog.art)
- **JWT-генерация:** PHP 8.2 микросервис (http://msi-2.dialog.ip:58080)
- **Доступ к Jitsi:** https://msi-2.dialog.ip:58443

## API EmAI

### API Key
```
X-API-Key: emai_dev_7f3a9c2e4b8d1a5f6c0e9b2d7a4f1c8e
```

### 1. Создание конференции (conference/create)

**URL:** `POST https://emai-dev.comprog.art/api/gateway/conference/create`

**Тело запроса (JSON):**
```json
{
    "sessionID": "AAA12333",
    "patient": {
        "personID": 22233,
        "fullName": "PATIENT"
    },
    "doctor": {
        "spec_id": "QWERTY",
        "fullName": "DOCTOR",
        "specialization": "MAL"
    },
    "consultationType": "video",
    "startTime": "2026-01-25T00:00:00Z",
    "ttlMinutes": 60
}
```

**Ответ от EmAI:**
```json
{
    "success": true,
    "status": 200,
    "message": "Запрос выполнен успешно",
    "data": {
        "emaiSessionID": 18,
        "videoRoomURL": "/conference/join?sessionID=18",
        "expiresAt": "2026-01-25T01:00:00Z"
    },
    "traceId": "815313b0-520b-448e-b914-6b627ce9480a",
    "timestamp": "2026-01-23 13:53:38"
}
```

### 2. Отмена конференции (conference/event — CANCEL)

**URL:** `POST https://emai-dev.comprog.art/api/gateway/conference/event`

**Тело запроса:**
```json
{
    "sessionID": "AAA123123",
    "emaiSessionID": "21",
    "action": "CANCEL",
    "eventTime": "2026-02-02T10:00:00Z",
    "reason": "prostotak"
}
```

### 3. Завершение конференции (conference/event — COMPLETE)

**URL:** `POST https://emai-dev.comprog.art/api/gateway/conference/event`

**Тело запроса:**
```json
{
    "sessionID": "AAA123123",
    "emaiSessionID": "21",
    "action": "COMPLETE",
    "eventTime": "2026-02-02T10:00:00Z"
}
```

## Данные для JWT-токена (Jitsi)

### JWT-параметры
```
app_id:     test_jitsi_app_id
app_secret: test_jitsi_app_secret
jitsi_domain: msi-2.dialog.ip:58443
алгоритм:  HS256
TTL:        3600 секунд (1 час)
```

### Claims токена:
```json
{
    "iss": "test_jitsi_app_id",
    "sub": "msi-2.dialog.ip:58443",
    "aud": "jitsi-meet",
    "room": "123",
    "iat": 1778503649,
    "exp": 1778507249,
    "context": {
        "user": {
            "name": "101",
            "affiliation": "owner"
        }
    }
}
```

### Роли
- `owner` — врач (модератор, может завершить консультацию)
- `member` — пациент (ограниченные права)

### Примеры запросов к генератору токенов:
```
http://msi-2.dialog.ip:58080/?room=123&user=101&role=owner     # врач
http://msi-2.dialog.ip:58080/?room=123&user=102&role=member    # пациент
```

### Итоговая ссылка для подключения:
```
https://msi-2.dialog.ip:58443/{room}?jwt={token}
```

## Бизнес-логика

### Жизненный цикл видеоконсультации:
1. Регистратор создаёт документ «Запись на приём» в 1С, ставит галку «Видеоконсультация»
2. Нажимает «Отправить в EmAI» → 1С отправляет POST на EmAI через middleware
3. EmAI возвращает emaiSessionID и videoRoomURL
4. Middleware генерирует JWT-токен и формирует итоговую ссылку
5. Итоговая ссылка сохраняется в РС «Учет видеоконсультаций»
6. Врач проводит документ → в регистре ставится «Приём запланирован»
7. Пациент видит ссылку в мобильном приложении (через EmAI push)
8. В назначенное время врач и пациент подключаются по ссылке
9. Врач нажимает «Завершить» → отправляется COMPLETE в EmAI
10. В регистре ставится «Приём проведен»

### Ограничения:
- Консультации привязаны к слотам (по 15 минут)
- Нельзя подключиться раньше назначенного времени
- TTL сессии — 1 час (с запасом на задержки)
- У врача есть кнопка завершения, у пациента — нет
