'use client';

import { useState, useEffect } from 'react';
import { Users, UserCheck, Coins } from 'lucide-react';
import { resellerFetch } from '@/lib/reseller-api';
import { API_ROUTES } from '@/lib/api-routes';

export default function SuperVendorDashboard() {
  const [stats, setStats] = useState({ vendors: 0, endUsers: 0, credits: 0 });

  useEffect(() => {
    (async () => {
      try {
        const [vRes, euRes] = await Promise.all([
          resellerFetch(API_ROUTES.RESELLER.LIST),
          resellerFetch(`${API_ROUTES.END_USERS.BASE}?limit=1`),
        ]);
        const vJson = await vRes.json();
        const euJson = await euRes.json();
        const vendors = vJson.success ? vJson.data.length : 0;
        const endUsers = euJson.success ? euJson.data.total : 0;

        const meRes = await resellerFetch(API_ROUTES.AUTH.ME);
        const meJson = await meRes.json();
        const credits = meJson.success ? (meJson.data.credits ?? 0) : 0;

        setStats({ vendors, endUsers, credits });
      } catch (err) { console.error(err); }
    })();
  }, []);

  const KPI = [
    { label: 'Mis Vendedores', value: stats.vendors, icon: Users, color: '#60a5fa' },
    { label: 'Mis Clientes', value: stats.endUsers, icon: UserCheck, color: '#4ade80' },
    { label: 'Mis Créditos', value: stats.credits, icon: Coins, color: '#facc15' },
  ];

  return (
    <div className="adm-page">
      <div className="adm-page-header"><div><h1 className="adm-page-title">Dashboard</h1><p className="adm-page-subtitle">Panel de Super Vendedor</p></div></div>
      <div className="adm-kpi-row">
        {KPI.map((k, i) => (
          <div key={i} className="adm-kpi">
            <div className="adm-kpi-top">
              <span className="adm-kpi-label">{k.label}</span>
              <div className="adm-kpi-icon" style={{ color: k.color, background: k.color + '18' }}><k.icon size={18} /></div>
            </div>
            <div className="adm-kpi-value">{k.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
