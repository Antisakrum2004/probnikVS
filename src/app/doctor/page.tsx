'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { Room } from '@/lib/types';

export default function DoctorPage() {
  const [doctorName, setDoctorName] = useState('Доктор Петров П.П.');
  const [patientName, setPatientName] = useState('Пациент');
  const [creating, setCreating] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    async function fetchRooms() {
      try {
        const res = await fetch('/api/rooms');
        if (res.ok && mountedRef.current) {
          const data = await res.json();
          if (mountedRef.current) {
            setActiveRooms(data.rooms || []);
          }
        }
      } catch {
        // ignore
      }
    }

    fetchRooms();
    const interval = setInterval(fetchRooms, 5000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctorName, patientName }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentRoom(data.room);
        // Refresh active rooms
        const roomsRes = await fetch('/api/rooms');
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setActiveRooms(roomsData.rooms || []);
        }
      } else {
        setError('Ошибка создания комнаты');
      }
    } catch {
      setError('Ошибка подключения к серверу');
    } finally {
      setCreating(false);
    }
  };

  const handleCopyLink = () => {
    if (!currentRoom) return;
    const link = `${window.location.origin}/patient?code=${currentRoom.id.substring(0, 8)}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyCode = (roomId: string) => {
    navigator.clipboard.writeText(roomId.substring(0, 8)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👨‍⚕️</span>
            <h1 className="text-xl font-bold text-white">АРМ Врача</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Create Consultation Form */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-300 mb-4">Новая видеоконсультация</h2>
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Имя врача</label>
                <input
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Имя пациента</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>
            </div>
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {creating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Создание...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Создать видеоконсультацию
                </>
              )}
            </button>
          </div>
        </section>

        {/* Current Room Card */}
        {currentRoom && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-slate-300 mb-4">Текущая консультация</h2>
            <div className="bg-slate-800/50 rounded-xl border border-emerald-500/30 p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-medium text-sm">Активна</span>
                </div>
                <span className="text-slate-500 text-xs font-mono">
                  {new Date(currentRoom.createdAt).toLocaleString('ru-RU')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900/40 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Код комнаты</p>
                  <p className="text-lg font-mono font-bold text-white tracking-wider">
                    {currentRoom.id.substring(0, 8)}
                  </p>
                </div>
                <div className="bg-slate-900/40 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Имя в Jitsi</p>
                  <p className="text-sm font-mono text-slate-300 break-all">
                    {currentRoom.roomName}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Ссылка для пациента</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-sky-400 break-all flex-1">
                    {window.location.origin}/patient?code={currentRoom.id.substring(0, 8)}
                  </p>
                  <button
                    onClick={handleCopyLink}
                    className="shrink-0 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-md transition-colors"
                  >
                    {copied ? '✓ Скопировано' : 'Копировать'}
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-lg p-3 border border-dashed border-slate-700">
                <p className="text-xs text-slate-500 mb-1">
                  📷 QR-код (сканируйте на устройстве пациента)
                </p>
                <p className="text-xs text-slate-600">
                  Для отображения QR-кода отправьте ссылку выше через мессенджер или распечатайте
                </p>
              </div>

              <Link
                href={`/consultation/${currentRoom.id}?role=doctor`}
                className="block w-full sm:w-auto text-center px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
              >
                🎥 Подключиться
              </Link>
            </div>
          </section>
        )}

        {/* Active Rooms */}
        <section>
          <h2 className="text-lg font-semibold text-slate-300 mb-4">
            Активные консультации
            {activeRooms.length > 0 && (
              <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                {activeRooms.length}
              </span>
            )}
          </h2>
          {activeRooms.length === 0 ? (
            <div className="bg-slate-800/30 rounded-xl border border-slate-700/30 p-8 text-center">
              <p className="text-slate-500 text-sm">Нет активных консультаций</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeRooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="font-mono text-sm text-white">
                        {room.id.substring(0, 8)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">
                      {room.doctorName} → {room.patientName}
                    </p>
                    <p className="text-xs text-slate-600">
                      {new Date(room.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyCode(room.id)}
                      className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-md transition-colors"
                    >
                      📋 Код
                    </button>
                    <Link
                      href={`/consultation/${room.id}?role=doctor`}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-md transition-colors"
                    >
                      🎥 Войти
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
