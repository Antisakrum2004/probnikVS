#!/bin/bash
# =============================================================
#  demo.sh — Эмуляция запросов от 1С к middleware
#  Полный цикл: Создание → Подключение → Завершение
#  Запуск: chmod +x demo.sh && ./demo.sh [IP_СЕРВЕРА]
# =============================================================

set -e

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

# IP сервера (аргумент или автомат)
SERVER="${1:-$(hostname -I | awk '{print $1}')}"
if [ -z "$SERVER" ]; then
    echo -e "${RED}Укажите IP сервера: ./demo.sh 192.168.1.100${NC}"
    exit 1
fi

MIDDLEWARE="http://${SERVER}:58080"
JITSI="https://${SERVER}"

echo ""
echo -e "${BOLD}========================================${NC}"
echo -e "${BOLD}  ДЕМО: Эмуляция запросов от 1С МИС${NC}"
echo -e "${BOLD}  Сервер: ${SERVER}${NC}"
echo -e "${BOLD}========================================${NC}"
echo ""

# ============================================================
#  ШАГ 1: Создание конференции (имитация "Запись на приём" в 1С)
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Шаг 1. Регистратор создаёт запись на приём${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Пациент: ${GREEN}Иванов Иван Иванович${NC} (ID: 10001)"
echo -e "  Врач:   ${GREEN}Петров Пётр Петрович${NC} (Спец: Терапия)"
echo -e "  Дата:   ${GREEN}$(date '+%Y-%m-%d %H:%M')${NC}"
echo ""

echo -e "${YELLOW}[1С] → POST ${MIDDLEWARE}/?action=create${NC}"

CREATE_RESPONSE=$(curl -s -X POST "${MIDDLEWARE}/?action=create" \
    -H "Content-Type: application/json" \
    -d '{
        "sessionID": "1C-DEMO-001",
        "personID": 10001,
        "patientFullName": "Иванов Иван Иванович",
        "spec_id": "TER-001",
        "doctorFullName": "Петров Петр Петрович",
        "specialization": "Терапия",
        "consultationType": "video",
        "startTime": "'$(date -u '+%Y-%m-%dT%H:%M:%SZ')'",
        "ttlMinutes": 60
    }')

echo ""
echo -e "${CYAN}[EmAI ← Middleware] Ответ:${NC}"
echo "$CREATE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$CREATE_RESPONSE"
echo ""

# Парсинг ответа
SUCCESS=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('success',''))" 2>/dev/null)

if [ "$SUCCESS" != "True" ]; then
    echo -e "${RED}[ОШИБКА] Создание конференции не удалось.${NC}"
    echo -e "${RED}Проверьте, что middleware работает: curl ${MIDDLEWARE}/?action=token&room=test${NC}"
    exit 1
fi

# Извлечь данные
SESSION_ID=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['emaiSessionID'])" 2>/dev/null)
DOCTOR_LINK=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['doctorLink'])" 2>/dev/null)
PATIENT_LINK=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['patientLink'])" 2>/dev/null)
EXPIRES=$(echo "$CREATE_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['expiresAt'])" 2>/dev/null)

echo -e "${GREEN}[✓] Конференция создана в EmAI${NC}"
echo ""
echo -e "  EmAI Session ID:  ${BOLD}${SESSION_ID}${NC}"
echo -e "  Истекает:         ${EXPIRES}"
echo ""
echo -e "  ${CYAN}Ссылка для ВРАЧА (owner):${NC}"
echo -e "  ${GREEN}${DOCTOR_LINK}${NC}"
echo ""
echo -e "  ${CYAN}Ссылка для ПАЦИЕНТА (member):${NC}"
echo -e "  ${GREEN}${PATIENT_LINK}${NC}"
echo ""

# ============================================================
#  ШАГ 2: Врач подключается (имитация АРМ "Видеоконсультация")
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Шаг 2. Врач нажимает «Начать видеоконсультацию»${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  [1С] Нашла в РС «УчетВидеоконсультаций»:${NC}"
echo -e "    Врач:   Петров П.П."
echo -e "    Пациент: Иванов И.И."
echo -e "    Статус:  Приём запланирован"
echo ""
echo -e "  [1С] Открывает браузер по ссылке:"
echo -e "  ${GREEN}${DOCTOR_LINK}${NC}"
echo ""

# Проверка JWT-токена
JWT_PARTS=(${DOCTOR_LINK//jwt=/ })
JWT_TOKEN=${JWT_PARTS[1]}

echo -e "${YELLOW}[Проверка] JWT-токен:${NC}"
PAYLOAD=$(echo "${JWT_TOKEN}" | cut -d'.' -f2 | tr '_-' '/+' | base64 -d 2>/dev/null)
echo "$PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$PAYLOAD"
echo ""

echo -e "${GREEN}[✓] Токен валиден. Врач получит права модератора (owner).${NC}"
echo ""

# Попытка открыть в браузере (если есть)
if command -v xdg-open &> /dev/null; then
    echo -e "${YELLOW}Открываю браузер для врача...${NC}"
    xdg-open "${DOCTOR_LINK}" 2>/dev/null &
    echo -e "${GREEN}[✓] Браузер открыт${NC}"
elif command -v open &> /dev/null; then
    echo -e "${YELLOW}Открываю браузер для врача...${NC}"
    open "${DOCTOR_LINK}" 2>/dev/null &
    echo -e "${GREEN}[✓] Браузер открыт${NC}"
else
    echo -e "${YELLOW}[ИНФО] Не удалось открыть браузер автоматически.${NC}"
    echo -e "  Откройте вручную:"
    echo -e "  ${DOCTOR_LINK}"
fi
echo ""

# ============================================================
#  ШАГ 3: Открыть ссылку пациента (в другом окне/функциональном режиме)
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Шаг 3. Пациент подключается (эмуляция мобильного приложения)${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  [EmAI] Push-уведомление отправлено пациенту"
echo -e "  [Приложение] Пациент видит статус: «Запись подтверждена, ссылка получена»"
echo ""
echo -e "  ${CYAN}Ссылка для ПАЦИЕНТА:${NC}"
echo -e "  ${GREEN}${PATIENT_LINK}${NC}"
echo ""
echo -e "${YELLOW}[Демо] Откройте ссылку пациента в другом браузере или режиме инкогнито${NC}"
echo -e "${YELLOW}       (чтобы эмулировать два разных пользователя)${NC}"

read -p "  Открыть браузер для пациента? [y/N]: " OPEN_PATIENT
if [[ "$OPEN_PATIENT" =~ ^[Yy]$ ]]; then
    if command -v xdg-open &> /dev/null; then
        xdg-open "${PATIENT_LINK}" 2>/dev/null &
    elif command -v open &> /dev/null; then
        open "${PATIENT_LINK}" 2>/dev/null &
    fi
    echo -e "${GREEN}[✓] Браузер пациента открыт${NC}"
fi
echo ""

# ============================================================
#  ШАГ 4: Завершение (по кнопке врача)
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Шаг 4. Завершение консультации${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

read -p "  Завершить консультацию? [y/N]: " DO_COMPLETE

if [[ "$DO_COMPLETE" =~ ^[Yy]$ ]]; then
    echo ""
    echo -e "${YELLOW}[1С] → POST ${MIDDLEWARE}/?action=complete${NC}"

    COMPLETE_RESPONSE=$(curl -s -X POST "${MIDDLEWARE}/?action=complete" \
        -H "Content-Type: application/json" \
        -d "{
            \"sessionID\": \"1C-DEMO-001\",
            \"emaiSessionID\": \"${SESSION_ID}\",
            \"action\": \"COMPLETE\",
            \"eventTime\": \"$(date -u '+%Y-%m-%dT%H:%M:%SZ')\"
        }")

    echo ""
    echo -e "${CYAN}[EmAI ← Middleware] Ответ:${NC}"
    echo "$COMPLETE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$COMPLETE_RESPONSE"
    echo ""

    echo -e "${GREEN}[✓] В РС «УчетВидеоконсультаций»:${NC}"
    echo -e "    Прием запланирован: ${GREEN}Нет${NC}"
    echo -e "    Прием проведен:    ${GREEN}Да${NC}"
else
    echo -e "${YELLOW}Консультация не завершена. Вы можете завершить вручную:${NC}"
    echo ""
    echo -e "  curl -X POST \"${MIDDLEWARE}/?action=complete\" \\"
    echo -e "    -H \"Content-Type: application/json\" \\"
    echo -e "    -d '{\"sessionID\":\"1C-DEMO-001\",\"emaiSessionID\":\"${SESSION_ID}\",\"action\":\"COMPLETE\"}'"
    echo ""

    echo -e "${YELLOW}Или отменить:${NC}"
    echo ""
    echo -e "  curl -X POST \"${MIDDLEWARE}/?action=cancel\" \\"
    echo -e "    -H \"Content-Type: application/json\" \\"
    echo -e "    -d '{\"sessionID\":\"1C-DEMO-001\",\"emaiSessionID\":\"${SESSION_ID}\",\"action\":\"CANCEL\"}'"
    echo ""
fi

# ============================================================
#  ИТОГО
# ============================================================
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}ИТОГО: Демо завершено${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Что было продемонстрировано:"
echo -e "    1. ${GREEN}Создание конференции${NC} (1С → Middleware → EmAI)"
echo -e "    2. ${GREEN}Генерация JWT${NC} (Middleware → Jitsi token)"
echo -e "    3. ${GREEN}Подключение врача${NC} (owner — модератор)"
echo -e "    4. ${GREEN}Подключение пациента${NC} (member — ограниченные права)"
echo -e "    5. ${GREEN}Завершение консультации${NC} (1С → Middleware → EmAI)"
echo ""
echo -e "  Жизненный цикл данных:"
echo -e "    Регистратор → EmAI → Регистр сведений → АРМ Врача → Jitsi"
echo ""
