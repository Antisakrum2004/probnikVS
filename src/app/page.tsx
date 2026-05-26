import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-12">
      {/* Logo / Title Section */}
      <div className="text-center mb-12">
        <div className="text-6xl mb-4">🏥</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
          Видеоконсультации МИС — Демо
        </h1>
        <p className="text-slate-400 text-lg max-w-md mx-auto">
          Интеграция 1С МИС + EmAI + Jitsi Meet
        </p>
      </div>

      {/* Role Selection Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl">
        {/* Doctor Card */}
        <Link
          href="/doctor"
          className="flex-1 group relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-slate-800/60 backdrop-blur-sm p-8 hover:border-emerald-400/60 hover:bg-emerald-950/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02]"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-4xl group-hover:bg-emerald-500/25 transition-colors">
              👨‍⚕️
            </div>
            <div>
              <h2 className="text-2xl font-bold text-emerald-400 mb-1">Врач</h2>
              <p className="text-slate-400 text-sm">
                Рабочее место врача. Создание и управление видеоконсультациями.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-emerald-400 text-sm font-medium">
              <span>Перейти</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
        </Link>

        {/* Patient Card */}
        <Link
          href="/patient"
          className="flex-1 group relative overflow-hidden rounded-2xl border border-sky-500/30 bg-slate-800/60 backdrop-blur-sm p-8 hover:border-sky-400/60 hover:bg-sky-950/30 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10 hover:scale-[1.02]"
        >
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-sky-500/15 flex items-center justify-center text-4xl group-hover:bg-sky-500/25 transition-colors">
              📱
            </div>
            <div>
              <h2 className="text-2xl font-bold text-sky-400 mb-1">Пациент</h2>
              <p className="text-slate-400 text-sm">
                Вход в видеоконсультацию по коду, полученному от врача.
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sky-400 text-sm font-medium">
              <span>Перейти</span>
              <svg
                className="w-4 h-4 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
          {/* Decorative gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent pointer-events-none" />
        </Link>
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 text-slate-500 text-xs">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Платформа Jitsi: meet.jit.si (демо-режим)
        </div>
      </div>
    </div>
  );
}
