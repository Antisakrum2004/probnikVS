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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 text-sm">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {error || 'Консультация не найдена'}
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Данная консультация недоступна. Обратитесь в регистратуру клиники для уточнения информации.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (room.status === 'completed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Консультация завершена</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Видеоконсультация с {room.doctorName} успешно завершена. Результаты будут доступны в вашей электронной медицинской карте.
          </p>
          {room.completedAt && (
            <p className="text-gray-400 text-xs">
              {new Date(room.completedAt).toLocaleString('ru-RU')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (room.status === 'cancelled') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Консультация отменена</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Данная видеоконсультация была отменена. Для записи на новый приём обратитесь в клинику.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shrink-0">
        <div className="max-w-lg mx-auto px-5 py-4">
          <div className="flex items-center gap-3">
            {/* Clinic logo placeholder */}
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-semibold text-gray-900 leading-tight">
                Телемедицинская консультация
              </h1>
              <p className="text-xs text-gray-500">Видеосвязь с врачом</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center px-5 py-8">
        <div className="w-full max-w-sm space-y-5">
          {/* Doctor Card */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {/* Doctor avatar area */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 px-5 py-6 text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3 shadow-md">
                {room.doctorName.charAt(0)}
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{room.doctorName}</h2>
              <p className="text-sm text-blue-600 mt-0.5">Врач-консультант</p>
            </div>

            {/* Consultation Details */}
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Дата и время</span>
                <span className="text-sm text-gray-800 font-medium">
                  {new Date(room.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Тип приёма</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Видеоконсультация
                </span>
              </div>

              <div className="h-px bg-gray-100" />

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Статус</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Ожидание
                </span>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <Link
            href={`/consultation/${room.id}?role=patient`}
            className="flex items-center justify-center gap-2 w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors text-base shadow-lg shadow-blue-600/20"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Подключиться к видеосвязи
          </Link>

          {/* Tips */}
          <div className="bg-blue-50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-medium text-blue-800">Перед началом консультации:</p>
            <ul className="text-xs text-blue-700/80 space-y-1 leading-relaxed list-disc list-inside">
              <li>Убедитесь, что камера и микрофон работают</li>
              <li>Найдите тихое место с хорошим освещением</li>
              <li>Подготовьте документы (если требуется)</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="pt-2 pb-6">
            <p className="text-center text-[10px] text-gray-400 leading-relaxed px-2">
              Нажимая «Подключиться к видеосвязи», вы подтверждаете согласие на проведение
              телемедицинской консультации и обработку персональных данных в соответствии
              с законодательством Республики Казахстан.
            </p>
          </div>
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <PatientContent roomId={roomId} />
    </Suspense>
  );
}
