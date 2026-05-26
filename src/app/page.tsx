'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Room, ApiLogEntry } from '@/lib/types';

/* Version display hook */
function useVersion() {
  const [version, setVersion] = useState('');
  useEffect(() => {
    fetch('/api/version')
      .then(r => r.json())
      .then(d => setVersion(d.version))
      .catch(() => setVersion('?.?.?'));
  }, []);
  return version;
}

/* SVG Icons — 1C Navigation */
function IconGrid() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor">
      <rect x="1" y="1" width="7" height="7" />
      <rect x="12" y="1" width="7" height="7" />
      <rect x="1" y="12" width="7" height="7" />
      <rect x="12" y="12" width="7" height="7" />
    </svg>
  );
}

function IconBook() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="2" width="14" height="16" />
      <line x1="7" y1="2" x2="7" y2="18" />
      <line x1="10" y1="6" x2="15" y2="6" />
      <line x1="10" y1="9" x2="15" y2="9" />
      <line x1="10" y1="12" x2="15" y2="12" />
    </svg>
  );
}

function IconList() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <line x1="5" y1="4" x2="17" y2="4" />
      <line x1="5" y1="10" x2="17" y2="10" />
      <line x1="5" y1="16" x2="17" y2="16" />
      <circle cx="2" cy="4" r="1" fill="currentColor" />
      <circle cx="2" cy="10" r="1" fill="currentColor" />
      <circle cx="2" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="12" width="3" height="6" fill="currentColor" />
      <rect x="7" y="8" width="3" height="10" fill="currentColor" />
      <rect x="12" y="4" width="3" height="14" fill="currentColor" />
      <rect x="17" y="1" width="3" height="17" fill="currentColor" />
    </svg>
  );
}

/* 1C Logo */
function Logo1C() {
  return (
    <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <rect width="16" height="16" rx="1" fill="#2B5879" />
      <text x="3" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">1C</text>
    </svg>
  );
}

/* Arrow icons */
function ArrowDown() {
  return (
    <svg className="c1-group-arrow" viewBox="0 0 9 9" fill="currentColor">
      <path d="M1 3L4.5 7L8 3H1Z" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg className="c1-group-arrow" viewBox="0 0 9 9" fill="currentColor">
      <path d="M3 1L7 4.5L3 8V1Z" />
    </svg>
  );
}

/* Spinner */
function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ animation: 'c1-spin 0.6s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25" />
      <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" opacity="0.75" />
    </svg>
  );
}

/* Video icon */
function IconVideo() {
  return (
    <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 4C1 3.44772 1.44772 3 2 3H10C10.5523 3 11 3.44772 11 4V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V4Z" />
      <path d="M11 6L15 4V14L11 12" />
    </svg>
  );
}

export default function HomePage() {
  const version = useVersion();
  const [doctorName, setDoctorName] = useState('Доктор Петров П.П.');
  const [patientName, setPatientName] = useState('Иванов И.И.');
  const [patientId, setPatientId] = useState('22233');
  const [patientBirth, setPatientBirth] = useState('15.03.1985');
  const [patientPhone, setPatientPhone] = useState('+7 701 123 4567');
  const [doctorSpecId, setDoctorSpecId] = useState('QWERTY');
  const [doctorSpec, setDoctorSpec] = useState('Терапевт');
  const [consultType, setConsultType] = useState('Видеоконсультация');
  const [consultDuration, setConsultDuration] = useState('60 мин');
  const [creating, setCreating] = useState(false);
  const [createdRoom, setCreatedRoom] = useState<Room | null>(null);
  const [error, setError] = useState('');
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch {
      // ignore
    }
  };

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    setCreatedRoom(null);

    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorName,
          patientName,
          patientId,
          doctorSpecId,
          callEmAI: true,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setCreatedRoom(data.room);
        setShowLogs(true);
        await fetchLogs();
      } else {
        setError(data.error || 'Ошибка создания записи');
      }
    } catch {
      setError('Ошибка подключения к серверу');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ===== 1. Title Bar ===== */}
      <div className="c1-title-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Logo1C />
          <span className="c1-title-bar-text">1С:МИС</span>
          <span className="c1-title-bar-separator">|</span>
          <span className="c1-title-bar-active">Запись на приём</span>
        </div>
        <span className="c1-title-bar-muted">Эмуляция</span>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ===== 2. Navigation Panel ===== */}
        <div className="c1-nav-panel">
          <div className="c1-nav-btn active" title="Разделы">
            <IconGrid />
          </div>
          <div className="c1-nav-btn" title="Справочники">
            <IconBook />
          </div>
          <div className="c1-nav-btn" title="Документы">
            <IconList />
          </div>
          <div className="c1-nav-btn" title="Отчёты">
            <IconChart />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* ===== 3. Command Toolbar ===== */}
          <div className="c1-toolbar">
            <button className="c1-toolbar-btn" disabled={creating} onClick={handleCreate}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="7" y1="1" x2="7" y2="13" />
                <line x1="1" y1="7" x2="13" y2="7" />
              </svg>
              Создать и закрыть
            </button>
            <button className="c1-toolbar-btn" disabled={creating} onClick={handleCreate}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="7" y1="1" x2="7" y2="13" />
                <line x1="1" y1="7" x2="13" y2="7" />
              </svg>
              Создать
            </button>
            <button className="c1-toolbar-btn" disabled={!createdRoom}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M2 10v2h2l7-7-2-2L2 10z" />
                <path d="M9 3l2-2 2 2-2 2" />
              </svg>
              Записать
            </button>
            <div className="c1-toolbar-sep" />
            <button className="c1-toolbar-btn c1-toolbar-btn-green" disabled={!createdRoom}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7l3 3 5-5" />
              </svg>
              Провести и закрыть
            </button>
            <div className="c1-toolbar-sep" />
            <button className="c1-toolbar-btn" disabled>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="2" x2="12" y2="12" />
                <line x1="12" y1="2" x2="2" y2="12" />
              </svg>
              Отмена
            </button>
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>
              {new Date().toLocaleDateString('ru-RU')}
            </span>
          </div>

          {/* ===== 4. Form Area ===== */}
          <div className="c1-form-area">
            <div className="c1-form-container">

              {/* Success Notification */}
              {createdRoom && (
                <div className="c1-notification c1-notification-success">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="7" cy="7" r="6" />
                    <path d="M4 7l2 2 4-4" />
                  </svg>
                  <span>
                    <strong>Видеоконсультация создана.</strong>
                    <span style={{ marginLeft: 8, color: '#555', fontSize: 11 }}>
                      EmAI session: {createdRoom.emaiSessionId || '—'}
                    </span>
                  </span>
                </div>
              )}

              {/* Error Notification */}
              {error && (
                <div className="c1-notification c1-notification-error">
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="7" cy="7" r="6" />
                    <line x1="7" y1="4" x2="7" y2="8" />
                    <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              {/* Section: Пациент */}
              <div className="c1-group">
                <div className="c1-group-header">
                  <ArrowDown />
                  <span className="c1-group-title">Пациент</span>
                </div>
                <div className="c1-group-body">
                  <div className="c1-field-row">
                    <label className="c1-field-label">ФИО:</label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      className="c1-field-input"
                    />
                  </div>
                  <div className="c1-field-row">
                    <label className="c1-field-label">Дата рождения:</label>
                    <input
                      type="text"
                      value={patientBirth}
                      onChange={(e) => setPatientBirth(e.target.value)}
                      className="c1-field-input"
                    />
                  </div>
                  <div className="c1-field-row">
                    <label className="c1-field-label">Телефон:</label>
                    <input
                      type="text"
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      className="c1-field-input"
                    />
                  </div>
                  <div className="c1-field-row">
                    <label className="c1-field-label">personID:</label>
                    <input
                      type="text"
                      value={patientId}
                      onChange={(e) => setPatientId(e.target.value)}
                      className="c1-field-input c1-field-input-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Врач */}
              <div className="c1-group">
                <div className="c1-group-header">
                  <ArrowDown />
                  <span className="c1-group-title">Врач</span>
                </div>
                <div className="c1-group-body">
                  <div className="c1-field-row">
                    <label className="c1-field-label">ФИО:</label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      className="c1-field-input"
                    />
                  </div>
                  <div className="c1-field-row">
                    <label className="c1-field-label">Специальность:</label>
                    <input
                      type="text"
                      value={doctorSpec}
                      onChange={(e) => setDoctorSpec(e.target.value)}
                      className="c1-field-input"
                    />
                  </div>
                  <div className="c1-field-row">
                    <label className="c1-field-label">spec_id:</label>
                    <input
                      type="text"
                      value={doctorSpecId}
                      onChange={(e) => setDoctorSpecId(e.target.value)}
                      className="c1-field-input c1-field-input-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Параметры консультации */}
              <div className="c1-group">
                <div className="c1-group-header">
                  <ArrowDown />
                  <span className="c1-group-title">Параметры консультации</span>
                </div>
                <div className="c1-group-body">
                  <div className="c1-field-row">
                    <label className="c1-field-label">Тип:</label>
                    <div className="c1-field-select-wrapper">
                      <select
                        value={consultType}
                        onChange={(e) => setConsultType(e.target.value)}
                        className="c1-field-select"
                      >
                        <option>Видеоконсультация</option>
                        <option>Аудиоконсультация</option>
                        <option>Чат-консультация</option>
                      </select>
                      <svg className="c1-select-arrow" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M2 4L5 7L8 4H2Z" />
                      </svg>
                    </div>
                  </div>
                  <div className="c1-field-row">
                    <label className="c1-field-label">Длительность:</label>
                    <div className="c1-field-select-wrapper">
                      <select
                        value={consultDuration}
                        onChange={(e) => setConsultDuration(e.target.value)}
                        className="c1-field-select"
                      >
                        <option>30 мин</option>
                        <option>60 мин</option>
                        <option>90 мин</option>
                      </select>
                      <svg className="c1-select-arrow" viewBox="0 0 10 10" fill="currentColor">
                        <path d="M2 4L5 7L8 4H2Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Create Video Button */}
              <div style={{ padding: '8px 0' }}>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="c1-btn-primary"
                >
                  {creating ? (
                    <>
                      <Spinner />
                      Создание видеосвязи...
                    </>
                  ) : (
                    <>
                      <IconVideo />
                      Создать видеосвязь
                    </>
                  )}
                </button>
              </div>

              {/* ===== After creation sections ===== */}
              {createdRoom && (
                <>
                  {/* Section: Push notification */}
                  <div className="c1-group">
                    <div className="c1-group-header">
                      <ArrowDown />
                      <span className="c1-group-title">Эмуляция push-уведомления пациенту</span>
                    </div>
                    <div className="c1-group-body">
                      <p style={{ fontSize: 12, color: '#555', marginBottom: 8, lineHeight: 1.5 }}>
                        В реальной системе платформа EmAI автоматически отправляет push-уведомление
                        на мобильное устройство пациента. Ниже — имитация перехода из push-уведомления
                        в приложение пациента.
                      </p>
                      <Link
                        href={`/patient/${createdRoom.id}?data=${encodeURIComponent(btoa(JSON.stringify({
                          id: createdRoom.id,
                          roomName: createdRoom.roomName,
                          doctorName: createdRoom.doctorName,
                          patientName: createdRoom.patientName,
                          patientId: createdRoom.patientId,
                          doctorSpecId: createdRoom.doctorSpecId,
                          status: createdRoom.status,
                          createdAt: createdRoom.createdAt,
                          emaiSessionId: createdRoom.emaiSessionId,
                          sessionID: createdRoom.sessionID,
                        })))}`}
                        className="c1-btn-action c1-btn-action-blue"
                        style={{ textDecoration: 'none' }}
                      >
                        Отправить push (web)
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
                          <path d="M2 5h6M7 2l3 3-3 3" />
                        </svg>
                      </Link>
                      <p style={{ fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.4 }}>
                        Для APK: скопируйте ссылку ниже и откройте на устройстве пациента.
                        Данные комнаты встроены в URL — работает без API.
                      </p>
                      <div style={{ marginTop: 6, padding: 6, background: '#F5F5F5', border: '1px solid #D0D0D0', borderRadius: 2 }}>
                        <input
                          readOnly
                          value={`https://probnik-vs-app.vercel.app/patient/${createdRoom.id}?data=${encodeURIComponent(btoa(JSON.stringify({
                            id: createdRoom.id,
                            roomName: createdRoom.roomName,
                            doctorName: createdRoom.doctorName,
                            patientName: createdRoom.patientName,
                            patientId: createdRoom.patientId,
                            doctorSpecId: createdRoom.doctorSpecId,
                            status: createdRoom.status,
                            createdAt: createdRoom.createdAt,
                            emaiSessionId: createdRoom.emaiSessionId,
                            sessionID: createdRoom.sessionID,
                          })))}`}
                          style={{ width: '100%', fontSize: 10, fontFamily: 'monospace', border: 'none', background: 'transparent', color: '#333', padding: 2 }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section: ARM link */}
                  <div className="c1-group">
                    <div className="c1-group-header">
                      <ArrowDown />
                      <span className="c1-group-title">Ссылка для АРМ Врача</span>
                    </div>
                    <div className="c1-group-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <div>
                        <p style={{ fontSize: 12, color: '#555', marginBottom: 2 }}>Рабочее место врача — мониторинг консультаций</p>
                        <p style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>/doctor</p>
                      </div>
                      <Link
                        href="/doctor"
                        className="c1-btn-action c1-btn-action-gray"
                        style={{ textDecoration: 'none' }}
                      >
                        Открыть АРМ
                        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 10, height: 10 }}>
                          <path d="M2 2h4v4H2zM6 4l3 3M9 4v4H5" />
                        </svg>
                      </Link>
                    </div>
                  </div>

                  {/* Section: Log */}
                  <div className="c1-group">
                    <div
                      className="c1-group-header"
                      onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
                    >
                      {showLogs ? <ArrowDown /> : <ArrowRight />}
                      <span className="c1-group-title">Журнал обмена с EmAI</span>
                      <span className="c1-group-badge">{logs.length}</span>
                    </div>
                    <div className={`c1-group-body ${showLogs ? '' : 'c1-group-body-collapsed'}`} style={{ padding: 0 }}>
                      {showLogs && (
                        <div style={{ maxHeight: 384, overflowY: 'auto' }}>
                          {logs.length === 0 ? (
                            <div className="c1-empty-state">Записи отсутствуют</div>
                          ) : (
                            logs.map((log, i) => (
                              <div key={i} className="c1-log-entry">
                                <div className="c1-log-header">
                                  <span className={`c1-log-badge ${
                                    log.direction === 'request'
                                      ? 'c1-log-badge-request'
                                      : log.status && log.status >= 400
                                        ? 'c1-log-badge-response-err'
                                        : 'c1-log-badge-response-ok'
                                  }`}>
                                    {log.direction === 'request' ? 'ЗАПРОС' : 'ОТВЕТ'}
                                  </span>
                                  <span className="c1-log-endpoint">{log.endpoint}</span>
                                  {log.status && (
                                    <span className="c1-log-status">[{log.status}]</span>
                                  )}
                                  {log.duration && (
                                    <span className="c1-log-status">{log.duration}ms</span>
                                  )}
                                  <span className="c1-log-time">
                                    {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                                  </span>
                                </div>
                                <pre className="c1-log-payload">{log.payload}</pre>
                              </div>
                            ))
                          )}
                          <div ref={logsEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Bottom padding */}
              <div style={{ height: 8 }} />
            </div>
          </div>

          {/* ===== 5. Status Bar ===== */}
          <div className="c1-status-bar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className={`c1-status-dot ${createdRoom ? 'c1-status-dot-green' : 'c1-status-dot-gray'}`} />
              <span>{createdRoom ? 'Документ проведён' : 'Новый документ'}</span>
            </div>
            <span>v{version} | Jitsi Meet (демо)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
