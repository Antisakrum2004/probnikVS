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
      <div className="c1-patient-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="c1-spinner" style={{ width: 24, height: 24, borderWidth: 3, color: '#2B5879' }} />
          <p style={{ fontSize: 13, color: '#666', marginTop: 12 }}>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="c1-patient-page" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 48, height: 48, background: '#FFEBEE', border: '1px solid #EF9A9A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#D32F2F" strokeWidth="2" style={{ width: 24, height: 24 }}>
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>
            {error || 'Консультация не найдена'}
          </h2>
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 16 }}>
            Данная консультация недоступна. Обратитесь в регистратуру клиники для уточнения информации.
          </p>
          <Link
            href="/"
            className="c1-btn-action c1-btn-action-blue"
            style={{ textDecoration: 'none', height: 28, padding: '4px 20px', fontSize: 13 }}
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (room.status === 'completed') {
    return (
      <div className="c1-patient-page" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 48, height: 48, background: '#E8F5E9', border: '1px solid #A5D6A7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#2E7D32" strokeWidth="2" style={{ width: 24, height: 24 }}>
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>Консультация завершена</h2>
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5, marginBottom: 8 }}>
            Видеоконсультация с {room.doctorName} успешно завершена. Результаты будут доступны в вашей электронной медицинской карте.
          </p>
          {room.completedAt && (
            <p style={{ fontSize: 11, color: '#999' }}>
              {new Date(room.completedAt).toLocaleString('ru-RU')}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (room.status === 'cancelled') {
    return (
      <div className="c1-patient-page" style={{ alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ textAlign: 'center', maxWidth: 340 }}>
          <div style={{ width: 48, height: 48, background: '#FFF3E0', border: '1px solid #FFCC80', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#E65100" strokeWidth="2" style={{ width: 24, height: 24 }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <circle cx="12" cy="15" r="0.5" fill="#E65100" />
            </svg>
          </div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 8 }}>Консультация отменена</h2>
          <p style={{ fontSize: 12, color: '#666', lineHeight: 1.5 }}>
            Данная видеоконсультация была отменена. Для записи на новый приём обратитесь в клинику.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="c1-patient-page">
      {/* Header — 1C yellow bar */}
      <div className="c1-patient-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg viewBox="0 0 16 16" fill="none" style={{ width: 16, height: 16, flexShrink: 0 }}>
            <rect width="16" height="16" rx="1" fill="#2B5879" />
            <text x="3" y="12" fontSize="10" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">1C</text>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>1С:МИС</span>
          <span style={{ color: '#B0A020', fontSize: 12 }}>|</span>
          <span style={{ fontSize: 12, color: '#333' }}>Видеоконсультация</span>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <div style={{ maxWidth: 400, margin: '0 auto' }}>

          {/* Patient Name */}
          <div style={{ marginBottom: 12, fontSize: 13, color: '#666' }}>
            Пациент: <strong style={{ color: '#333' }}>{room.patientName}</strong>
          </div>

          {/* Doctor Card — Only name and specialization, NO personal info */}
          <div className="c1-patient-card" style={{ marginBottom: 12 }}>
            <div className="c1-patient-card-header">
              <div style={{
                width: 56, height: 56, background: '#2B5879', display: 'flex',
                alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px',
                fontSize: 22, fontWeight: 700, color: '#FFFFFF',
              }}>
                {room.doctorName.charAt(0)}
              </div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#333', marginBottom: 2 }}>
                {room.doctorName}
              </h2>
              <p style={{ fontSize: 12, color: '#2B5879', fontWeight: 600 }}>
                Врач-консультант
              </p>
            </div>

            <div className="c1-patient-card-body">
              <div className="c1-patient-field">
                <span style={{ fontSize: 12, color: '#666' }}>Дата и время</span>
                <span style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>
                  {new Date(room.createdAt).toLocaleString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="c1-patient-field">
                <span style={{ fontSize: 12, color: '#666' }}>Тип приёма</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600, color: '#2E7D32' }}>
                  <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 12, height: 12 }}>
                    <path d="M1 3C1 2.44772 1.44772 2 2 2H8C8.55228 2 9 2.44772 9 3V11C9 11.5523 8.55228 12 8 12H2C1.44772 12 1 11.5523 1 11V3Z" />
                    <path d="M9 4.5L12 3V11L9 9.5" />
                  </svg>
                  Видеоконсультация
                </span>
              </div>
              <div className="c1-patient-field">
                <span style={{ fontSize: 12, color: '#666' }}>Статус</span>
                <span className="c1-status-indicator c1-status-waiting">
                  <span className="c1-status-dot-sm c1-pulse" />
                  Ожидание
                </span>
              </div>
            </div>
          </div>

          {/* Connect Button */}
          <Link
            href={`/consultation/${room.id}?role=patient`}
            className="c1-patient-btn"
            style={{ textDecoration: 'none', display: 'flex', marginBottom: 12 }}
          >
            <svg viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 20, height: 20 }}>
              <path d="M1 4C1 3.44772 1.44772 3 2 3H10C10.5523 3 11 3.44772 11 4V14C11 14.5523 10.5523 15 10 15H2C1.44772 15 1 14.5523 1 14V4Z" />
              <path d="M11 6L15 4V14L11 12" />
            </svg>
            Подключиться к видеосвязи
          </Link>

          {/* Tips */}
          <div className="c1-patient-info-box" style={{ marginBottom: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#1A5276', marginBottom: 6 }}>Перед началом консультации:</p>
            <ul style={{ fontSize: 12, color: '#2874A6', lineHeight: 1.6, paddingLeft: 16, margin: 0 }}>
              <li>Убедитесь, что камера и микрофон работают</li>
              <li>Найдите тихое место с хорошим освещением</li>
              <li>Подготовьте документы (если требуется)</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div style={{ paddingTop: 4, paddingBottom: 24, textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#999', lineHeight: 1.5, padding: '0 8px' }}>
              Нажимая &laquo;Подключиться к видеосвязи&raquo;, вы подтверждаете согласие на проведение
              телемедицинской консультации и обработку персональных данных в соответствии
              с законодательством Республики Казахстан.
            </p>
          </div>
        </div>
      </div>
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
      <div className="c1-patient-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <span className="c1-spinner" style={{ width: 24, height: 24, borderWidth: 3, color: '#2B5879' }} />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="c1-patient-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <span className="c1-spinner" style={{ width: 24, height: 24, borderWidth: 3, color: '#2B5879' }} />
        </div>
      }
    >
      <PatientContent roomId={roomId} />
    </Suspense>
  );
}
