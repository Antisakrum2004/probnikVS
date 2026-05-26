'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Room } from '@/lib/types';

function PatientForm() {
  const searchParams = useSearchParams();
  const preCode = searchParams.get('code') || '';

  const [code, setCode] = useState(preCode);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [patientName, setPatientName] = useState('Пациент');

  const handleJoin = async () => {
    if (!code.trim()) {
      setError('Введите код консультации');
      return;
    }

    setConnecting(true);
    setError('');

    try {
      const res = await fetch(`/api/status?roomId=${encodeURIComponent(code.trim())}`);
      const data = await res.json();

      if (!res.ok || !data.room) {
        setError('Консультация не найдена');
        setConnecting(false);
        return;
      }

      const room: Room = data.room;

      if (room.status === 'completed') {
        setError('Консультация уже завершена');
        setConnecting(false);
        return;
      }

      if (room.status === 'cancelled') {
        setError('Консультация отменена');
        setConnecting(false);
        return;
      }

      // Navigate to consultation
      window.location.href = `/consultation/${room.id}?role=patient&name=${encodeURIComponent(patientName)}`;
    } catch {
      setError('Ошибка подключения к серверу');
      setConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/" className="text-slate-500 hover:text-slate-300 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <h1 className="text-xl font-bold text-white">Видеоконсультация</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          {/* Info Card */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-sky-500/15 flex items-center justify-center text-4xl mx-auto mb-4">
              📞
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Вход в консультацию
            </h2>
            <p className="text-slate-400 text-sm">
              Введите код, полученный от врача
            </p>
          </div>

          {/* Form */}
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-6 space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Ваше имя</label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30"
                placeholder="Введите ваше имя"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Код консультации</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                className="w-full px-4 py-3 bg-slate-900/60 border border-slate-600/50 rounded-lg text-white text-center text-2xl font-mono tracking-[0.3em] placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50 focus:ring-1 focus:ring-sky-500/30 uppercase"
                placeholder="XXXXXXXX"
                maxLength={8}
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={connecting || !code.trim()}
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 disabled:bg-sky-900 disabled:text-sky-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {connecting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Подключение...
                </>
              ) : (
                <>
                  🎥 Подключиться
                </>
              )}
            </button>
          </div>

          <p className="text-center text-slate-600 text-xs">
            Нажимая «Подключиться», вы соглашаетесь с условиями проведения телемедицинской консультации
          </p>
        </div>
      </main>
    </div>
  );
}

export default function PatientPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    }>
      <PatientForm />
    </Suspense>
  );
}
