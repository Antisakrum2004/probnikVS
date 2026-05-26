'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Room, ApiLogEntry } from '@/lib/types';

export default function HomePage() {
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
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* 1C Title Bar */}
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-yellow-500 rounded-sm flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 16 16" fill="currentColor">
                <rect x="1" y="1" width="6" height="6" rx="0.5" />
                <rect x="9" y="1" width="6" height="6" rx="0.5" />
                <rect x="1" y="9" width="6" height="6" rx="0.5" />
                <rect x="9" y="9" width="6" height="6" rx="0.5" />
              </svg>
            </div>
            <span className="text-sm font-bold text-slate-800">1С:МИС</span>
          </div>
          <span className="text-slate-400">|</span>
          <span className="text-sm text-slate-700 font-semibold">Запись на приём</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Эмуляция</span>
          <div className="w-5 h-5 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer rounded-sm hover:bg-amber-100">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </div>

      {/* Command Toolbar */}
      <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2 shrink-0">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded-sm px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Создать
        </button>
        <button
          disabled={!createdRoom}
          className="inline-flex items-center gap-1.5 bg-white border border-slate-300 rounded-sm px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          Записать
        </button>
        <button
          disabled={!createdRoom}
          className="inline-flex items-center gap-1.5 bg-blue-600 border border-blue-600 rounded-sm px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Провести и закрыть
        </button>
        <div className="flex-1" />
        <span className="text-xs text-slate-400 font-mono">
          {new Date().toLocaleDateString('ru-RU')}
        </span>
      </div>

      {/* Main Form Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto py-4 space-y-1">
          {/* Success Notification */}
          {createdRoom && (
            <div className="bg-green-50 border border-green-300 rounded-sm px-4 py-2.5 flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <span className="text-sm font-medium text-green-800">Видеоконсультация создана.</span>
                <span className="text-xs text-green-600 ml-2">
                  EmAI session: {createdRoom.emaiSessionId || '—'}
                </span>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-300 rounded-sm px-4 py-2.5 flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-red-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {/* Section: Пациент */}
          <div className="border border-slate-300 rounded-sm bg-white">
            <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300">
              Пациент
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">ФИО:</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">Дата рожд.:</label>
                <input
                  type="text"
                  value={patientBirth}
                  onChange={(e) => setPatientBirth(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">Телефон:</label>
                <input
                  type="text"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">personID:</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          {/* Section: Врач */}
          <div className="border border-slate-300 rounded-sm bg-white">
            <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300">
              Врач
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">ФИО:</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">Специальн.:</label>
                <input
                  type="text"
                  value={doctorSpec}
                  onChange={(e) => setDoctorSpec(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">spec_id:</label>
                <input
                  type="text"
                  value={doctorSpecId}
                  onChange={(e) => setDoctorSpecId(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 font-mono focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>

          {/* Section: Параметры консультации */}
          <div className="border border-slate-300 rounded-sm bg-white">
            <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300">
              Параметры консультации
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">Тип:</label>
                <div className="relative flex-1">
                  <select
                    value={consultType}
                    onChange={(e) => setConsultType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 appearance-none pr-8"
                  >
                    <option>Видеоконсультация</option>
                    <option>Аудиоконсультация</option>
                    <option>Чат-консультация</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <label className="text-xs text-slate-600 w-24 shrink-0 text-right">Длительность:</label>
                <div className="relative flex-1">
                  <select
                    value={consultDuration}
                    onChange={(e) => setConsultDuration(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-sm text-sm text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 appearance-none pr-8"
                  >
                    <option>30 мин</option>
                    <option>60 мин</option>
                    <option>90 мин</option>
                  </select>
                  <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Big Create Button */}
          <div className="pt-2 pb-4">
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm px-6 py-2.5 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm transition-colors"
            >
              {creating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Создание видеосвязи...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Создать видеосвязь
                </>
              )}
            </button>
          </div>

          {/* After creation — Push notification section */}
          {createdRoom && (
            <>
              {/* Section: Эмуляция push-уведомления */}
              <div className="border border-slate-300 rounded-sm bg-white">
                <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300">
                  Эмуляция push-уведомления пациенту
                </div>
                <div className="p-4">
                  <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                    В реальной системе платформа EmAI автоматически отправляет push-уведомление на мобильное устройство пациента.
                    Ниже — имитация перехода из push-уведомления в приложение пациента.
                  </p>
                  <Link
                    href={`/patient/${createdRoom.id}`}
                    className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-sm px-4 py-2 text-xs transition-colors"
                  >
                    Отправить push
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Section: Ссылка для АРМ Врача */}
              <div className="border border-slate-300 rounded-sm bg-white">
                <div className="bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider px-4 py-2 border-b border-slate-300">
                  Ссылка для АРМ Врача
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-600 mb-0.5">Рабочее место врача — мониторинг консультаций</p>
                    <p className="text-xs text-slate-400 font-mono">{new URL('/doctor', typeof window !== 'undefined' ? window.location.origin : '').href}</p>
                  </div>
                  <Link
                    href="/doctor"
                    className="inline-flex items-center gap-1.5 bg-slate-100 border border-slate-300 hover:bg-slate-200 text-slate-700 font-medium rounded-sm px-4 py-2 text-xs transition-colors"
                  >
                    Открыть АРМ
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* Collapsible: Журнал обмена с EmAI */}
              <div className="border border-slate-300 rounded-sm bg-white overflow-hidden">
                <button
                  onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
                  className="w-full flex items-center justify-between px-4 py-2 bg-slate-200 text-slate-700 font-semibold text-xs uppercase tracking-wider hover:bg-slate-300 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>Журнал обмена с EmAI</span>
                    <span className="bg-slate-400 text-white text-[10px] px-1.5 py-0.5 rounded-sm font-medium">
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
                  <div className="border-t border-slate-300 max-h-96 overflow-y-auto">
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
            </>
          )}

          {/* Padding at bottom for status bar */}
          <div className="h-4" />
        </div>
      </main>

      {/* Status Bar */}
      <div className="bg-amber-50 border-t border-amber-200 px-4 py-1.5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${createdRoom ? 'bg-green-500' : 'bg-slate-400'}`} />
          <span className="text-xs text-slate-600">
            {createdRoom ? 'Документ проведён' : 'Новый документ'}
          </span>
        </div>
        <span className="text-xs text-slate-400">
          Платформа: Jitsi Meet (демо)
        </span>
      </div>
    </div>
  );
}
