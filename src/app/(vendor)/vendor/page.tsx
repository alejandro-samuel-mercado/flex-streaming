'use client';

import { useState, useEffect } from 'react';
import { UserCheck, Coins, AlertCircle } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';
import { CreditHistoryModal } from '@/components/reseller/CreditHistoryModal';

export default function VendorDashboard() {
  const [stats, setStats] = useState({ endUsers: 0, credits: 0, expiringUsers: 0 });
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [euRes, meRes, expiringRes] = await Promise.all([
          resellerFetch(`${API_ROUTES.END_USERS.BASE}?limit=1`),
          resellerFetch(API_ROUTES.AUTH.ME),
          resellerFetch(`${API_ROUTES.END_USERS.BASE}?limit=1&expiringInDays=5`),
        ]);
        const euJson = await euRes.json();
        const meJson = await meRes.json();
        const expiringJson = await expiringRes.json();
        setStats({
          endUsers: euJson.success ? euJson.data.total : 0,
          credits: meJson.success ? (meJson.data.credits ?? 0) : 0,
          expiringUsers: expiringJson.success ? expiringJson.data.total : 0,
        });
      } catch (err) { console.error(err); }
    })();
  }, []);

  const KPI = [
    { label: 'Mis Clientes', value: stats.endUsers, icon: UserCheck, color: '#4ade80' },
    { label: 'Próximos a Vencer', value: stats.expiringUsers, icon: AlertCircle, color: '#f97316' },
    { label: 'Mis Créditos', value: stats.credits, icon: Coins, color: '#facc15' },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-header"><div><h1 className="adm-page-title">Dashboard</h1><p className="adm-page-subtitle">Panel de Vendedor</p></div></div>
      <div className="adm-kpi-row">
        {KPI.map((k, i) => (
          <div key={i} className="adm-kpi">
            <div className="adm-kpi-top">
              <span className="adm-kpi-label">{k.label}</span>
              <div className="adm-kpi-icon" style={{ color: k.color, background: k.color + '18' }}><k.icon size={18} /></div>
            </div>
            <div className="adm-kpi-value">
              {k.value}
              {i === 2 && (
                <button 
                  className="adm-btn adm-btn--ghost" 
                  style={{ fontSize: '0.8rem', padding: '4px 8px', marginLeft: 12, height: 'auto' }}
                  onClick={() => setShowHistoryModal(true)}
                >
                  Ver Historial
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <CreditHistoryModal 
        isOpen={showHistoryModal} 
        onClose={() => setShowHistoryModal(false)} 
      />
    </div>
  );
}
