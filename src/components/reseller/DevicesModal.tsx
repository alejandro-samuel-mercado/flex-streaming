'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import type { EndUserAccount, DeviceSession } from '@/types/reseller.types';

const DEVICE_EMOJI: Record<string, string> = { MOBILE: '📱', WEB: '💻', SMART_TV: '📺', UNKNOWN: '❓' };

interface Props {
  account: EndUserAccount;
  onClose: () => void;
  onRefresh: () => void;
  fetchFn: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function DevicesModal({ account, onClose, onRefresh, fetchFn }: Props) {
  const [devices, setDevices] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetchFn(API_ROUTES.END_USERS.DEVICES(account.id));
      const json = await res.json();
      if (json.success) setDevices(json.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDevices(); }, []);

  const disconnectOne = async (deviceId: string) => {
    if (!confirm('¿Desconectar este dispositivo?')) return;
    await fetchFn(API_ROUTES.END_USERS.DEVICE(account.id, deviceId), { method: 'DELETE' });
    fetchDevices();
    onRefresh();
  };

  const disconnectAll = async () => {
    if (!confirm('¿Desconectar TODOS los dispositivos?')) return;
    await fetchFn(API_ROUTES.END_USERS.DEVICES(account.id), { method: 'DELETE' });
    fetchDevices();
    onRefresh();
  };

  const timeAgo = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora mismo';
    if (mins < 60) return `Hace ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  return (
    <div className="adm-modal-overlay" onClick={onClose}>
      <div className="adm-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.05rem' }}>Dispositivos — {account.username}</h2>
            <p className="adm-table-muted" style={{ margin: '.2rem 0 0', fontSize: '.82rem' }}>
              {devices.length} de {account.maxDevices} slots usados
            </p>
          </div>
        </div>

        {loading ? <p style={{ textAlign: 'center', padding: '1.5rem' }}>Cargando...</p> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {devices.map(dev => (
              <div key={dev.id} className="adm-table-card" style={{ padding: '.75rem 1rem', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: '.6rem' }}>
                  <span style={{ fontSize: '1.3rem' }}>{DEVICE_EMOJI[dev.deviceType] || '❓'}</span>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '.9rem' }}>{dev.deviceName || dev.deviceType}</div>
                    <div className="adm-table-muted" style={{ fontSize: '.78rem' }}>
                      {[dev.platform, dev.osVersion, dev.appVersion ? `App v${dev.appVersion}` : null, dev.browserName].filter(Boolean).join(' · ')}
                    </div>
                    {dev.ipAddress && <div className="adm-table-muted" style={{ fontSize: '.75rem' }}>IP: {dev.ipAddress}</div>}
                    <div className="adm-table-muted" style={{ fontSize: '.75rem' }}>{timeAgo(dev.lastSeen)}</div>
                  </div>
                </div>
                <button className="adm-btn adm-btn--ghost" style={{ padding: '.2rem .4rem', color: '#f87171' }} onClick={() => disconnectOne(dev.id)} title="Desconectar">
                  <X size={14} />
                </button>
              </div>
            ))}
            {devices.length === 0 && <p className="adm-table-muted" style={{ textAlign: 'center', padding: '1.5rem' }}>Sin dispositivos conectados</p>}
          </div>
        )}

        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'flex-end', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,.06)', paddingTop: '.75rem' }}>
          {devices.length > 0 && <button className="adm-btn adm-btn--ghost" style={{ color: '#f87171' }} onClick={disconnectAll}>Desconectar todos</button>}
          <button className="adm-btn adm-btn--ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}
