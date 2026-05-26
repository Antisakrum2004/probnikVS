'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Room, ApiLogEntry } from '@/lib/types';

/* SVG Icons */
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

function Logo1C() {
  return (
    <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16, flexShrink: 0 }}>
      <rect width="16" height="16" rx="1" fill="#2B5879" />
      <text x="3" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">1C</text>
    </svg>
  );
}

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

function StatusIndicator({ status }: { status: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    waiting: { label: 'Ожидание', cls: 'c1-status-waiting' },
    active: { label: 'Активна', cls: 'c1-status-active' },
    completed: { label: 'Завершена', cls: 'c1-status-completed' },
    cancelled: { label: 'Отменена', cls: 'c1-status-cancelled' },
  };
  const c = cfg[status] || cfg.waiting;
  return (
    <span className={`c1-status-indicator ${c.cls}`}>
      <span className={`c1-status-dot-sm ${status === 'waiting' ? 'c1-pulse' : ''}`} />
      {c.label}
    </span>
  );
}

export default function DoctorPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [logs, setLogs] = useState<ApiLogEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  const mountedRef = useRef(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const res = await fetch('/api/rooms');
      if (res.ok && mountedRef.current) {
        const data = await res.json();
        if (mountedRef.current) {
          setRooms(data.rooms || []);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch('/api/logs');
      if (res.ok && mountedRef.current) {
        const data = await res.json();
        if (mountedRef.current) {
          setLogs(data.logs || []);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    const doInitialLoad = () => {
      Promise.all([fetchRooms(), fetchLogs()]).finally(() => {
        if (mountedRef.current) setLoaded(true);
      });
    };

    const timer = setTimeout(doInitialLoad, 0);

    const interval = setInterval(() => {
      fetchRooms();
      if (showLogs) fetchLogs();
    }, 5000);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [fetchRooms, fetchLogs, showLogs]);

  useEffect(() => {
    if (showLogs && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, showLogs]);

  const handleComplete = async (roomId: string) => {
    setCompletingId(roomId);
    setActionError('');
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (res.ok) {
        await fetchRooms();
        await fetchLogs();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Ошибка завершения');
      }
    } catch {
      setActionError('Ошибка подключения к серверу');
    } finally {
      setCompletingId(null);
    }
  };

  const handleCancel = async (roomId: string) => {
    setCancelConfirmId(null);
    setActionError('');
    try {
      const res = await fetch('/api/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (res.ok) {
        await fetchRooms();
        await fetchLogs();
      } else {
        const data = await res.json();
        setActionError(data.error || 'Ошибка отмены');
      }
    } catch {
      setActionError('Ошибка подключения к серверу');
    }
  };

  const activeRooms = rooms.filter((r) => r.status === 'waiting' || r.status === 'active');
  const archiveRooms = rooms.filter((r) => r.status === 'completed' || r.status === 'cancelled');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ===== Title Bar ===== */}
      <div className="c1-title-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', color: '#666', textDecoration: 'none', marginRight: 2 }}>
            <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
              <path d="M9 2L3 7L9 12" />
            </svg>
          </Link>
          <Logo1C />
          <span className="c1-title-bar-text">1С:МИС</span>
          <span className="c1-title-bar-separator">|</span>
          <span className="c1-title-bar-active">АРМ Врача — Видеоконсультации</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="c1-status-dot-sm c1-pulse" style={{ background: '#4CAF50' }} />
          <span className="c1-title-bar-muted">Автообновление</span>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ===== Navigation Panel ===== */}
        <div className="c1-nav-panel">
          <div className="c1-nav-btn" title="Разделы">
            <IconGrid />
          </div>
          <div className="c1-nav-btn" title="Справочники">
            <IconBook />
          </div>
          <div className="c1-nav-btn active" title="Документы">
            <IconList />
          </div>
          <div className="c1-nav-btn" title="Отчёты">
            <IconChart />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          {/* ===== Command Toolbar ===== */}
          <div className="c1-toolbar">
            <button
              className="c1-toolbar-btn"
              onClick={() => { fetchRooms(); fetchLogs(); }}
            >
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 7a6 6 0 0111.3-2.8M13 7a6 6 0 01-11.3 2.8" />
                <path d="M13 4v3h-3M1 10v-3h3" />
              </svg>
              Обновить
            </button>
            <Link href="/" className="c1-toolbar-btn" style={{ textDecoration: 'none', color: 'inherit' }}>
              <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="7" y1="1" x2="7" y2="13" />
                <line x1="1" y1="7" x2="13" y2="7" />
              </svg>
              Новая запись
            </Link>
            <div style={{ flex: 1 }} />
            {activeRooms.length > 0 && (
              <span style={{ fontSize: 11, color: '#2B5879', fontWeight: 600 }}>
                {activeRooms.length} активно
              </span>
            )}
          </div>

          {/* ===== Form Area ===== */}
          <div className="c1-form-area" style={{ padding: 0 }}>
            <div style={{ maxWidth: 960, margin: '0 auto' }}>

              {/* Error */}
              {actionError && (
                <div className="c1-notification c1-notification-error" style={{ margin: 6 }}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 14, height: 14, flexShrink: 0 }}>
                    <circle cx="7" cy="7" r="6" />
                    <line x1="7" y1="4" x2="7" y2="8" />
                    <circle cx="7" cy="10.5" r="0.5" fill="currentColor" />
                  </svg>
                  <span style={{ flex: 1 }}>{actionError}</span>
                  <button onClick={() => setActionError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C62828', padding: '0 2px' }}>
                    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                      <line x1="3" y1="3" x2="11" y2="11" />
                      <line x1="11" y1="3" x2="3" y2="11" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Active Consultations — 1C Dynamic List */}
              <div className="c1-group" style={{ margin: 6, marginBottom: 2 }}>
                <div className="c1-group-header">
                  <ArrowDown />
                  <span className="c1-group-title">Список консультаций</span>
                  {activeRooms.length > 0 && (
                    <span className="c1-group-badge" style={{ background: '#2B5879' }}>{activeRooms.length}</span>
                  )}
                </div>
                <div className="c1-group-body" style={{ padding: 0 }}>
                  {!loaded ? (
                    <div className="c1-empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="c1-spinner" />
                      Загрузка данных...
                    </div>
                  ) : activeRooms.length === 0 ? (
                    <div className="c1-empty-state">
                      Нет активных консультаций. Создайте запись на приём на главной странице.
                    </div>
                  ) : (
                    <div className="c1-grid-wrapper">
                      {/* Grid Header */}
                      <div className="c1-grid-header-row">
                        <div className="c1-grid-header-cell" style={{ flex: '2 1 0', minWidth: 140 }}>Пациент</div>
                        <div className="c1-grid-header-cell" style={{ flex: '2 1 0', minWidth: 140 }}>Врач</div>
                        <div className="c1-grid-header-cell" style={{ flex: '1 1 0', minWidth: 100 }}>Дата</div>
                        <div className="c1-grid-header-cell" style={{ flex: '1 1 0', minWidth: 90 }}>Статус</div>
                        <div className="c1-grid-header-cell" style={{ flex: '1 1 0', minWidth: 100 }}>EmAI Session</div>
                        <div className="c1-grid-header-cell" style={{ flex: '0 0 auto', minWidth: 220 }}>Действия</div>
                      </div>

                      {/* Grid Rows */}
                      {activeRooms.map((room) => (
                        <div key={room.id} className="c1-grid-row">
                          <div className="c1-grid-cell" style={{ flex: '2 1 0', minWidth: 140 }}>
                            {room.patientName}
                          </div>
                          <div className="c1-grid-cell" style={{ flex: '2 1 0', minWidth: 140 }}>
                            {room.doctorName}
                          </div>
                          <div className="c1-grid-cell" style={{ flex: '1 1 0', minWidth: 100, fontSize: 12 }}>
                            {new Date(room.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                          <div className="c1-grid-cell" style={{ flex: '1 1 0', minWidth: 90 }}>
                            <StatusIndicator status={room.status} />
                          </div>
                          <div className="c1-grid-cell c1-grid-cell-mono" style={{ flex: '1 1 0', minWidth: 100 }}>
                            {room.emaiSessionId ? room.emaiSessionId.substring(0, 16) : '—'}
                          </div>
                          <div className="c1-grid-cell c1-grid-cell-actions" style={{ flex: '0 0 auto', minWidth: 220 }}>
                            <Link
                              href={`/consultation/${room.id}?role=doctor`}
                              className="c1-btn-action c1-btn-action-blue"
                              style={{ textDecoration: 'none' }}
                            >
                              Подключиться
                            </Link>
                            <button
                              onClick={() => handleComplete(room.id)}
                              disabled={completingId === room.id}
                              className="c1-btn-action c1-btn-action-orange"
                            >
                              {completingId === room.id ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                  <span className="c1-spinner" style={{ width: 10, height: 10, borderWidth: 2 }} />
                                  Завершить
                                </span>
                              ) : 'Завершить'}
                            </button>
                            {cancelConfirmId === room.id ? (
                              <>
                                <button
                                  onClick={() => handleCancel(room.id)}
                                  className="c1-btn-action c1-btn-action-red"
                                >
                                  Подтвердить
                                </button>
                                <button
                                  onClick={() => setCancelConfirmId(null)}
                                  className="c1-btn-action c1-btn-action-gray"
                                >
                                  Отмена
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setCancelConfirmId(room.id)}
                                className="c1-btn-action c1-btn-action-red"
                              >
                                Отменить
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Archive */}
              {archiveRooms.length > 0 && (
                <div className="c1-group" style={{ margin: 6, marginBottom: 2 }}>
                  <div className="c1-group-header">
                    <ArrowDown />
                    <span className="c1-group-title">Архив</span>
                    <span className="c1-group-badge">{archiveRooms.length}</span>
                  </div>
                  <div className="c1-group-body" style={{ padding: 0 }}>
                    <div className="c1-grid-wrapper">
                      <div className="c1-grid-header-row">
                        <div className="c1-grid-header-cell" style={{ flex: '2 1 0', minWidth: 140 }}>Пациент</div>
                        <div className="c1-grid-header-cell" style={{ flex: '2 1 0', minWidth: 140 }}>Врач</div>
                        <div className="c1-grid-header-cell" style={{ flex: '1 1 0', minWidth: 100 }}>Дата</div>
                        <div className="c1-grid-header-cell" style={{ flex: '1 1 0', minWidth: 90 }}>Статус</div>
                        <div className="c1-grid-header-cell" style={{ flex: '1 1 0', minWidth: 100 }}>EmAI Session</div>
                      </div>
                      {archiveRooms.map((room) => (
                        <div key={room.id} className="c1-grid-row c1-grid-row-archive">
                          <div className="c1-grid-cell" style={{ flex: '2 1 0', minWidth: 140 }}>
                            {room.patientName}
                          </div>
                          <div className="c1-grid-cell" style={{ flex: '2 1 0', minWidth: 140 }}>
                            {room.doctorName}
                          </div>
                          <div className="c1-grid-cell" style={{ flex: '1 1 0', minWidth: 100, fontSize: 12 }}>
                            {new Date(room.createdAt).toLocaleString('ru-RU', {
                              day: '2-digit', month: '2-digit', year: '2-digit',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </div>
                          <div className="c1-grid-cell" style={{ flex: '1 1 0', minWidth: 90 }}>
                            <StatusIndicator status={room.status} />
                          </div>
                          <div className="c1-grid-cell c1-grid-cell-mono" style={{ flex: '1 1 0', minWidth: 100 }}>
                            {room.emaiSessionId ? room.emaiSessionId.substring(0, 16) : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Log Section */}
              <div className="c1-group" style={{ margin: 6 }}>
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
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
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

              <div style={{ height: 8 }} />
            </div>
          </div>

          {/* ===== Status Bar ===== */}
          <div className="c1-status-bar">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span className="c1-status-dot c1-status-dot-green c1-pulse" />
              <span>
                Консультаций: {activeRooms.length} активных, {archiveRooms.length} в архиве
              </span>
            </div>
            <span>{new Date().toLocaleTimeString('ru-RU')}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
