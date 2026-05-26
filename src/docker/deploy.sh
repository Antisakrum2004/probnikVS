#!/bin/bash
# =============================================================
#  deploy.sh — One-click deploy Jitsi + middleware для ДЕМО
#  Запуск: chmod +x deploy.sh && sudo ./deploy.sh
# =============================================================

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo "=============================================="
echo "  DEPLOY: Jitsi Meet + PHP Middleware"
echo "  Для демонстрации заказчику"
echo "=============================================="
echo ""

# ---- Проверка Docker ----
if ! command -v docker &> /dev/null; then
    echo -e "${RED}[ОШИБКА] Docker не установлен.${NC}"
    echo "Установите: curl -fsSL https://get.docker.com | sudo sh"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${RED}[ОШИБКА] Docker Compose не установлен.${NC}"
    exit 1
fi

echo -e "${GREEN}[✓] Docker найден: $(docker --version)${NC}"

# ---- Определить IP сервера ----
SERVER_IP=$(hostname -I | awk '{print $1}')
if [ -z "$SERVER_IP" ]; then
    echo -e "${YELLOW}[!] Не удалось определить IP. Используем 0.0.0.0${NC}"
    SERVER_IP="0.0.0.0"
fi

echo -e "${GREEN}[✓] IP сервера: ${SERVER_IP}${NC}"
echo ""

# ---- SSL (самоподписанный) ----
echo -e "${YELLOW}[1/5] Генерация самоподписанного SSL-сертификата...${NC}"
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/CN=${SERVER_IP}/O=DEMO/C=KZ" 2>/dev/null
echo -e "${GREEN}[✓] SSL-сертификат создан${NC}"

# ---- Подставить реальный IP в конфиги ----
echo -e "${YELLOW}[2/5] Настройка конфигурации...${NC}"

# Заменить IP в .env
sed -i "s/msi-2.dialog.ip:58443/${SERVER_IP}/g" .env
sed -i "s/msi-2.dialog.ip/${SERVER_IP}/g" .env

# Заменить IP в nginx.conf
sed -i "s/msi-2.dialog.ip/${SERVER_IP}/g" nginx/nginx.conf

# Заменить IP в config.js
sed -i "s/msi-2.dialog.ip/${SERVER_IP}/g" config-custom/config.js

echo -e "${GREEN}[✓] Конфиги настроены для IP: ${SERVER_IP}${NC}"

# ---- Копировать middleware ----
echo -e "${YELLOW}[3/5] Копирование PHP middleware...${NC}"
if [ -f "../php-middleware/index.php" ]; then
    cp ../php-middleware/index.php token-api/index.php
    echo -e "${GREEN}[✓] index.php скопирован${NC}"
else
    echo -e "${RED}[ОШИБКА] Не найден ../php-middleware/index.php${NC}"
    echo "Убедитесь, что запускаете из директории src/docker/"
    exit 1
fi

# ---- Кастомизация Jitsi UI ----
echo -e "${YELLOW}[4/5] Кастомизация интерфейса Jitsi...${NC}"
mkdir -p jitsi-meet-cfg/web
cp config-custom/interface_config.js jitsi-meet-cfg/web/interface_config.js 2>/dev/null || true
cp config-custom/config.js jitsi-meet-cfg/web/config.js 2>/dev/null || true
echo -e "${GREEN}[✓] Интерфейс настроен (русский, 2 участника)${NC}"

# ---- Запуск Docker ----
echo -e "${YELLOW}[5/5] Запуск контейнеров...${NC}"
docker compose -f docker-compose.full.yml down 2>/dev/null || true
docker compose -f docker-compose.full.yml up -d

echo ""
echo "Ждём запуск сервисов (15 секунд)..."
sleep 15

# ---- Проверка ----
echo ""
echo "=============================================="
echo -e "${GREEN}  ДЕМО-СЕРВИС ЗАПУЩЕН!${NC}"
echo "=============================================="
echo ""
echo "  Jitsi Meet (веб-клиент):"
echo -e "    ${GREEN}https://${SERVER_IP}/${NC}"
echo ""
echo "  PHP Middleware (API):"
echo -e "    ${GREEN}http://${SERVER_IP}:58080/${NC}"
echo ""
echo "  Тест генерации JWT:"
echo "    curl http://${SERVER_IP}:58080/?room=test&user=Doctor&role=owner"
echo ""
echo "  Логи:"
echo "    docker compose -f docker-compose.full.yml logs -f"
echo ""
echo -e "${YELLOW}  ВАЖНО: при первом открытии в Chrome нужно:${NC}"
echo "    1. Открыть chrome://flags/#unsafely-treat-insecure-origin-as-secure"
echo "    2. Добавить: https://${SERVER_IP}"
echo "    3. Нажать Enable → Relaunch"
echo ""
echo "  Для эмуляции запросов от 1С:"
echo "    cd ../demo && chmod +x demo.sh && ./demo.sh"
echo ""
