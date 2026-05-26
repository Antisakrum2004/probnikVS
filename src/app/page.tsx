'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Room, ApiLogEntry } from '@/lib/types';

export default function HomePage() {
  const [doctorName, setDoctorName] = useState('Доктор Петров П.П.');
  const [patientName, setPatientName] = useState('Иванов И.И.');
  const [patientId, setPatientId] = useState('22233');
  const [doctorSpecId, setDoctorSpecId] = useState('QWERTY');
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
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Hero Section */}
      <header className="relative overflow-hidden border-b border-slate-800">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-transparent to-sky-900/20 pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 py-10 sm:py-14 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Демонстрационная среда
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
            Видеоконсультации МИС
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
            Интеграция 1С:МИС → EmAI API → Push-уведомление → Jitsi Meet
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-8">
        {/* 1C Request Form */}
        <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-sm">
              📋
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Эмуляция запроса 1С → EmAI</h2>
              <p className="text-xs text-slate-500">Заполните данные для создания записи на приём</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">ФИО Врача</label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">ФИО Пациента</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">ID Пациента (personID)</label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">ID Специальности врача (spec_id)</label>
              <input
                type="text"
                value={doctorSpecId}
                onChange={(e) => setDoctorSpecId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 text-sm font-mono"
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:from-emerald-800 disabled:to-emerald-700 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20"
          >
            {creating ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Отправка запроса в EmAI...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Создать запись на приём (эмуляция 1С → EmAI)
              </>
            )}
          </button>
        </section>

        {/* Result Section - shown after creation */}
        {createdRoom && (
          <>
            {/* Room Created Info */}
            <section className="bg-emerald-500/5 rounded-xl border border-emerald-500/20 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-emerald-400">Комната создана</h3>
                <span className="text-xs text-slate-500 font-mono ml-auto">
                  {createdRoom.roomName}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">EmAI Session</p>
                  <p className="text-white font-mono truncate">
                    {createdRoom.emaiSessionId || '—'}
                  </p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">Статус</p>
                  <p className="text-amber-400">Ожидание</p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">Пациент</p>
                  <p className="text-white truncate">{createdRoom.patientName}</p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-2.5">
                  <p className="text-slate-500 mb-0.5">Врач</p>
                  <p className="text-white truncate">{createdRoom.doctorName}</p>
                </div>
              </div>
            </section>

            {/* Two Action Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Doctor Card */}
              <Link
                href="/doctor"
                className="group relative overflow-hidden rounded-xl border border-emerald-500/30 bg-slate-800/60 backdrop-blur-sm p-6 hover:border-emerald-400/60 hover:bg-emerald-950/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center text-2xl shrink-0 group-hover:bg-emerald-500/25 transition-colors">
                    👨‍⚕️
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-emerald-400 mb-1">Открыть АРМ Врача</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Рабочее место врача — мониторинг и подключение к консультациям
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-emerald-500/50 text-xs font-medium group-hover:text-emerald-400 transition-colors">
                  <span>Перейти</span>
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>

              {/* Patient Card */}
              <Link
                href={`/patient/${createdRoom.id}`}
                className="group relative overflow-hidden rounded-xl border border-sky-500/30 bg-slate-800/60 backdrop-blur-sm p-6 hover:border-sky-400/60 hover:bg-sky-950/20 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-500/15 flex items-center justify-center text-2xl shrink-0 group-hover:bg-sky-500/25 transition-colors">
                    📱
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-sky-400 mb-1">Симуляция push-уведомления</h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      В реальной системе пациент получает push-уведомление в мобильном приложении МИС и переходит сюда
                    </p>
                  </div>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1 text-sky-500/50 text-xs font-medium group-hover:text-sky-400 transition-colors">
                  <span>Открыть</span>
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            </section>

            {/* EmAI API Log */}
            <section className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
              <button
                onClick={() => { setShowLogs(!showLogs); if (!showLogs) fetchLogs(); }}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-700/20 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">📊</span>
                  <h3 className="text-sm font-semibold text-white">EmAI API Log</h3>
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                    {logs.length} записей
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
                <div className="border-t border-slate-700/50 max-h-96 overflow-y-auto">
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
                              <span className="text-xs text-slate-600 font-mono">
                                [{log.status}]
                              </span>
                            )}
                            {log.duration && (
                              <span className="text-xs text-slate-600 font-mono">
                                {log.duration}ms
                              </span>
                            )}
                            <span className="text-xs text-slate-600 ml-auto">
                              {new Date(log.timestamp).toLocaleTimeString('ru-RU')}
                            </span>
                          </div>
                          <pre className="text-xs text-slate-400 bg-slate-900/50 rounded-lg p-2 overflow-x-auto max-h-40 font-mono leading-relaxed">
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
          </>
        )}

        {/* Flow Diagram */}
        <section className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-6">
          <h3 className="text-sm font-semibold text-slate-400 mb-5 text-center uppercase tracking-wider">
            Архитектура потока данных
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-2">
            {[
              { icon: '🖥️', label: '1С:МИС', color: 'border-amber-500/40 bg-amber-500/5' },
              { icon: '→', label: '', color: '' },
              { icon: '🤖', label: 'EmAI API', color: 'border-violet-500/40 bg-violet-500/5' },
              { icon: '→', label: '', color: '' },
              { icon: '📱', label: 'Push пациенту', color: 'border-sky-500/40 bg-sky-500/5' },
              { icon: '↕', label: '', color: '' },
              { icon: '👨‍⚕️', label: 'Врач (АРМ)', color: 'border-emerald-500/40 bg-emerald-500/5' },
              { icon: '→', label: '', color: '' },
              { icon: '📹', label: 'Jitsi Meet', color: 'border-blue-500/40 bg-blue-500/5' },
              { icon: '→', label: '', color: '' },
              { icon: '🔗', label: 'Видеосвязь', color: 'border-pink-500/40 bg-pink-500/5' },
            ].map((item, i) =>
              item.label === '' ? (
                <span key={i} className="text-slate-600 text-lg hidden sm:block">{item.icon}</span>
              ) : (
                <div
                  key={i}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${item.color} shrink-0`}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{item.label}</span>
                </div>
              )
            )}
          </div>
          <div className="mt-4 sm:hidden flex items-center justify-center gap-1">
            {['1С:МИС', 'EmAI', 'Push', 'АРМ', 'Jitsi', 'Видео'].map((s, i) => (
              <span key={i} className="text-xs text-slate-600">
                {i > 0 && ' → '}{s}
              </span>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 mt-auto">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-slate-600 text-xs">
            Платформа Jitsi: meet.jit.si (демо-режим)
          </span>
        </div>
      </footer>
    </div>
  );
}
