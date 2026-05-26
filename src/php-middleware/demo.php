<?php
/**
 * demo.php — Демо-страница для показа заказчику
 * Открывается СРАЗУ на сервере middleware: http://IP:58080/demo.php
 * Никакого CORS, никакого file:// — всё работает.
 */

// Разрешить фрейм (если открывают через iframe)
header('X-Frame-Options: SAMEORIGIN');
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Демо — Видеоконсультации МИС</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            min-height: 100vh;
            padding: 20px;
        }

        .header {
            text-align: center;
            padding: 30px;
            border-bottom: 1px solid #1e293b;
            margin-bottom: 30px;
        }

        .header h1 { font-size: 28px; color: #38bdf8; margin-bottom: 10px; }
        .header p { color: #94a3b8; font-size: 14px; }

        .flow {
            display: flex;
            flex-direction: column;
            gap: 20px;
            max-width: 900px;
            margin: 0 auto;
        }

        .step {
            background: #1e293b;
            border-radius: 12px;
            padding: 24px;
            border-left: 4px solid #334155;
            transition: all 0.3s;
        }

        .step.active {
            border-left-color: #38bdf8;
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.1);
        }

        .step.success { border-left-color: #4ade80; }
        .step.error { border-left-color: #f87171; }

        .step-number {
            display: inline-block;
            background: #334155;
            color: #94a3b8;
            padding: 2px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 12px;
        }

        .step.active .step-number { background: #0ea5e9; color: white; }
        .step.success .step-number { background: #22c55e; color: white; }

        .step h3 { font-size: 18px; margin-bottom: 8px; color: #f1f5f9; }
        .step p { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 12px; }

        .details {
            background: #0f172a;
            border-radius: 8px;
            padding: 12px 16px;
            font-family: 'Fira Code', 'Cascadia Code', monospace;
            font-size: 13px;
            display: none;
        }

        .step.active .details,
        .step.success .details { display: block; }

        .method { color: #fbbf24; font-weight: bold; }
        .url { color: #38bdf8; }

        .response {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #334155;
        }

        .response .label {
            color: #94a3b8;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
        }

        .link-box {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 12px;
            margin-top: 12px;
            display: none;
        }

        .step.success .link-box { display: block; }

        .link-box .label { color: #94a3b8; font-size: 12px; margin-bottom: 6px; }

        .link-box a {
            color: #38bdf8;
            text-decoration: none;
            word-break: break-all;
            font-family: monospace;
            font-size: 13px;
        }

        .link-box a:hover { text-decoration: underline; }

        .tag {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 6px;
        }

        .tag-owner { background: #22c55e33; color: #4ade80; }
        .tag-member { background: #fbbf2433; color: #fbbf24; }

        .controls {
            max-width: 900px;
            margin: 30px auto;
            display: flex;
            gap: 12px;
            justify-content: center;
            flex-wrap: wrap;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }

        .btn-primary { background: #0ea5e9; color: white; }
        .btn-primary:hover { background: #0284c7; }
        .btn-primary:disabled { background: #334155; color: #64748b; cursor: not-allowed; }

        .btn-danger { background: #ef4444; color: white; }
        .btn-danger:hover { background: #dc2626; }

        .btn-secondary { background: #334155; color: #e2e8f0; }
        .btn-secondary:hover { background: #475569; }

        .status-bar {
            max-width: 900px;
            margin: 20px auto;
            background: #1e293b;
            border-radius: 8px;
            padding: 16px;
            text-align: center;
        }

        .status-bar .label { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
        .status-bar .value { color: #f1f5f9; font-size: 18px; font-weight: 600; margin-top: 4px; }

        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #64748b;
            border-top-color: #38bdf8;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            vertical-align: middle;
            margin-left: 8px;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        .log {
            max-width: 900px;
            margin: 20px auto;
            background: #0f172a;
            border: 1px solid #1e293b;
            border-radius: 8px;
            padding: 16px;
            font-family: monospace;
            font-size: 12px;
            max-height: 200px;
            overflow-y: auto;
        }

        .log .line { margin-bottom: 2px; }
        .log .time { color: #64748b; }
        .log .info { color: #38bdf8; }
        .log .ok { color: #4ade80; }
        .log .err { color: #f87171; }
        .log .warn { color: #fbbf24; }

        .config {
            max-width: 900px;
            margin: 20px auto;
            background: #1e293b;
            border-radius: 12px;
            padding: 20px;
        }

        .config h3 { margin-bottom: 12px; color: #f1f5f9; }

        .config-row {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
        }

        .config-row label { width: 200px; color: #94a3b8; font-size: 14px; }

        .config-row input {
            flex: 1;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 6px;
            padding: 8px 12px;
            color: #e2e8f0;
            font-family: monospace;
            font-size: 14px;
        }

        .config-row input:focus { outline: none; border-color: #0ea5e9; }

        pre {
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
            padding: 0;
        }

        .cancel-row {
            margin-top: 10px;
            display: none;
        }

        .step.success .cancel-row { display: block; }
    </style>
</head>
<body>

    <div class="header">
        <h1>Демо: Видеоконсультации в МИС</h1>
        <p>Интеграция 1С МИС + EmAI + Jitsi Meet | Полный цикл создания и проведения видеоконсультации</p>
    </div>

    <div class="config">
        <h3>Настройки подключения</h3>
        <div class="config-row">
            <label>Middleware URL:</label>
            <input type="text" id="middlewareUrl" value="<?php
                // Автозаполнение: текущий сервер
                $proto = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $host  = $_SERVER['HTTP_HOST'] ?? 'localhost:58080';
                echo $proto . '://' . $host;
            ?>">
        </div>
    </div>

    <div class="status-bar">
        <div class="label">Текущий этап</div>
        <div class="value" id="statusText">Ожидание запуска демо</div>
    </div>

    <div class="log" id="log">
        <div class="line"><span class="time">[--:--:--]</span> <span class="info">Система готова к работе. Нажмите "Запустить демо".</span></div>
    </div>

    <div class="flow">
        <div class="step" id="step1">
            <div class="step-number">ШАГ 1</div>
            <h3>Создание записи на приём (1С → EmAI)</h3>
            <p>Регистратор в 1С МИС создаёт документ «Запись на приём», устанавливает галку «Видеоконсультация» и нажимает «Отправить в EmAI». Middleware проксирует запрос в EmAI, получает emaiSessionID и формирует JWT-ссылки для врача и пациента.</p>
            <div class="details" id="details1"></div>
            <div class="link-box" id="links1">
                <div class="label">Ссылка для ВРАЧА (owner — модератор):</div>
                <a id="doctorLink" href="#" target="_blank"></a>
                <span class="tag tag-owner">OWNER</span>
                <div style="margin-top:8px" class="label">Ссылка для ПАЦИЕНТА (member):</div>
                <a id="patientLink" href="#" target="_blank"></a>
                <span class="tag tag-member">MEMBER</span>
                <div class="cancel-row">
                    <button class="btn btn-danger" style="margin-top:10px;padding:8px 16px;font-size:12px" onclick="cancelConsultation()">Отменить консультацию</button>
                </div>
            </div>
        </div>

        <div class="step" id="step2">
            <div class="step-number">ШАГ 2</div>
            <h3>Подключение врача (АРМ «Видеоконсультация»)</h3>
            <p>Врач открывает обработку «Видеоконсультация», выбирает себя и пациента, нажимает «Начать». 1С находит ссылку в регистре и открывает системный браузер. Врач заходит в Jitsi с правами модератора (owner).</p>
            <div class="details" id="details2"></div>
        </div>

        <div class="step" id="step3">
            <div class="step-number">ШАГ 3</div>
            <h3>Подключение пациента (Мобильное приложение)</h3>
            <p>Пациент получает push-уведомление и видит ссылку в приложении. Переходит по ссылке с ролью member — ограниченные права (не может завершить консультацию, не может мьютить всех).</p>
            <div class="details" id="details3"></div>
        </div>

        <div class="step" id="step4">
            <div class="step-number">ШАГ 4</div>
            <h3>Завершение консультации (Врач → EmAI)</h3>
            <p>Врач нажимает «Завершить консультацию» в АРМ. 1С отправляет COMPLETE через middleware в EmAI. В регистре «Учет видеоконсультаций» ставится «Приём проведен».</p>
            <div class="details" id="details4"></div>
        </div>
    </div>

    <div class="controls">
        <button class="btn btn-primary" id="btnStart" onclick="startDemo()">Запустить демо</button>
        <button class="btn btn-primary" id="btnStep2" onclick="doctorConnect()" disabled>Шаг 2: Врач подключается</button>
        <button class="btn btn-primary" id="btnStep3" onclick="patientConnect()" disabled>Шаг 3: Пациент подключается</button>
        <button class="btn btn-danger" id="btnComplete" onclick="completeConsultation()" disabled>Шаг 4: Завершить</button>
        <button class="btn btn-secondary" id="btnReset" onclick="resetDemo()">Сброс</button>
    </div>

    <script>
        var state = {
            sessionId: '',
            emaiSessionId: null,
            doctorLink: '',
            patientLink: '',
            middlewareUrl: ''
        };

        function log(text, type) {
            type = type || 'info';
            var logEl = document.getElementById('log');
            var now = new Date();
            var time = now.toTimeString().substr(0, 8);
            var line = document.createElement('div');
            line.className = 'line';
            line.innerHTML = '<span class="time">[' + time + ']</span> <span class="' + type + '">' + text + '</span>';
            logEl.appendChild(line);
            logEl.scrollTop = logEl.scrollHeight;
        }

        function setStatus(text) { document.getElementById('statusText').textContent = text; }
        function setStep(id, status) { document.getElementById(id).className = 'step ' + status; }
        function getBaseUrl() { return document.getElementById('middlewareUrl').value.replace(/\/$/, ''); }

        function jsonPretty(obj) {
            return JSON.stringify(obj, null, 2);
        }

        function generateSessionId() {
            var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
            var id = '1C-DEMO-';
            for (var i = 0; i < 6; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
            return id;
        }

        function apiCall(action, payload) {
            var url = getBaseUrl() + '/?action=' + action;
            return fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).then(function(r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            });
        }

        // ===== STEP 1 =====
        function startDemo() {
            state.sessionId = generateSessionId();
            state.middlewareUrl = getBaseUrl();

            var btn = document.getElementById('btnStart');
            btn.disabled = true;
            btn.innerHTML = 'Отправка... <span class="spinner"></span>';

            setStep('step1', 'active');
            setStatus('Создание конференции...');
            log('[1С] Документ "Запись на приём" — sessionID=' + state.sessionId, 'info');

            var payload = {
                sessionID: state.sessionId,
                personID: 10001,
                patientFullName: 'Иванов Иван Иванович',
                spec_id: 'TER-001',
                doctorFullName: 'Петров Петр Петрович',
                specialization: 'Терапия',
                consultationType: 'video',
                startTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
                ttlMinutes: 60
            };

            log('[1С] POST → Middleware/?action=create', 'warn');
            log('[Middleware] Проксирование в EmAI...', 'info');

            apiCall('create', payload)
            .then(function(data) {
                if (data.success) {
                    state.emaiSessionId = data.data.emaiSessionID;
                    state.doctorLink = data.data.doctorLink;
                    state.patientLink = data.data.patientLink;

                    setStep('step1', 'success');
                    setStatus('Конференция создана! EmAI Session: ' + data.data.emaiSessionId);

                    log('[EmAI] success=true, emaiSessionID=' + data.data.emaiSessionID, 'ok');
                    log('[Middleware] JWT(owner) для врача сгенерирован', 'ok');
                    log('[Middleware] JWT(member) для пациента сгенерирован', 'ok');
                    log('[1С] Статус: "' + data.message + '"', 'ok');
                    log('[1С] Проведение документа → РС "УчетВидеоконсультаций": ПриемЗапланирован = Истина', 'ok');

                    document.getElementById('doctorLink').href = state.doctorLink;
                    document.getElementById('doctorLink').textContent = state.doctorLink;
                    document.getElementById('patientLink').href = state.patientLink;
                    document.getElementById('patientLink').textContent = state.patientLink;

                    document.getElementById('details1').innerHTML =
                        '<span class="method">POST</span> <span class="url">' + getBaseUrl() + '/?action=create</span>' +
                        '<div class="response" style="margin-top:8px"><div class="label">Запрос:</div>' +
                        '<pre style="color:#94a3b8">' + jsonPretty(payload) + '</pre></div>' +
                        '<div class="response"><div class="label">Ответ EmAI:</div>' +
                        '<pre style="color:#4ade80">' + jsonPretty(data) + '</pre></div>';

                    document.getElementById('btnStep2').disabled = false;
                    document.getElementById('btnStep3').disabled = false;
                } else {
                    setStep('step1', 'error');
                    setStatus('Ошибка: ' + data.message);
                    log('[EmAI] ОШИБКА: ' + data.message, 'err');
                    document.getElementById('details1').innerHTML =
                        '<pre style="color:#f87171">' + jsonPretty(data) + '</pre>';
                    btn.disabled = false;
                    btn.textContent = 'Повторить';
                }
            })
            .catch(function(err) {
                setStep('step1', 'error');
                setStatus('Ошибка подключения к middleware');
                log('[Middleware] ОШИБКА: ' + err.message, 'err');
                log('[Подсказка] Убедитесь, что middleware запущен: ' + getBaseUrl() + '/?action=token&room=test', 'warn');
                btn.disabled = false;
                btn.textContent = 'Повторить';
            });
        }

        // ===== CANCEL =====
        function cancelConsultation() {
            if (!state.emaiSessionId) return;

            setStep('step1', 'active');
            log('[1С] Отмена записи на приём...', 'warn');

            var payload = {
                sessionID: state.sessionId,
                emaiSessionID: String(state.emaiSessionId),
                action: 'CANCEL',
                eventTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
                reason: 'Отмена пользователем'
            };

            apiCall('cancel', payload)
            .then(function(data) {
                if (data.success) {
                    log('[EmAI] Консультация отменена (CANCEL)', 'ok');
                    log('[1С] РС → ПриемЗапланирован = Ложь', 'ok');
                    setStep('step1', 'error');
                    setStatus('Консультация отменена');
                    document.getElementById('btnStep2').disabled = true;
                    document.getElementById('btnStep3').disabled = true;
                    document.getElementById('btnComplete').disabled = true;
                } else {
                    log('[EmAI] Ошибка отмены: ' + data.message, 'err');
                    setStep('step1', 'success');
                }
            })
            .catch(function(err) {
                log('[Middleware] Ошибка: ' + err.message, 'err');
                setStep('step1', 'success');
            });
        }

        // ===== STEP 2 =====
        function doctorConnect() {
            setStep('step2', 'active');
            setStatus('Врач подключается...');

            log('[1С] Обработка "Видеоконсультация" → Начать', 'info');
            log('[1С] Поиск в РС: Врач=Петров П.П., Пациент=Иванов И.И., Запланирован=Да', 'info');
            log('[1С] Запись найдена: emaiSessionID=' + state.emaiSessionId, 'ok');
            log('[1С] ЗапуститьПриложение(СсылкаВК)', 'warn');

            window.open(state.doctorLink, '_blank');

            document.getElementById('details2').innerHTML =
                '<span class="method">Открыто в браузере:</span><br>' +
                '<span class="url" style="word-break:break-all">' + state.doctorLink + '</span><br><br>' +
                '<span style="color:#94a3b8">JWT payload:</span><br>' +
                '<pre style="color:#4ade80" id="jwtDoctor"></pre>';

            // Декодируем JWT для показа
            try {
                var token = state.doctorLink.split('jwt=')[1];
                var parts = token.split('.');
                var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                document.getElementById('jwtDoctor').textContent = jsonPretty(payload);
            } catch(e) {
                document.getElementById('jwtDoctor').textContent = '(не удалось декодировать)';
            }

            log('[Jitsi] Врач подключён с ролью owner (модератор)', 'ok');
            setStep('step2', 'success');
            setStatus('Врач подключён к Jitsi (модератор)');
            document.getElementById('btnComplete').disabled = false;
        }

        // ===== STEP 3 =====
        function patientConnect() {
            setStep('step3', 'active');
            setStatus('Пациент подключается...');

            log('[EmAI] Push-уведомление отправлено пациенту', 'warn');
            log('[Приложение] Пациент видит: "Запись подтверждена, ссылка получена"', 'info');

            window.open(state.patientLink, '_blank');

            document.getElementById('details3').innerHTML =
                '<span class="method">Открыто в браузере (инкогнито):</span><br>' +
                '<span class="url" style="word-break:break-all">' + state.patientLink + '</span><br><br>' +
                '<span style="color:#94a3b8">JWT payload:</span><br>' +
                '<pre style="color:#fbbf24" id="jwtPatient"></pre>';

            try {
                var token = state.patientLink.split('jwt=')[1];
                var parts = token.split('.');
                var payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
                document.getElementById('jwtPatient').textContent = jsonPretty(payload);
            } catch(e) {
                document.getElementById('jwtPatient').textContent = '(не удалось декодировать)';
            }

            log('[Jitsi] Пациент подключён с ролью member (ограниченные права)', 'ok');
            setStep('step3', 'success');
            setStatus('Пациент подключён');
        }

        // ===== STEP 4 =====
        function completeConsultation() {
            setStep('step4', 'active');
            setStatus('Завершение консультации...');

            log('[1С] Обработка "Видеоконсультация" → Завершить', 'info');

            var payload = {
                sessionID: state.sessionId,
                emaiSessionID: String(state.emaiSessionId),
                action: 'COMPLETE',
                eventTime: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
            };

            apiCall('complete', payload)
            .then(function(data) {
                if (data.success) {
                    setStep('step4', 'success');
                    setStatus('Консультация завершена!');
                    log('[Middleware] POST → EmAI/?action=complete', 'warn');
                    log('[EmAI] success=true, action=COMPLETE', 'ok');
                    log('[1С] РС → ПриемЗапланирован = Ложь, ПриемПроведен = Истина', 'ok');

                    document.getElementById('details4').innerHTML =
                        '<span class="method">POST</span> <span class="url">' + getBaseUrl() + '/?action=complete</span>' +
                        '<div class="response" style="margin-top:8px"><div class="label">Запрос:</div>' +
                        '<pre style="color:#94a3b8">' + jsonPretty(payload) + '</pre></div>' +
                        '<div class="response"><div class="label">Ответ:</div>' +
                        '<pre style="color:#4ade80">' + jsonPretty(data) + '</pre></div>';

                    document.getElementById('btnComplete').disabled = true;
                } else {
                    setStep('step4', 'error');
                    setStatus('Ошибка: ' + data.message);
                    log('[EmAI] ОШИБКА: ' + data.message, 'err');
                }
            })
            .catch(function(err) {
                setStep('step4', 'error');
                setStatus('Ошибка: ' + err.message);
                log('[Middleware] ОШИБКА: ' + err.message, 'err');
            });
        }

        // ===== RESET =====
        function resetDemo() {
            state.sessionId = generateSessionId();
            state.emaiSessionId = null;
            state.doctorLink = '';
            state.patientLink = '';

            ['step1','step2','step3','step4'].forEach(function(id) {
                document.getElementById(id).className = 'step';
                document.getElementById('details' + id.charAt(4)).innerHTML = '';
            });

            document.getElementById('details1').innerHTML = '';
            document.getElementById('details2').innerHTML = '';
            document.getElementById('details3').innerHTML = '';
            document.getElementById('details4').innerHTML = '';

            document.getElementById('btnStart').disabled = false;
            document.getElementById('btnStart').textContent = 'Запустить демо';
            document.getElementById('btnStep2').disabled = true;
            document.getElementById('btnStep3').disabled = true;
            document.getElementById('btnComplete').disabled = true;

            setStatus('Ожидание запуска демо');
            log('--- Демо сброшено. Новый sessionID: ' + state.sessionId + ' ---', 'warn');
        }

        // Инициализация
        state.sessionId = generateSessionId();
    </script>

</body>
</html>
