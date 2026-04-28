'use client';

import { Settings, Globe, Bell, Shield, Palette, Save } from 'lucide-react';

export default function AdminSettingsPage() {
    return (
        <div className="adm-page">
            <div className="adm-page-header">
                <div>
                    <h1 className="adm-page-title">Configuración</h1>
                    <p className="adm-page-subtitle">Ajustes globales de la plataforma</p>
                </div>
                <button className="adm-btn adm-btn--primary"><Save size={16} /> Guardar cambios</button>
            </div>

            <div className="adm-settings-grid">
                {/* General */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <Globe size={18} className="adm-settings-icon" />
                        <h2>General</h2>
                    </div>
                    <div className="adm-settings-body">
                        <div className="adm-form-row">
                            <label>Nombre del sitio</label>
                            <input className="adm-input" defaultValue="FlexStreaming" />
                        </div>
                        <div className="adm-form-row">
                            <label>URL del sitio</label>
                            <input className="adm-input" defaultValue="https://FlexStreaming.com" />
                        </div>
                        <div className="adm-form-row">
                            <label>Idioma por defecto</label>
                            <select className="adm-input">
                                <option>Español (es)</option>
                                <option>English (en)</option>
                                <option>Português (pt)</option>
                            </select>
                        </div>
                        <div className="adm-form-row">
                            <label>Zona horaria</label>
                            <select className="adm-input">
                                <option>America/Buenos_Aires (UTC-3)</option>
                                <option>America/Mexico_City (UTC-6)</option>
                                <option>Europe/Madrid (UTC+1)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Notificaciones */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <Bell size={18} className="adm-settings-icon" />
                        <h2>Notificaciones</h2>
                    </div>
                    <div className="adm-settings-body">
                        {[
                            { label: 'Email al completar procesamiento de video', default: true },
                            { label: 'Alerta por errores en la cola BullMQ', default: true },
                            { label: 'Reporte semanal de actividad', default: false },
                            { label: 'Notificar nuevos registros de usuarios', default: false },
                        ].map((item, i) => (
                            <div key={i} className="adm-toggle-row">
                                <span>{item.label}</span>
                                <div className={`adm-toggle${item.default ? ' adm-toggle--on' : ''}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Seguridad */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <Shield size={18} className="adm-settings-icon" />
                        <h2>Seguridad</h2>
                    </div>
                    <div className="adm-settings-body">
                        <div className="adm-form-row">
                            <label>Duración del token JWT (acceso)</label>
                            <input className="adm-input" defaultValue="15m" />
                        </div>
                        <div className="adm-form-row">
                            <label>Duración del refresh token</label>
                            <input className="adm-input" defaultValue="7d" />
                        </div>
                        <div className="adm-form-row">
                            <label>Máx. intentos de login</label>
                            <input className="adm-input" type="number" defaultValue="10" />
                        </div>
                        <div className="adm-toggle-row">
                            <span>Requerir 2FA para administradores</span>
                            <div className="adm-toggle" />
                        </div>
                    </div>
                </div>

                {/* Streaming */}
                <div className="adm-settings-section">
                    <div className="adm-settings-section-header">
                        <Palette size={18} className="adm-settings-icon" />
                        <h2>Streaming y Codificación</h2>
                    </div>
                    <div className="adm-settings-body">
                        <div className="adm-form-row">
                            <label>Concurrencia máxima FFmpeg</label>
                            <input className="adm-input" type="number" defaultValue="2" />
                        </div>
                        <div className="adm-form-row">
                            <label>Ruta de medios</label>
                            <input className="adm-input" defaultValue="./media" />
                        </div>
                        <div className="adm-form-row">
                            <label>Calidades HLS por defecto</label>
                            <input className="adm-input" defaultValue="360p, 720p, 1080p" />
                        </div>
                        <div className="adm-toggle-row">
                            <span>Generar previews de miniaturas</span>
                            <div className="adm-toggle adm-toggle--on" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
