<?php
/**
 * =====================================================
 *  PHP Middleware для интеграции 1С МИС ↔ EmAI ↔ Jitsi
 * =====================================================
 * 
 * К部署 на: http://msi-2.dialog.ip:58080/
 * 
 * Эндпоинты:
 *   /?action=create    — Создание конференции (прокси в EmAI)
 *   /?action=cancel    — Отмена конференции
 *   /?action=complete  — Завершение конференции
 *   /?room=...&user=...&role=... — Генерация JWT-токена (уже работает)
 * 
 * Конфигурация — через переменные окружения или .env:
 *   EMAI_API_URL     — URL шлюза EmAI
 *   EMAI_API_KEY     — API-ключ для EmAI
 *   JITSI_APP_ID     — app_id для JWT
 *   JITSI_APP_SECRET — app_secret для JWT
 *   JITSI_DOMAIN     — домен Jitsi (sub + port)
 */

// ============================================================
// КОНФИГУРАЦИЯ
// ============================================================

$emaiApiUrl    = getenv('EMAI_API_URL') ?: 'https://emai-dev.comprog.art/api/gateway';
$emaiApiKey    = getenv('EMAI_API_KEY') ?: 'emai_dev_7f3a9c2e4b8d1a5f6c0e9b2d7a4f1c8e';
$jitsiAppId    = getenv('JITSI_APP_ID') ?: 'test_jitsi_app_id';
$jitsiAppSecret = getenv('JITSI_APP_SECRET') ?: 'test_jitsi_app_secret';
$jitsiDomain   = getenv('JITSI_DOMAIN') ?: 'msi-2.dialog.ip:58443';
$jitsiBaseUrl  = 'https://' . $jitsiDomain;

// ============================================================
// УТИЛИТЫ
// ============================================================

/**
 * Base64URL-кодирование (для JWT)
 */
function base64UrlEncode($data) {
    return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
}

/**
 * Отправить HTTP-запрос к EmAI
 * 
 * @param string $endpoint  — относительно $emaiApiUrl, например "/conference/create"
 * @param array  $payload   — тело JSON
 * @return array            — распарсенный ответ EmAI
 */
function callEmAI($endpoint, $payload) {
    global $emaiApiUrl, $emaiApiKey;

    $url = $emaiApiUrl . $endpoint;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'X-API-Key: ' . $emaiApiKey,
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => false, // Для dev-окружения; убрать в production
        CURLOPT_SSL_VERIFYHOST => false,
    ]);

    $responseBody = curl_exec($ch);
    $httpCode     = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError    = curl_error($ch);
    curl_close($ch);

    $decoded = json_decode($responseBody, true);

    if ($curlError) {
        return [
            'success' => false,
            'status'  => 0,
            'message' => 'cURL error: ' . $curlError,
            'data'    => null,
        ];
    }

    if (!$decoded) {
        return [
            'success' => false,
            'status'  => $httpCode,
            'message' => 'Не удалось распарсить ответ EmAI (HTTP ' . $httpCode . ')',
            'data'    => null,
        ];
    }

    return $decoded;
}

/**
 * Генерация JWT-токена для Jitsi
 * 
 * @param string $room — ID комнаты (обычно emaiSessionID)
 * @param string $user — имя пользователя
 * @param string $role — "owner" (врач) или "member" (пациент)
 * @return string — готовый JWT
 */
function generateJWT($room, $user, $role) {
    global $jitsiAppId, $jitsiAppSecret, $jitsiDomain;

    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);

    $payload = json_encode([
        'iss'     => $jitsiAppId,
        'sub'     => $jitsiDomain,
        'aud'     => 'jitsi-meet',
        'room'    => $room,
        'iat'     => time(),
        'exp'     => time() + 3600,
        'context' => [
            'user' => [
                'name'        => $user,
                'affiliation' => $role,
            ],
        ],
    ]);

    $base64UrlHeader  = base64UrlEncode($header);
    $base64UrlPayload = base64UrlEncode($payload);

    $signature          = hash_hmac('sha256', $base64UrlHeader . '.' . $base64UrlPayload, $jitsiAppSecret, true);
    $base64UrlSignature = base64UrlEncode($signature);

    return $base64UrlHeader . '.' . $base64UrlPayload . '.' . $base64UrlSignature;
}

/**
 * Сформировать итоговую ссылку для подключения к Jitsi
 */
function buildJitsiLink($room, $user, $role) {
    global $jitsiBaseUrl;
    $jwt  = generateJWT($room, $user, $role);
    return $jitsiBaseUrl . '/' . $room . '?jwt=' . $jwt;
}

/**
 * Вернуть JSON-ответ клиенту (1С)
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Получить параметры из GET или POST (JSON body)
 */
function getInputParams() {
    $params = [];
    
    // GET-параметры
    foreach ($_GET as $key => $value) {
        $params[$key] = $value;
    }
    
    // POST JSON body
    $rawBody = file_get_contents('php://input');
    if ($rawBody) {
        $body = json_decode($rawBody, true);
        if (is_array($body)) {
            $params = array_merge($params, $body);
        }
    }
    
    return $params;
}

// ============================================================
// РОУТЕР
// ============================================================

$params = getInputParams();
$action = $params['action'] ?? '';

// Если нет action — возможно, это запрос на генерацию JWT (обратная совместимость)
if (!$action && isset($params['room'])) {
    $room = $params['room'];
    $user = $params['user'] ?? 'User';
    $role = $params['role'] ?? 'member';
    
    $jwt  = generateJWT($room, $user, $role);
    echo $jwt;
    exit;
}

switch ($action) {

    // ==========================================
    // СОЗДАНИЕ КОНФЕРЕНЦИИ
    // ==========================================
    case 'create':
        $requiredFields = ['sessionID', 'personID', 'patientFullName', 'spec_id', 'doctorFullName', 'specialization'];
        foreach ($requiredFields as $field) {
            if (empty($params[$field])) {
                jsonResponse([
                    'success' => false,
                    'status'  => 400,
                    'message' => 'Отсутствует обязательное поле: ' . $field,
                ], 400);
            }
        }

        $emaiPayload = [
            'sessionID'         => $params['sessionID'],
            'patient'           => [
                'personID' => (int)$params['personID'],
                'fullName' => $params['patientFullName'],
            ],
            'doctor'            => [
                'spec_id'        => $params['spec_id'],
                'fullName'       => $params['doctorFullName'],
                'specialization' => $params['specialization'],
            ],
            'consultationType'  => $params['consultationType'] ?? 'video',
            'startTime'         => $params['startTime'] ?? gmdate('Y-m-d\TH:i:s\Z'),
            'ttlMinutes'        => (int)($params['ttlMinutes'] ?? 60),
        ];

        $emaiResponse = callEmAI('/conference/create', $emaiPayload);

        // Если EmAI вернул успех — формируем ссылку с JWT для врача
        if ($emaiResponse['success']) {
            $emaiSessionID = $emaiResponse['data']['emaiSessionID'];
            $doctorLink    = buildJitsiLink($emaiSessionID, $params['doctorFullName'], 'owner');
            $patientLink   = buildJitsiLink($emaiSessionID, $params['patientFullName'], 'member');

            jsonResponse([
                'success'  => true,
                'status'   => $emaiResponse['status'],
                'message'  => $emaiResponse['message'],
                'data'     => [
                    'emaiSessionID'  => $emaiSessionID,
                    'videoRoomURL'   => $emaiResponse['data']['videoRoomURL'],
                    'expiresAt'      => $emaiResponse['data']['expiresAt'],
                    'doctorLink'     => $doctorLink,
                    'patientLink'    => $patientLink,
                ],
                'traceId'  => $emaiResponse['traceId'] ?? null,
            ]);
        } else {
            // Ошибка от EmAI — пробрасываем дальше в 1С
            jsonResponse($emaiResponse, $emaiResponse['status'] ?? 502);
        }
        break;

    // ==========================================
    // ОТМЕНА КОНФЕРЕНЦИИ
    // ==========================================
    case 'cancel':
        if (empty($params['sessionID']) || empty($params['emaiSessionID'])) {
            jsonResponse([
                'success' => false,
                'status'  => 400,
                'message' => 'Отсутствуют обязательные поля: sessionID, emaiSessionID',
            ], 400);
        }

        $emaiPayload = [
            'sessionID'     => $params['sessionID'],
            'emaiSessionID' => (string)$params['emaiSessionID'],
            'action'        => 'CANCEL',
            'eventTime'     => $params['eventTime'] ?? gmdate('Y-m-d\TH:i:s\Z'),
            'reason'        => $params['reason'] ?? 'Отмена из МИС',
        ];

        $emaiResponse = callEmAI('/conference/event', $emaiPayload);
        jsonResponse($emaiResponse, $emaiResponse['status'] ?? 200);
        break;

    // ==========================================
    // ЗАВЕРШЕНИЕ КОНФЕРЕНЦИИ
    // ==========================================
    case 'complete':
        if (empty($params['sessionID']) || empty($params['emaiSessionID'])) {
            jsonResponse([
                'success' => false,
                'status'  => 400,
                'message' => 'Отсутствуют обязательные поля: sessionID, emaiSessionID',
            ], 400);
        }

        $emaiPayload = [
            'sessionID'     => $params['sessionID'],
            'emaiSessionID' => (string)$params['emaiSessionID'],
            'action'        => 'COMPLETE',
            'eventTime'     => $params['eventTime'] ?? gmdate('Y-m-d\TH:i:s\Z'),
        ];

        $emaiResponse = callEmAI('/conference/event', $emaiPayload);
        jsonResponse($emaiResponse, $emaiResponse['status'] ?? 200);
        break;

    // ==========================================
    // ТОЛЬКО ГЕНЕРАЦИЯ JWT (обратная совместимость)
    // ==========================================
    case 'token':
        if (empty($params['room'])) {
            jsonResponse([
                'success' => false,
                'status'  => 400,
                'message' => 'Отсутствует параметр: room',
            ], 400);
        }
        $room = $params['room'];
        $user = $params['user'] ?? 'User';
        $role = $params['role'] ?? 'member';
        $jwt  = generateJWT($room, $user, $role);

        jsonResponse([
            'success' => true,
            'status'  => 200,
            'jwt'     => $jwt,
            'link'    => $jitsiBaseUrl . '/' . $room . '?jwt=' . $jwt,
        ]);
        break;

    // ==========================================
    // НЕИЗВЕСТНОЕ ДЕЙСТВИЕ
    // ==========================================
    default:
        jsonResponse([
            'success' => false,
            'status'  => 400,
            'message' => 'Неизвестное действие: ' . $action . '. Допустимые: create, cancel, complete, token',
        ], 400);
        break;
}
