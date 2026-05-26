'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Room } from '@/lib/types';

const JitsiMeeting = dynamic(
  () => import('@jitsi/react-sdk').then((mod) => mod.JitsiMeeting),
  { ssr: false, loading: () => <JitsiLoader /> }
);

function JitsiLoader() {
  return (
    <div className="flex-1 flex items-center justify-center bg-slate-950">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Загрузка видеоконференции...</p>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type JitsiApi = any;

function ConsultationContent({ roomId }: { roomId: string }) {
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'patient';

  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [completed, setCompleted] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [completing, setCompleting] = useState(false);
  const apiRef = useRef<JitsiApi>(null);
  const activatedRef = useRef(false);

  const displayName = role === 'doctor' ? room?.doctorName : room?.patientName;

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

          if (data.room.status === 'completed') {
            setCompleted(true);
          } else if (data.room.status === 'cancelled') {
            setCancelled(true);
          }
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

  // Activate room when someone joins
  useEffect(() => {
    if (room && !activatedRef.current && (room.status === 'waiting' || room.status === 'active')) {
      activatedRef.current = true;
      fetch('/api/rooms/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      }).catch(() => {
        // ignore activation errors
      });
    }
  }, [room, roomId]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      const res = await fetch('/api/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId }),
      });
      if (res.ok) {
        setCompleted(true);
        if (apiRef.current) {
          try {
            apiRef.current.dispose();
          } catch {
            // ignore
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <JitsiLoader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold text-white">{error}</h2>
          <p className="text-slate-400 text-sm">
            Проверьте ссылку и попробуйте снова
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

  if (completed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">✅</div>
          <h2 className="text-xl font-bold text-white">Консультация завершена</h2>
          <p className="text-slate-400 text-sm">
            Видеоконсультация была успешно завершена.
          </p>
          {room?.completedAt && (
            <p className="text-slate-500 text-xs">
              Завершена: {new Date(room.completedAt).toLocaleString('ru-RU')}
            </p>
          )}
          <Link
            href={role === 'doctor' ? '/doctor' : '/'}
            className="inline-block px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors"
          >
            {role === 'doctor' ? 'Вернуться в АРМ' : 'На главную'}
          </Link>
        </div>
      </div>
    );
  }

  if (cancelled) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">🚫</div>
          <h2 className="text-xl font-bold text-white">Консультация отменена</h2>
          <p className="text-slate-400 text-sm">
            Данная видеоконсультация была отменена.
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
    <div className="h-screen flex flex-col bg-slate-950">
      {/* Compact Header */}
      <header className="shrink-0 h-11 border-b border-slate-800 bg-slate-900 flex items-center justify-between px-3 z-20">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-base">
            {role === 'doctor' ? '👨‍⚕️' : '📱'}
          </span>
          <h1 className="text-xs font-medium text-white truncate">
            {room?.roomName}
          </h1>
          <span className={`shrink-0 text-[10px] px-1.5 py-0.5 rounded font-medium ${
            role === 'doctor'
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-sky-500/20 text-sky-400'
          }`}>
            {role === 'doctor' ? 'Врач' : 'Пациент'}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-slate-500 hidden sm:inline">
              {room?.status === 'active' ? 'Активна' : 'Подключение...'}
            </span>
          </div>
        </div>
      </header>

      {/* Jitsi Container */}
      <div className="flex-1 relative" style={{ height: 'calc(100vh - 44px)' }}>
        {room && (
          <JitsiMeeting
            roomName={room.roomName}
            configOverwrite={{
              startWithAudioMuted: true,
              disableDeepLinking: true,
              prejoinPageEnabled: false,
              hideConferenceTimer: false,
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              DEFAULT_LANGUAGE: 'ru',
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'chat', 'hangup', 'raisehand', 'videoquality', 'settings',
              ],
            }}
            userInfo={{
              displayName: displayName || 'Пользователь',
              email: '',
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onApiReady={(externalApi: any) => {
              apiRef.current = externalApi;
            }}
            getIFrameRef={(parentNode: HTMLDivElement) => {
              const iframe = parentNode?.querySelector('iframe');
              if (iframe) {
                iframe.style.height = '100%';
                iframe.style.border = 'none';
              }
              parentNode.style.height = '100%';
            }}
          />
        )}

        {/* Complete Button — only for doctor */}
        {role === 'doctor' && (
          <div className="absolute bottom-5 right-5 z-50">
            <button
              onClick={handleComplete}
              disabled={completing}
              className="flex items-center gap-2 px-5 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-medium rounded-xl shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95 text-sm"
            >
              {completing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Завершение...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  Завершить консультацию
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConsultationPage({ params }: { params: Promise<{ roomId: string }> }) {
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
        <JitsiLoader />
      </div>
    );
  }

  return (
    <Suspense fallback={<JitsiLoader />}>
      <ConsultationContent roomId={roomId} />
    </Suspense>
  );
}
