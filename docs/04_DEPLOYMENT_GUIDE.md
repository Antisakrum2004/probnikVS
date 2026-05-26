# Руководство по развёртыванию Jitsi Meet

## Что нужно для запуска

### Требования к серверу

| Параметр | Минимум | Рекомендация |
|---|---|---|
| **CPU** | 2 ядра | 4+ ядер |
| **RAM** | 4 ГБ | 8 ГБ+ |
| **Диск** | 20 ГБ SSD | 50 ГБ SSD |
| **Сеть** | 100 Мбит/с | 1 Гбит/с |
| **OS** | Ubuntu 20.04+ / CentOS 7+ | Ubuntu 22.04 LTS |
| **Docker** | 20.10+ | 24.x |
| **Docker Compose** | 2.0+ | 2.20+ |
| **Порты** | 80, 443, 4443, 58080, 10000/UDP | + 5349/TCP (TURN) |

### Внешние порты

| Порт | Протокол | Назначение | Обязательно |
|---|---|---|---|
| 80 | TCP | HTTP → redirect на HTTPS | ✅ |
| 443 | TCP | HTTPS (Jitsi Web) | ✅ |
| 4443 | TCP | Colibri (JVB fallback) | ✅ |
| 58080 | TCP | PHP Middleware (token-api) | ✅ |
| 10000 | UDP | Медиапоток (видео/аудио) | ✅ |
| 5349 | TCP | TURN over TLS (NAT traversal) | Рекомендуется |

---

## Шаг 1. Подготовка сервера

```bash
# Обновить систему
sudo apt update && sudo apt upgrade -y

# Установить Docker (если не установлен)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Добавить текущего пользователя в группу docker
sudo usermod -aG docker $USER

# Проверить
docker --version
docker compose version
```

## Шаг 2. Получить SSL-сертификат

### Вариант A: Самоподписанный (для тестов)

```bash
cd /path/to/probnikVS/src/docker/nginx/ssl

# Сгенерировать самоподписанный сертификат
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=msi-2.dialog.ip/O=MISS Organization/C=KZ"
```

### Вариант B: Let's Encrypt (для продакшена, нужен домен)

```bash
# Установить certbot
sudo apt install certbot -y

# Получить сертификат
sudo certbot certonly --standalone \
  -d video.yourdomain.kz \
  --email admin@yourdomain.kz \
  --agree-tos

# Скопировать в папку nginx
sudo cp /etc/letsencrypt/live/video.yourdomain.kz/fullchain.pem ./nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/video.yourdomain.kz/privkey.pem ./nginx/ssl/key.pem
```

## Шаг 3. Настроить файрвол

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4443/tcp
sudo ufw allow 58080/tcp
sudo ufw allow 10000/udp
sudo ufw allow 5349/tcp
sudo ufw reload
```

## Шаг 4. Развернуть Jitsi

```bash
# Перейти в папку проекта
cd /path/to/probnikVS/src/docker

# Копировать middleware в token-api
cp ../php-middleware/index.php ./token-api/index.php
cp ../php-middleware/.env.example ./token-api/.env

# Скопировать кастомные конфиги
mkdir -p jitsi-meet-cfg/web
cp config-custom/interface_config.js jitsi-meet-cfg/web/interface_config.js
cp config-custom/config.js jitsi-meet-cfg/web/config.js

# Убедиться, что SSL-сертификаты на месте
ls -la nginx/ssl/
# Должно быть: cert.pem  key.pem

# Запустить все сервисы
docker compose -f docker-compose.full.yml up -d

# Проверить статус
docker compose -f docker-compose.full.yml ps

# Посмотреть логи
docker compose -f docker-compose.full.yml logs -f
```

## Шаг 5. Проверить работу

### 5.1. Проверить middleware
```bash
# Генерация JWT-токена
curl "http://msi-2.dialog.ip:58080/?room=test&user=Admin&role=owner"
# Должен вернуться JWT-токен (длинная строка из 3 частей, разделённых точками)

# Создание конференции через middleware
curl -X POST "http://msi-2.dialog.ip:58080/?action=create" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionID": "TEST001",
    "personID": 1,
    "patientFullName": "Иванов И.И.",
    "spec_id": "DOC001",
    "doctorFullName": "Петров П.П.",
    "specialization": "Терапия"
  }'
# Должен вернуться JSON с doctorLink и patientLink
```

### 5.2. Проверить Jitsi Web
```bash
# Открыть в браузере:
# https://msi-2.dialog.ip/

# Если видите страницу Jitsi — Web UI работает
```

### 5.3. Тестовый звонок
1. Сгенерировать JWT: `curl "http://msi-2.dialog.ip:58080/?room=testroom&user=Doctor&role=owner"`
2. Открыть в браузере: `https://msi-2.dialog.ip/testroom?jwt=ТОКЕН`
3. Разрешить доступ к камере/микрофону
4. Если видите себя — всё работает!

### 5.4. Тест из 1С
1. В обработке «Видеоконсультация» выбрать врача и пациента
2. Нажать «Начать»
3. Должен открыться браузер с Jitsi

---

## Полезные команды

```bash
# Перезапустить один сервис
docker compose -f docker-compose.full.yml restart token-api

# Посмотреть логи конкретного сервиса
docker compose -f docker-compose.full.yml logs -f token-api
docker compose -f docker-compose.full.yml logs -f web
docker compose -f docker-compose.full.yml logs -f prosody

# Остановить все
docker compose -f docker-compose.full.yml down

# Полная очистка (внимание: удалит данные контейнеров)
docker compose -f docker-compose.full.yml down -v

# Обновить образы
docker compose -f docker-compose.full.yml pull
docker compose -f docker-compose.full.yml up -d
```

---

## Типичные проблемы

### Браузер не даёт доступ к камере
**Причина:** Нет HTTPS или самоподписанный сертификат
**Решение:**
- Для тестов: Chrome → chrome://flags/#unsafely-treat-insecure-origin-as-secure → добавить `http://msi-2.dialog.ip:58443`
- Для прода: получить сертификат Let's Encrypt

### Нет звука/видео у одного из участников
**Причина:** NAT traversal, закрыт порт 10000/UDP
**Решение:**
1. Открыть порт 10000/UDP на файрволе
2. Настроить JVB_ADVERTISE_IP в .env
3. Добавить TURN-сервер

### JWT-токен не принимается
**Причина:** Несовпадение JWT_APP_ID / JWT_APP_SECRET между Prosody и PHP
**Решение:**
1. Проверить .env (параметр JWT_APP_ID и JWT_APP_SECRET)
2. Проверить, что token-api получает те же значения через переменные окружения
3. Перезапустить: `docker compose restart prosody token-api`

### "Connection failed" при подключении
**Причина:** Prosody не может найти JVB
**Решение:**
1. Проверить, что все контейнеры в одной сети: `docker network ls`
2. Проверить логи prosody: `docker logs jitsi-prosody`
3. Убедиться, что JICOFO_COMPONENT_SECRET совпадает в .env
