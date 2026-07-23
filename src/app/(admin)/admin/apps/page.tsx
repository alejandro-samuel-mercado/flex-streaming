'use client';
import './page.css';

import { useState, useEffect, useRef } from 'react';
import {
    Smartphone, Tv, Upload, Link2, Trash2, Star,
    Download, FileText, PlusCircle, AlertCircle, CheckCircle2,
    Loader2, X, ChevronDown, ChevronUp, Edit3, Save, RefreshCw,
    Package
} from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';

type Platform = 'android' | 'tv';

interface ApkVersion {
    filename: string;
    versionName: string;
    versionCode: number;
    platform: Platform;
    uploadedAt: string;
    fileSize: number;
    downloadUrl: string;
    changelogFile: string | null;
    changelog: string;
    isActive: boolean;
}

function formatBytes(bytes: number): string {
    if (!bytes) return '—';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('es-AR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ platform, onClose, onSuccess }: { platform: Platform; onClose: () => void; onSuccess: () => void }) {
    const [mode, setMode] = useState<'file' | 'url'>('file');
    const [apkFile, setApkFile] = useState<File | null>(null);
    const [changelogFile, setChangelogFile] = useState<File | null>(null);
    const [urlData, setUrlData] = useState({ apkUrl: '', versionName: '', versionCode: '', changelog: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const apkInputRef = useRef<HTMLInputElement>(null);
    const changelogInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async () => {
        if (!apkFile) { setError('Seleccioná un archivo APK'); return; }
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('platform', platform);
            formData.append('apk', apkFile);
            if (changelogFile) formData.append('changelog', changelogFile);
            const res = await adminFetch(API_ROUTES.APP_VERSION.UPLOAD, { method: 'POST', body: formData });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Error desconocido');
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUrlAdd = async () => {
        const { apkUrl, versionName, versionCode, changelog } = urlData;
        if (!apkUrl || !versionName || !versionCode) { setError('Completá todos los campos obligatorios'); return; }
        setLoading(true);
        setError(null);
        try {
            const res = await adminFetch(API_ROUTES.APP_VERSION.ADD_BY_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, apkUrl, versionName, versionCode: Number(versionCode), changelog }),
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.error || 'Error desconocido');
            onSuccess();
            onClose();
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
                <div className="modal-header">
                    <h3 className="modal-title">
                        <PlusCircle size={20} className="text-primary" />
                        Nueva versión — {platform === 'android' ? 'Android' : 'TV'}
                    </h3>
                    <button onClick={onClose} className="modal-close"><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <div className="tab-container">
                        <button className={`tab-btn ${mode === 'file' ? 'active' : ''}`} onClick={() => setMode('file')}>
                            <Upload size={16} /> Subir archivo
                        </button>
                        <button className={`tab-btn ${mode === 'url' ? 'active' : ''}`} onClick={() => setMode('url')}>
                            <Link2 size={16} /> Por enlace
                        </button>
                    </div>

                    {mode === 'file' ? (
                        <div className="form-group-stack">
                            <div className="form-group">
                                <label className="form-label">Archivo APK *</label>
                                <div className="file-drop-zone" onClick={() => apkInputRef.current?.click()}>
                                    <input ref={apkInputRef} type="file" accept=".apk" hidden onChange={e => setApkFile(e.target.files?.[0] || null)} />
                                    {apkFile ? (
                                        <div className="file-selected">
                                            <span className="file-name">{apkFile.name}</span>
                                            <span className="file-size">{formatBytes(apkFile.size)}</span>
                                        </div>
                                    ) : (
                                        <div className="file-placeholder">
                                            <div className="icon-wrapper"><Upload size={24} /></div>
                                            <span>Arrastrá o hacé clic para seleccionar el APK</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Changelog (.txt o .md) <span className="text-muted">— opcional</span></label>
                                <div className="file-drop-zone small" onClick={() => changelogInputRef.current?.click()}>
                                    <input ref={changelogInputRef} type="file" accept=".txt,.md" hidden onChange={e => setChangelogFile(e.target.files?.[0] || null)} />
                                    {changelogFile ? (
                                        <span className="text-success">{changelogFile.name}</span>
                                    ) : (
                                        <div className="file-placeholder small">
                                            <FileText size={18} />
                                            <span>El sistema acepta un .txt con el mismo nombre que el APK</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="form-group-stack">
                            <div className="form-group">
                                <label className="form-label">URL del APK *</label>
                                <input className="form-input" placeholder="https://ejemplo.com/NUBA-V2.apk" value={urlData.apkUrl} onChange={e => setUrlData(p => ({ ...p, apkUrl: e.target.value }))} />
                            </div>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Versión (ej: 2.0) *</label>
                                    <input className="form-input" placeholder="2.0" value={urlData.versionName} onChange={e => setUrlData(p => ({ ...p, versionName: e.target.value }))} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Código de versión *</label>
                                    <input className="form-input" type="number" placeholder="200" value={urlData.versionCode} onChange={e => setUrlData(p => ({ ...p, versionCode: e.target.value }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Changelog / Novedades</label>
                                <textarea className="form-textarea" rows={5} placeholder="• Mejora en el reproductor&#10;• Corrección de errores" value={urlData.changelog} onChange={e => setUrlData(p => ({ ...p, changelog: e.target.value }))} />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error">
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                    <button className="btn btn-primary" onClick={mode === 'file' ? handleFileUpload : handleUrlAdd} disabled={loading}>
                        {loading ? <Loader2 size={16} className="spin" /> : <Upload size={16} />}
                        {loading ? 'Subiendo…' : 'Agregar versión'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Changelog Editor ─────────────────────────────────────────────────────────
function ChangelogEditor({ version, platform, onSave }: { version: ApkVersion; platform: Platform; onSave: () => void }) {
    const [text, setText] = useState(version.changelog);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await adminFetch(API_ROUTES.APP_VERSION.UPDATE_CHANGELOG, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, filename: version.filename, changelog: text }),
            });
            const json = await res.json();
            if (json.success) { setSaved(true); setTimeout(() => setSaved(false), 2000); onSave(); }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="changelog-editor">
            <textarea className="form-textarea" rows={5} value={text} onChange={e => setText(e.target.value)} placeholder="Escribe las novedades aquí..." />
            <div className="changelog-actions">
                <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={14} className="spin" /> : saved ? <CheckCircle2 size={14} /> : <Save size={14} />}
                    {saved ? 'Guardado exitosamente' : 'Guardar changelog'}
                </button>
            </div>
        </div>
    );
}

// ─── Version Card ─────────────────────────────────────────────────────────────
function VersionCard({ version, platform, onRefresh }: { version: ApkVersion; platform: Platform; onRefresh: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [editingChangelog, setEditingChangelog] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [activating, setActivating] = useState(false);

    const handleSetActive = async () => {
        setActivating(true);
        try {
            await adminFetch(API_ROUTES.APP_VERSION.SET_ACTIVE, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, filename: version.filename }),
            });
            onRefresh();
        } finally {
            setActivating(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`¿Estás seguro de eliminar la versión ${version.filename}?`)) return;
        setDeleting(true);
        try {
            await adminFetch(API_ROUTES.APP_VERSION.DELETE, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ platform, filename: version.filename }),
            });
            onRefresh();
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div className={`version-card ${version.isActive ? 'active' : ''}`}>
            <div className="version-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="version-info">
                    {version.isActive && (
                        <div className="badge badge-success pulse-glow">
                            <Star size={12} fill="currentColor" /> Activa
                        </div>
                    )}
                    <div className="version-title">
                        <span className="version-number">v{version.versionName}</span>
                        <span className="version-code">code {version.versionCode}</span>
                    </div>
                    <div className="version-meta">
                        <span>{version.filename}</span>
                        <span className="dot-separator">•</span>
                        <span>{formatBytes(version.fileSize)}</span>
                        <span className="dot-separator">•</span>
                        <span>{formatDate(version.uploadedAt)}</span>
                    </div>
                </div>
                <div className="version-actions">
                    {!version.isActive && (
                        <button className="btn btn-sm btn-outline btn-activate" onClick={e => { e.stopPropagation(); handleSetActive(); }} disabled={activating} title="Marcar como activa">
                            {activating ? <Loader2 size={16} className="spin" /> : <Star size={16} />}
                            Activar
                        </button>
                    )}
                    <a href={version.downloadUrl} className="btn-icon btn-download" onClick={e => e.stopPropagation()} download title="Descargar APK">
                        <Download size={18} />
                    </a>
                    <button className="btn-icon btn-delete" onClick={e => { e.stopPropagation(); handleDelete(); }} disabled={deleting} title="Eliminar">
                        {deleting ? <Loader2 size={18} className="spin" /> : <Trash2 size={18} />}
                    </button>
                    <div className="expand-indicator">
                        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="version-card-body">
                    <div className="changelog-header">
                        <div className="changelog-title">
                            <FileText size={16} className="text-primary" />
                            <span>Registro de Cambios (Changelog)</span>
                        </div>
                        <button className="btn btn-xs btn-outline" onClick={() => setEditingChangelog(!editingChangelog)}>
                            <Edit3 size={14} /> {editingChangelog ? 'Cancelar edición' : 'Editar'}
                        </button>
                    </div>
                    {editingChangelog ? (
                        <ChangelogEditor version={version} platform={platform} onSave={onRefresh} />
                    ) : (
                        <div className="changelog-content">
                            {version.changelog || <span className="empty-state">No hay notas de la versión. Haz clic en Editar para agregar.</span>}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Platform Panel ───────────────────────────────────────────────────────────
function PlatformPanel({ platform }: { platform: Platform }) {
    const [versions, setVersions] = useState<ApkVersion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpload, setShowUpload] = useState(false);

    const fetchVersions = async () => {
        setLoading(true);
        try {
            const res = await adminFetch(API_ROUTES.APP_VERSION.LIST(platform));
            const json = await res.json();
            if (json.success) setVersions(json.data);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVersions(); }, [platform]);
    const activeVersion = versions.find(v => v.isActive);

    return (
        <div className="platform-panel glass-panel">
            <div className="platform-header">
                <div className="platform-title-wrapper">
                    <div className={`platform-icon ${platform === 'android' ? 'android' : 'tv'}`}>
                        {platform === 'android' ? <Smartphone size={24} /> : <Tv size={24} />}
                    </div>
                    <div>
                        <h3 className="platform-title">{platform === 'android' ? 'Android Mobile' : 'Android TV'}</h3>
                        <p className="platform-path">{platform === 'android' ? '/media/apks/android' : '/media/apks/tv'}</p>
                    </div>
                </div>
                <div className="platform-actions">
                    <button className="btn-icon" onClick={fetchVersions} title="Actualizar lista">
                        <RefreshCw size={18} className={loading ? 'spin text-primary' : ''} />
                    </button>
                    <button className="btn btn-primary shadow-glow" onClick={() => setShowUpload(true)}>
                        <PlusCircle size={18} /> Nueva Versión
                    </button>
                </div>
            </div>

            {activeVersion && (
                <div className="active-banner">
                    <div className="active-banner-bg" />
                    <CheckCircle2 size={20} className="text-success" />
                    <span className="active-banner-label">Versión actual de producción:</span>
                    <span className="active-banner-value">v{activeVersion.versionName}</span>
                </div>
            )}

            <div className="versions-container">
                {loading ? (
                    <div className="loading-state">
                        <Loader2 size={32} className="spin text-primary" />
                        <span>Sincronizando versiones...</span>
                    </div>
                ) : versions.length === 0 ? (
                    <div className="empty-state-box">
                        <Package size={48} className="empty-icon" />
                        <h4>No hay versiones disponibles</h4>
                        <p>Aún no has subido ninguna versión para esta plataforma.</p>
                        <button className="btn btn-outline mt-4" onClick={() => setShowUpload(true)}>Subir el primer APK</button>
                    </div>
                ) : (
                    versions.map(v => (
                        <VersionCard key={v.filename} version={v} platform={platform} onRefresh={fetchVersions} />
                    ))
                )}
            </div>

            {showUpload && <UploadModal platform={platform} onClose={() => setShowUpload(false)} onSuccess={fetchVersions} />}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AppsPage() {
    return (
        <div className="page-wrapper">
            <div className="ambient-background">
                <div className="ambient-blob blob-1" />
                <div className="ambient-blob blob-2" />
            </div>
            
            <div className="page-container">
                <div className="page-header-glass">
                    <div className="page-title-section">
                        <div className="page-icon-gradient">
                            <Smartphone size={28} />
                        </div>
                        <div>
                            <h1 className="page-title">Gestión de Aplicaciones</h1>
                            <p className="page-subtitle">
                                Administra y distribuye las actualizaciones de tus aplicaciones móviles y de TV.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="info-alert glass-alert">
                    <AlertCircle size={20} className="text-primary" />
                    <p>
                        El sistema detecta automáticamente la versión desde el nombre del archivo. Utiliza el formato <strong>NUBA-ANDROID-V2.apk</strong>. Puedes adjuntar un changelog en formato <strong>.txt</strong> o editarlo posteriormente.
                    </p>
                </div>

                <div className="platforms-grid">
                    <PlatformPanel platform="android" />
                    <PlatformPanel platform="tv" />
                </div>
            </div>

        </div>
    );
}
