'use client';
import { useState, useEffect } from 'react';
import { Settings, Globe, Bell, Shield, Palette, Save, MessageSquare, UploadCloud, FolderSearch, Clock, FolderOpen, Loader2, CheckCircle2 } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [suggestedDirs, setSuggestedDirs] = useState<string[]>([]);
    const [scanStatus, setScanStatus] = useState<any>(null);
    const [saved, setSaved] = useState(false);

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

        const fetchScanData = async () => {
            try {
                const token = localStorage.getItem('adminToken');
                const headers: Record<string, string> = { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) };

                const [dirsRes, statusRes] = await Promise.all([
                    fetch(API_ROUTES.MEDIA_SCANNER.DIRECTORIES, { headers }),
                    fetch(API_ROUTES.MEDIA_SCANNER.STATUS, { headers })
                ]);

                const dirsJson = await dirsRes.json();
                const statusJson = await statusRes.json();

                if (dirsJson.success) setSuggestedDirs(dirsJson.data?.directories || []);
                if (statusJson.success) setScanStatus(statusJson.data);
            } catch (err) {
                console.error('Error fetching scan data:', err);
            }
        };

        fetchSettings();
        fetchScanData();
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
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            alert('Error al guardar ajustes.');
        } finally {
            setSaving(false);
        }
    };

    const formatLastRun = (dateStr: string | null) => {
        if (!dateStr) return 'Nunca';
        const d = new Date(dateStr);
        return d.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const parseLastResult = (resultStr: string | null) => {
        if (!resultStr) return null;
        try { return JSON.parse(resultStr); } catch { return null; }
    };

    const lastResult = parseLastResult(scanStatus?.lastResult);

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
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
                </button>
            </div>

            {saved && (
                <div style={{
                    background: 'rgba(74, 222, 128, .1)',
                    border: '1px solid rgba(74, 222, 128, .3)',
                    color: '#86efac',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10
                }}>
                    <CheckCircle2 size={18} />
                    Ajustes guardados correctamente
                </div>
            )}

            <div className="adm-settings-grid">
                {/* ─── Búsqueda automática de metrajes ─── */}
                <div className="adm-settings-section" style={{ gridColumn: 'span 2' }}>
                    <div className="adm-settings-section-header">
                        <FolderSearch size={18} className="adm-settings-icon" />
                        <h2>Búsqueda Automática de Metrajes</h2>
                    </div>
                    <div className="adm-settings-body">
                        {/* Toggle */}
                        <div className="adm-toggle-row" onClick={() => toggleSetting('AUTO_SCAN_ENABLED')} style={{ cursor: 'pointer' }}>
                            <div>
                                <span style={{ fontWeight: 600 }}>Buscar metrajes automáticamente</span>
                                <p style={{ fontSize: '0.8rem', color: 'var(--adm-muted)', marginTop: 4 }}>
                                    El sistema escaneará la carpeta configurada periódicamente en busca de nuevos archivos de video
                                    y creará contenido automáticamente usando datos de TMDB.
                                </p>
                            </div>
                            <div className={`adm-toggle${settings['AUTO_SCAN_ENABLED'] === 'true' ? ' adm-toggle--on' : ''}`} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
                            {/* Interval */}
                            <div className="adm-form-row">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <Clock size={14} />
                                    Frecuencia de búsqueda
                                </label>
                                <select
                                    className="adm-select"
                                    value={settings['AUTO_SCAN_INTERVAL'] || '30'}
                                    onChange={e => setSettings({ ...settings, AUTO_SCAN_INTERVAL: e.target.value })}
                                >
                                    <option value="5">Cada 5 minutos</option>
                                    <option value="15">Cada 15 minutos</option>
                                    <option value="30">Cada 30 minutos</option>
                                    <option value="60">Cada 1 hora</option>
                                    <option value="360">Cada 6 horas</option>
                                    <option value="720">Cada 12 horas</option>
                                    <option value="1440">Cada 24 horas</option>
                                </select>
                            </div>

                            {/* Status indicator */}
                            <div className="adm-form-row">
                                <label>Estado del escáner</label>
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: 10,
                                    padding: '10px 14px',
                                    fontSize: '0.8rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ color: 'var(--adm-muted)' }}>Último escaneo:</span>
                                        <span style={{ color: 'white' }}>{formatLastRun(scanStatus?.lastRun)}</span>
                                    </div>
                                    {lastResult && (
                                        <div style={{
                                            marginTop: 6,
                                            padding: '6px 10px',
                                            background: lastResult.errors > 0 ? 'rgba(248, 113, 113, 0.1)' : 'rgba(74, 222, 128, 0.1)',
                                            borderRadius: 8,
                                            color: lastResult.errors > 0 ? '#fca5a5' : '#86efac',
                                            fontSize: '0.75rem'
                                        }}>
                                            {lastResult.message}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Directory path */}
                        <div className="adm-form-row" style={{ marginTop: 16 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <FolderOpen size={14} />
                                Carpeta de origen
                            </label>
                            <input
                                type="text"
                                className="adm-input"
                                placeholder="/ruta/a/tus/peliculas"
                                value={settings['AUTO_SCAN_PATH'] || ''}
                                onChange={e => setSettings({ ...settings, AUTO_SCAN_PATH: e.target.value })}
                            />

                            {suggestedDirs.length > 0 && (
                                <div style={{ marginTop: 8 }}>
                                    <label style={{ fontSize: '0.75rem', color: 'var(--adm-muted)', marginBottom: 4, display: 'block' }}>
                                        Carpetas sugeridas (desde variable de entorno):
                                    </label>
                                    <select
                                        className="adm-select"
                                        value=""
                                        onChange={e => {
                                            if (e.target.value) {
                                                setSettings({ ...settings, AUTO_SCAN_PATH: e.target.value });
                                            }
                                        }}
                                    >
                                        <option value="">Seleccionar una carpeta sugerida...</option>
                                        {suggestedDirs.map((dir, idx) => (
                                            <option key={idx} value={dir}>{dir}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

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

                {/* Subidas */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <UploadCloud size={18} className="adm-settings-icon" />
                        <h2>Subidas y Procesamiento</h2>
                    </div>
                    <div className="adm-settings-body">
                        <div className="adm-form-row">
                            <label>Límite de películas concurrentes en subida</label>
                            <input type="number" min="1" max="10" className="adm-input" value={settings['UPLOAD_CONCURRENT_LIMIT'] || '5'} onChange={e => setSettings({...settings, UPLOAD_CONCURRENT_LIMIT: e.target.value})} />
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
