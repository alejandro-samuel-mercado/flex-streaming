'use client';
import { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Shield, Palette, Save, MessageSquare } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const res = await fetch(API_ROUTES.ADMIN.BASE + '/settings', {
                    headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
                });
                const json = await res.json();
                if (json.success) setSettings(json.data);
            } catch (err) {
                console.error('Error fetching settings:', err);
            }
        };
        fetchSettings();
    }, []);

    const toggleSetting = (key: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: prev[key] === 'true' ? 'false' : 'true'
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('adminToken');
            await fetch(API_ROUTES.ADMIN.BASE + '/settings', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(settings)
            });
            alert('Ajustes guardados correctamente.');
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Error al guardar ajustes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Configuración</h1>
                    <p className="adm-page-subtitle">Ajustes globales de la plataforma</p>
                </div>
                <button 
                    className="adm-btn adm-btn--primary" 
                    onClick={handleSave}
                    disabled={saving}
                >
                    <Save size={16} /> {saving ? 'Guardando...' : 'Guardar cambios'}
                </button>
            </div>

            <div className="adm-settings-grid">
                {/* Comentarios y Reseñas */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <MessageSquare size={18} className="adm-settings-icon" />
                        <h2>Comentarios y Reseñas</h2>
                    </div>
                    <div className="adm-settings-body">
                        <div className="adm-toggle-row" onClick={() => toggleSetting('COMMENTS_REQUIRE_MODERATION')} style={{ cursor: 'pointer' }}>
                            <span>Requerir moderación en comentarios (pendientes de aprobación)</span>
                            <div className={`adm-toggle${settings['COMMENTS_REQUIRE_MODERATION'] === 'true' ? ' adm-toggle--on' : ''}`} />
                        </div>
                    </div>
                </div>

                {/* General */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <Globe size={18} className="adm-settings-icon" />
                        <h2>General</h2>
                    </div>
                    <div className="adm-settings-body">
                        <div className="adm-form-row">
                            <label>Nombre del sitio</label>
                            <input className="adm-input" value={settings['SITE_NAME'] || 'FlexStreaming'} onChange={e => setSettings({...settings, SITE_NAME: e.target.value})} />
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
