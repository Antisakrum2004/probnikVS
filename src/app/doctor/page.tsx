'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Room, ApiLogEntry } from '@/lib/types';

const STATUS_CONFIG = {
  waiting: { label: 'Ожидание', color: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  active: { label: 'Активна', color: 'bg-green-100 text-green-800 border-green-300', dot: 'bg-green-500' },
  completed: { label: 'Завершена', color: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400' },
  cancelled: { label: 'Отменена', color: 'bg-red-100 text-red-700 border-red-300', dot: 'bg-red-500' },
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 1C Title Bar */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-700 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-800">АРМ Врача</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-sm text-slate-700">Видеоконсультации</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-500 hidden sm:inline">Автообновление</span>
        </div>
      </div>

      {/* Command Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2 shrink-0">
        <button
          onClick={() => { fetchRooms(); fetchLogs(); }}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded-sm px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Обновить
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded-sm px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Новая запись
        </Link>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-4 px-4 space-y-4">
          {/* Error */}
          {actionError && (
            <div className="bg-red-50 border border-red-300 rounded-sm px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-red-800">{actionError}</span>
              </div>
              <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {/* Section: Список консультаций */}
          <div className="border border-slate-300 rounded-sm bg-white">
            <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300 flex items-center justify-between">
              <span>Список консультаций</span>
              {activeRooms.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded-sm font-bold normal-case tracking-normal">
                  {activeRooms.length} активно
                </span>
              )}
            </div>

            {!loaded ? (
              <div className="p-8 flex items-center justify-center gap-2">
                <svg className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500">Загрузка данных...</span>
              </div>
            ) : activeRooms.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400">Нет активных консультаций</p>
                <p className="text-xs text-slate-300 mt-1">Создайте запись на приём на главной странице</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {activeRooms.map((room) => {
                  const statusCfg = STATUS_CONFIG[room.status];
                  return (
                    <div key={room.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-slate-800">{room.patientName}</span>
                            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm border font-bold ${statusCfg.color}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot} ${room.status === 'waiting' ? 'animate-pulse' : ''}`} />
                              {statusCfg.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span>Врач: {room.doctorName}</span>
                            <span className="text-slate-300">|</span>
                            <span>{new Date(room.createdAt).toLocaleTimeString('ru-RU')}</span>
                            {room.emaiSessionId && (
                              <>
                                <span className="text-slate-300">|</span>
                                <span className="font-mono text-[10px] text-slate-400">EmAI: {room.emaiSessionId.substring(0, 12)}...</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          <Link
                            href={`/consultation/${room.id}?role=doctor`}
                            className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-sm px-3 py-1.5 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            Подключиться
                          </Link>

                          <button
                            onClick={() => handleComplete(room.id)}
                            disabled={completingId === room.id}
                            className="inline-flex items-center gap-1.5 bg-orange-100 border border-orange-300 hover:bg-orange-200 text-orange-700 text-xs font-medium rounded-sm px-3 py-1.5 transition-colors disabled:opacity-50"
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
                            Завершить
                          </button>

                          {cancelConfirmId === room.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleCancel(room.id)}
                                className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-sm transition-colors"
                              >
                                Подтвердить
                              </button>
                              <button
                                onClick={() => setCancelConfirmId(null)}
                                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 text-xs rounded-sm transition-colors"
                              >
                                Отмена
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setCancelConfirmId(room.id)}
                              className="inline-flex items-center gap-1.5 bg-red-50 border border-red-300 hover:bg-red-100 text-red-600 text-xs font-medium rounded-sm px-3 py-1.5 transition-colors"
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
          </div>

          {/* Section: Архив */}
          {archiveRooms.length > 0 && (
            <div className="border border-slate-300 rounded-sm bg-white">
              <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300 flex items-center justify-between">
                <span>Архив</span>
                <span className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold normal-case tracking-normal">
                  {archiveRooms.length}
                </span>
              </div>
              <div className="divide-y divide-slate-200">
                {archiveRooms.map((room) => {
                  const statusCfg = STATUS_CONFIG[room.status];
                  return (
                    <div key={room.id} className="px-4 py-3 opacity-60 hover:opacity-80 transition-opacity">
                      <div className="flex items-center gap-3 flex-wrap text-xs">
                        <span className="font-medium text-slate-600">{room.patientName}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-sm border font-bold ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        <span className="text-slate-400">← {room.doctorName}</span>
                        <span className="text-slate-300 ml-auto font-mono text-[10px]">
                          {new Date(room.createdAt).toLocaleTimeString('ru-RU')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible: Журнал обмена с EmAI */}
          <div className="border border-slate-300 rounded-sm bg-white overflow-hidden">
            <button
              onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
              className="w-full flex items-center justify-between px-4 py-2 bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-300 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span>Журнал обмена с EmAI</span>
                <span className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-bold normal-case tracking-normal">
                  {logs.length}
                </span>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-slate-500 transition-transform ${showLogs ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showLogs && (
              <div className="border-t border-slate-300 max-h-80 overflow-y-auto">
                {logs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">Записи отсутствуют</div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {logs.map((log, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-bold ${
                            log.direction === 'request'
                              ? 'bg-blue-100 text-blue-700'
                              : log.status && log.status >= 400
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                          }`}>
                            {log.direction === 'request' ? 'ЗАПРОС' : 'ОТВЕТ'}
                          </span>
                          <span className="text-xs text-slate-500 font-mono">{log.endpoint}</span>
                          {log.status && (
                            <span className="text-xs text-slate-400 font-mono">[{log.status}]</span>
                          )}
                          {log.duration && (
                            <span className="text-xs text-slate-400 font-mono">{log.duration}ms</span>
                          )}
                          <span className="text-xs text-slate-400 ml-auto">
                            {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                          </span>
                        </div>
                        <pre className="text-[11px] text-slate-600 bg-slate-100 rounded-sm p-2 overflow-x-auto max-h-32 font-mono leading-relaxed border border-slate-200">
                          {log.payload}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>

          <div className="h-4" />
        </div>
      </main>

      {/* Status Bar */}
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-xs text-slate-600">
            Консультаций: {activeRooms.length} активных, {archiveRooms.length} в архиве
          </span>
        </div>
        <span className="text-xs text-slate-400">
          {new Date().toLocaleTimeString('ru-RU')}
        </span>
      </div>
    </div>
  );
}
