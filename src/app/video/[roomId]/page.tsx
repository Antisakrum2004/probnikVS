'use client';

import { use, useState, useEffect } from 'react';
import Link from 'next/link';

function Spinner() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#0a0a0a', color: '#ccc', fontFamily: 'sans-serif',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #333',
          borderTopColor: '#4CAF50', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ fontSize: 14 }}>Подключение к видеоконференции...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  );
}

export default function ConsultationPage({
  params,
  searchParams,
}: {
  params: Promise<{ roomId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { roomId } = use(params);
  const sp = use(searchParams);
  const role = (sp.role as string) || 'patient';

  const [roomName, setRoomName] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Try embedded data from URL first
      const dataParam = sp.data as string | undefined;
      if (dataParam) {
        try {
          const decoded = JSON.parse(atob(decodeURIComponent(dataParam)));
          if (decoded && decoded.roomName && !cancelled) {
            setRoomName(decoded.roomName as string);
            setDoctorName((decoded.doctorName as string) || '');
            setLoading(false);
            return;
          }
        } catch { /* fall through */ }
      }

      // Fallback: API
      try {
        const res = await fetch(`/api/status?roomId=${encodeURIComponent(roomId)}`);
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (cancelled) return;
          if (data.room) {
            setRoomName(data.room.roomName);
            setDoctorName(data.room.doctorName || '');
          } else {
            setError('Консультация не найдена');
          }
        } else {
          setError('Консультация не найдена');
        }
      } catch {
        if (!cancelled) setError('Ошибка загрузки');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [roomId, sp]);

  if (loading) return <Spinner />;

  if (error || !roomName) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0a', color: '#ccc', fontFamily: 'sans-serif',
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 12, background: '#1a1a2e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', fontSize: 28, color: '#f59e0b',
          }}>!</div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 8 }}>
            {error || 'Консультация не найдена'}
          </h2>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.5 }}>
            Проверьте ссылку и попробуйте снова
          </p>
          <Link href="/" style={{
            display: 'inline-block', padding: '10px 24px',
            background: '#333', color: '#fff', borderRadius: 8,
            textDecoration: 'none', fontSize: 14,
          }}>
            На главную
          </Link>
        </div>
      </div>
    );
  }

  const jitsiUrl = `https://meet.jit.si/${roomName}?config.startWithAudioMuted=true&config.prejoinPageEnabled=false&interfaceConfig.SHOW_JITSI_WATERMARK=false&interfaceConfig.DEFAULT_LANGUAGE=ru&config.disableDeepLinking=true`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000', overflow: 'hidden' }}>
      <div style={{
        height: 44, background: '#111', borderBottom: '1px solid #222',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', flexShrink: 0, zIndex: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 14 }}>{role === 'doctor' ? '\uD83D\uDC68\u200D\u2695\uFE0F' : '\uD83D\uDCF1'}</span>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {doctorName || roomName}
          </span>
          <span style={{
            fontSize: 10, padding: '2px 6px', borderRadius: 4, fontWeight: 500, flexShrink: 0,
            background: role === 'doctor' ? 'rgba(16,185,129,0.15)' : 'rgba(59,130,246,0.15)',
            color: role === 'doctor' ? '#34d399' : '#60a5fa',
          }}>
            {role === 'doctor' ? '\u0412\u0440\u0430\u0447' : '\u041F\u0430\u0446\u0438\u0435\u043D\u0442'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          <span style={{ fontSize: 10, color: '#666' }}>\u0410\u043A\u0442\u0438\u0432\u043D\u0430</span>
        </div>
      </div>
      <iframe
        src={jitsiUrl}
        allow="camera; microphone; display-capture; autoplay; clipboard-write; screen-wake-lock"
        style={{ flex: 1, width: '100%', height: 'calc(100vh - 44px)', border: 'none', background: '#000' }}
      />
    </div>
  );
}
