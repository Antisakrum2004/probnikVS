'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import type { Room } from '@/lib/types';

function PatientContent({ roomId }: { roomId: string }) {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadRoom() {
      try {
        const res = await fetch(`/api/status?roomId=${encodeURIComponent(roomId)}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          setRoom(data.room);
        } else {
          setError('Консультация не найдена');
        }
      } catch {
        if (!cancelled) setError('Ошибка загрузки данных');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRoom();
    return () => { cancelled = true; };
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm">Загрузка данных консультации...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">
            {error || 'Консультация не найдена'}
          </h2>
          <p className="text-slate-400 text-sm">
            Данная консультация недоступна. Возможно, она была удалена или ссылка некорректна.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (room.status === 'completed') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-white">Консультация завершена</h2>
          <p className="text-slate-400 text-sm">
            Видеоконсультация с {room.doctorName} была успешно завершена.
          </p>
          {room.completedAt && (
            <p className="text-slate-500 text-xs">
              Завершена: {new Date(room.completedAt).toLocaleString('ru-RU')}
            </p>
          )}
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (room.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="text-5xl">🚫</div>
          <h2 className="text-xl font-bold text-white">Консультация отменена</h2>
          <p className="text-slate-400 text-sm">
            Данная видеоконсультация была отменена врачом. Свяжитесь с клиникой для получения информации.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-900">
      {/* Header */}
      <header className="shrink-0 border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/15 flex items-center justify-center text-lg">
            📱
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Видеоконсультация</h1>
            <p className="text-xs text-slate-500">Вход по push-уведомлению</p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm space-y-6">
          {/* Push notification simulation notice */}
          <div className="bg-sky-500/5 rounded-xl border border-sky-500/15 p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-sky-500/15 flex items-center justify-center text-base shrink-0 mt-0.5">
                🔔
              </div>
              <div>
                <p className="text-xs text-sky-400 font-medium mb-1">Push-уведомление</p>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Вы получили это уведомление от мобильного приложения МИС. В реальной системе при нажатии на push-уведомление открывается этот экран автоматически.
                </p>
              </div>
            </div>
          </div>

          {/* Consultation Info Card */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-4">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center text-3xl mx-auto mb-3">
                📞
              </div>
              <h2 className="text-xl font-bold text-white mb-1">Видеоконсультация</h2>
              <p className="text-slate-500 text-xs">Запланированная консультация</p>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-900/40 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Врач</span>
                  <span className="text-sm text-white font-medium">{room.doctorName}</span>
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Дата и время</span>
                  <span className="text-sm text-slate-300">
                    {new Date(room.createdAt).toLocaleString('ru-RU')}
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Тип консультации</span>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Видео
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/40 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Статус</span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Ожидание подключения врача
                  </span>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <Link
              href={`/consultation/${room.id}?role=patient`}
              className="block w-full py-4 bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-base shadow-lg shadow-sky-500/20 hover:shadow-sky-500/30"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Подключиться к видеосвязи
            </Link>
          </div>

          <p className="text-center text-slate-600 text-xs leading-relaxed">
            Нажимая «Подключиться», вы соглашаетесь с условиями проведения телемедицинской консультации
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PatientRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    params.then((p) => {
      if (!cancelled) setRoomId(p.roomId);
    });
    return () => { cancelled = true; };
  }, [params]);

  if (!roomId) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PatientContent roomId={roomId} />
    </Suspense>
  );
}
