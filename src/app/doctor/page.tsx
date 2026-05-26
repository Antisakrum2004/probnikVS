'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Room, ApiLogEntry } from '@/lib/types';

const STATUS_CONFIG = {
  waiting: { label: 'Ожидание', color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  active: { label: 'Активна', color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
  completed: { label: 'Завершена', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30', dot: 'bg-slate-500' },
  cancelled: { label: 'Отменена', color: 'bg-red-500/15 text-red-400 border-red-500/30', dot: 'bg-red-500' },
};

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

    // Defer initial fetch to avoid synchronous setState in effect
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
  const allRooms = rooms;

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-lg">
              👨‍⚕️
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">АРМ Врача</h1>
              <p className="text-xs text-slate-500">Рабочее место врача</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-slate-500 hidden sm:inline">
              Автообновление каждые 5 сек
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 space-y-6">
        {actionError && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between">
            <p className="text-red-400 text-sm">{actionError}</p>
            <button onClick={() => setActionError('')} className="text-red-400/60 hover:text-red-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Active / Waiting Consultations */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-white">Текущие консультации</h2>
            {activeRooms.length > 0 && (
              <span className="text-xs bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded-full font-medium">
                {activeRooms.length}
              </span>
            )}
          </div>

          {!loaded ? (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-8 text-center">
              <svg className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-500 text-sm">Загрузка...</p>
            </div>
          ) : activeRooms.length === 0 ? (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-8 text-center">
              <div className="text-3xl mb-2 opacity-50">📋</div>
              <p className="text-slate-500 text-sm">Нет активных консультаций</p>
              <p className="text-slate-600 text-xs mt-1">Создайте запись на приём на главной странице</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeRooms.map((room) => {
                const statusCfg = STATUS_CONFIG[room.status];
                return (
                  <div
                    key={room.id}
                    className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 hover:border-slate-600/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      {/* Main Info */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border font-medium ${statusCfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${room.status === 'waiting' ? 'animate-pulse' : ''}`} />
                            {statusCfg.label}
                          </span>
                          <span className="text-xs text-slate-600 font-mono">{room.roomName}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500">Пациент: </span>
                            <span className="text-white">{room.patientName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Врач: </span>
                            <span className="text-white">{room.doctorName}</span>
                          </div>
                          <div>
                            <span className="text-slate-500">Создана: </span>
                            <span className="text-slate-300">
                              {new Date(room.createdAt).toLocaleTimeString('ru-RU')}
                            </span>
                          </div>
                          {room.emaiSessionId && (
                            <div>
                              <span className="text-slate-500">EmAI: </span>
                              <span className="text-slate-300 font-mono text-[10px] truncate">
                                {room.emaiSessionId}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                        <Link
                          href={`/consultation/${room.id}?role=doctor`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          Подключиться к видео
                        </Link>

                        <button
                          onClick={() => handleComplete(room.id)}
                          disabled={completingId === room.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-orange-600/15 hover:bg-orange-600/25 text-orange-400 text-xs font-medium rounded-lg border border-orange-500/20 transition-colors disabled:opacity-50"
                        >
                          {completingId === room.id ? (
                            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                          Завершить консультацию
                        </button>

                        {cancelConfirmId === room.id ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleCancel(room.id)}
                              className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs rounded-lg transition-colors"
                            >
                              Подтвердить
                            </button>
                            <button
                              onClick={() => setCancelConfirmId(null)}
                              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-lg transition-colors"
                            >
                              Отмена
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCancelConfirmId(room.id)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-600/15 hover:bg-red-600/25 text-red-400 text-xs font-medium rounded-lg border border-red-500/20 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Отменить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Completed / Cancelled Consultations */}
        {allRooms.length > activeRooms.length && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-base font-semibold text-slate-400">Архив</h2>
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full font-medium">
                {allRooms.length - activeRooms.length}
              </span>
            </div>
            <div className="space-y-2">
              {allRooms
                .filter((r) => r.status === 'completed' || r.status === 'cancelled')
                .map((room) => {
                  const statusCfg = STATUS_CONFIG[room.status];
                  return (
                    <div
                      key={room.id}
                      className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-3 opacity-60"
                    >
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full border font-medium ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-slate-400">{room.patientName}</span>
                        <span className="text-slate-600">←</span>
                        <span className="text-slate-400">{room.doctorName}</span>
                        <span className="text-slate-600 ml-auto font-mono text-[10px]">
                          {new Date(room.createdAt).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </section>
        )}

        {/* EmAI Event Log */}
        <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
          <button
            onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
            className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">📊</span>
              <h3 className="text-sm font-semibold text-white">Журнал событий EmAI</h3>
              <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                {logs.length}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform ${showLogs ? 'rotate-180' : ''}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showLogs && (
            <div className="border-t border-slate-700/50 max-h-80 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">Логи отсутствуют</div>
              ) : (
                <div className="divide-y divide-slate-700/30">
                  {logs.map((log, i) => (
                    <div key={i} className="p-3 hover:bg-slate-700/10 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          log.direction === 'request'
                            ? 'bg-sky-500/15 text-sky-400'
                            : log.status && log.status >= 400
                              ? 'bg-red-500/15 text-red-400'
                              : 'bg-emerald-500/15 text-emerald-400'
                        }`}>
                          {log.direction === 'request' ? 'REQ' : 'RES'}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">{log.endpoint}</span>
                        {log.status && (
                          <span className="text-xs text-slate-600 font-mono">[{log.status}]</span>
                        )}
                        {log.duration && (
                          <span className="text-xs text-slate-600 font-mono">{log.duration}ms</span>
                        )}
                        <span className="text-xs text-slate-600 ml-auto">
                          {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                      <pre className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-2 overflow-x-auto max-h-32 font-mono leading-relaxed">
                        {log.payload}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
              <div ref={logsEndRef} />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
