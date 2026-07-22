'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Smartphone, Tv, Upload, Link2, Trash2, Star, StarOff,
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
                        <PlusCircle size={18} />
                        Nueva versión — {platform === 'android' ? 'Android' : 'TV'}
                    </h3>
                    <button onClick={onClose} className="modal-close"><X size={18} /></button>
                </div>
                <div className="modal-body">
                    {/* Mode switch */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                        <button
                            className={`tab-btn ${mode === 'file' ? 'active' : ''}`}
                            onClick={() => setMode('file')}
                        >
                            <Upload size={15} /> Subir archivo
                        </button>
                        <button
                            className={`tab-btn ${mode === 'url' ? 'active' : ''}`}
                            onClick={() => setMode('url')}
                        >
                            <Link2 size={15} /> Por enlace
                        </button>
                    </div>

                    {mode === 'file' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {/* APK File */}
                            <div>
                                <label className="form-label">Archivo APK *</label>
                                <div
                                    className="file-drop-zone"
                                    onClick={() => apkInputRef.current?.click()}
                                >
                                    <input ref={apkInputRef} type="file" accept=".apk" hidden onChange={e => setApkFile(e.target.files?.[0] || null)} />
                                    {apkFile ? (
                                        <span style={{ color: '#a78bfa', fontWeight: 600 }}>{apkFile.name} ({formatBytes(apkFile.size)})</span>
                                    ) : (
                                        <span style={{ color: '#6b7280' }}>
                                            <Upload size={20} style={{ display: 'block', margin: '0 auto 6px' }} />
                                            Arrastrá o hacé clic para seleccionar el APK
                                        </span>
                                    )}
                                </div>
                            </div>
                            {/* Changelog file */}
                            <div>
                                <label className="form-label">Changelog (.txt o .md) <span style={{ color: '#6b7280' }}>— opcional</span></label>
                                <div
                                    className="file-drop-zone"
                                    style={{ padding: '12px 16px', minHeight: 60 }}
                                    onClick={() => changelogInputRef.current?.click()}
                                >
                                    <input ref={changelogInputRef} type="file" accept=".txt,.md" hidden onChange={e => setChangelogFile(e.target.files?.[0] || null)} />
                                    {changelogFile ? (
                                        <span style={{ color: '#34d399' }}>{changelogFile.name}</span>
                                    ) : (
                                        <span style={{ color: '#6b7280', fontSize: 13 }}>
                                            <FileText size={16} style={{ display: 'inline', marginRight: 6 }} />
                                            El sistema también acepta un archivo con el mismo nombre que el APK pero extensión .txt
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label className="form-label">URL del APK *</label>
                                <input
                                    className="form-input"
                                    placeholder="https://ejemplo.com/NUBA-ANDROID-V2.apk"
                                    value={urlData.apkUrl}
                                    onChange={e => setUrlData(p => ({ ...p, apkUrl: e.target.value }))}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div>
                                    <label className="form-label">Versión (ej: 2.0) *</label>
                                    <input className="form-input" placeholder="2.0" value={urlData.versionName} onChange={e => setUrlData(p => ({ ...p, versionName: e.target.value }))} />
                                </div>
                                <div>
                                    <label className="form-label">Código de versión *</label>
                                    <input className="form-input" type="number" placeholder="200" value={urlData.versionCode} onChange={e => setUrlData(p => ({ ...p, versionCode: e.target.value }))} />
                                </div>
                            </div>
                            <div>
                                <label className="form-label">Changelog / Novedades</label>
                                <textarea
                                    className="form-textarea"
                                    rows={5}
                                    placeholder="• Mejora en el reproductor de video&#10;• Nuevo diseño del home&#10;• Corrección de errores"
                                    value={urlData.changelog}
                                    onChange={e => setUrlData(p => ({ ...p, changelog: e.target.value }))}
                                />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-error" style={{ marginTop: 12 }}>
                            <AlertCircle size={15} /> {error}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancelar</button>
                    <button
                        className="btn btn-primary"
                        onClick={mode === 'file' ? handleFileUpload : handleUrlAdd}
                        disabled={loading}
                    >
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
        <div style={{ paddingTop: 12 }}>
            <textarea
                className="form-textarea"
                rows={5}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="• Nueva función 1&#10;• Mejora de rendimiento&#10;• Corrección de bugs"
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn btn-sm btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <Loader2 size={13} className="spin" /> : saved ? <CheckCircle2 size={13} /> : <Save size={13} />}
                    {saved ? 'Guardado' : 'Guardar changelog'}
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
        if (!confirm(`¿Eliminar ${version.filename}? Esta acción no se puede deshacer.`)) return;
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {version.isActive && (
                        <span className="badge badge-success">
                            <Star size={11} /> Activa
                        </span>
                    )}
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#f3f4f6' }}>
                            v{version.versionName}
                            <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>
                                código {version.versionCode}
                            </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                            {version.filename} · {formatBytes(version.fileSize)} · {formatDate(version.uploadedAt)}
                        </div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!version.isActive && (
                        <button
                            className="btn btn-sm btn-ghost"
                            onClick={e => { e.stopPropagation(); handleSetActive(); }}
                            disabled={activating}
                            title="Marcar como versión activa"
                        >
                            {activating ? <Loader2 size={14} className="spin" /> : <Star size={14} />}
                            Activar
                        </button>
                    )}
                    <a
                        href={version.downloadUrl}
                        className="btn btn-sm btn-ghost"
                        onClick={e => e.stopPropagation()}
                        download
                        title="Descargar APK"
                    >
                        <Download size={14} /> Descargar
                    </a>
                    <button
                        className="btn btn-sm btn-danger-ghost"
                        onClick={e => { e.stopPropagation(); handleDelete(); }}
                        disabled={deleting}
                        title="Eliminar versión"
                    >
                        {deleting ? <Loader2 size={14} className="spin" /> : <Trash2 size={14} />}
                    </button>
                    {expanded ? <ChevronUp size={16} color="#6b7280" /> : <ChevronDown size={16} color="#6b7280" />}
                </div>
            </div>

            {expanded && (
                <div className="version-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af' }}>
                            <FileText size={13} style={{ display: 'inline', marginRight: 5 }} />
                            Changelog / Novedades
                        </span>
                        <button
                            className="btn btn-xs btn-ghost"
                            onClick={() => setEditingChangelog(!editingChangelog)}
                        >
                            <Edit3 size={12} /> {editingChangelog ? 'Cancelar edición' : 'Editar'}
                        </button>
                    </div>
                    {editingChangelog ? (
                        <ChangelogEditor version={version} platform={platform} onSave={onRefresh} />
                    ) : (
                        <pre style={{ fontSize: 13, color: '#d1d5db', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '10px 14px', margin: 0, fontFamily: 'inherit', minHeight: 60 }}>
                            {version.changelog || <span style={{ color: '#6b7280', fontStyle: 'italic' }}>Sin changelog. Hacé clic en Editar para agregar.</span>}
                        </pre>
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
        <div style={{ flex: 1 }}>
            {/* Panel header */}
            <div className="platform-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {platform === 'android' ? <Smartphone size={20} color="#a78bfa" /> : <Tv size={20} color="#34d399" />}
                    <div>
                        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#f3f4f6' }}>
                            {platform === 'android' ? 'Android' : 'Android TV'}
                        </h3>
                        <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>
                            {platform === 'android' ? '/home/media/apks/android' : '/home/media/apks/tv'}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button className="btn btn-xs btn-ghost" onClick={fetchVersions} title="Recargar">
                        <RefreshCw size={13} />
                    </button>
                    <button className="btn btn-sm btn-primary" onClick={() => setShowUpload(true)}>
                        <PlusCircle size={15} /> Nueva versión
                    </button>
                </div>
            </div>

            {/* Active version summary */}
            {activeVersion && (
                <div className="active-version-banner">
                    <CheckCircle2 size={15} color="#34d399" />
                    <span style={{ color: '#9ca3af', fontSize: 13 }}>Versión activa:</span>
                    <span style={{ fontWeight: 700, color: '#f3f4f6' }}>v{activeVersion.versionName}</span>
                    <span style={{ color: '#6b7280', fontSize: 12 }}>({activeVersion.filename})</span>
                </div>
            )}

            {/* Versions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280' }}>
                        <Loader2 size={24} className="spin" style={{ margin: '0 auto 8px', display: 'block' }} />
                        Cargando versiones…
                    </div>
                ) : versions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 40, color: '#6b7280', border: '2px dashed #374151', borderRadius: 12 }}>
                        <Package size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                        No hay versiones registradas.
                        <br />
                        <button className="btn btn-sm btn-ghost" style={{ marginTop: 12 }} onClick={() => setShowUpload(true)}>
                            Agregar la primera
                        </button>
                    </div>
                ) : (
                    versions.map(v => (
                        <VersionCard
                            key={v.filename}
                            version={v}
                            platform={platform}
                            onRefresh={fetchVersions}
                        />
                    ))
                )}
            </div>

            {showUpload && (
                <UploadModal
                    platform={platform}
                    onClose={() => setShowUpload(false)}
                    onSuccess={fetchVersions}
                />
            )}
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AppsPage() {
    return (
        <div className="page-container">
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div className="page-icon">
                        <Smartphone size={22} />
                    </div>
                    <div>
                        <h1 className="page-title">Aplicación Móvil &amp; TV</h1>
                        <p className="page-subtitle">
                            Gestioná las versiones de APK para Android y Android TV. Los usuarios recibirán una notificación de actualización automática.
                        </p>
                    </div>
                </div>
            </div>

            <div className="info-banner">
                <AlertCircle size={14} />
                <span>
                    El sistema detecta la versión desde el nombre del archivo. Usá el formato{' '}
                    <code>NUBA-ANDROID-V2.apk</code> o <code>NUBA-TV-V3.apk</code>.
                    El changelog se carga desde un archivo <code>.txt</code> con el mismo nombre.
                </span>
            </div>

            <div className="platforms-grid">
                <PlatformPanel platform="android" />
                <div className="platforms-divider" />
                <PlatformPanel platform="tv" />
            </div>

            <style jsx>{`
                .page-container {
                    padding: 24px;
                    max-width: 1400px;
                    margin: 0 auto;
                }
                .page-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px;
                }
                .page-icon {
                    width: 48px;
                    height: 48px;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #7c3aed, #4f46e5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    flex-shrink: 0;
                }
                .page-title {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    color: #f3f4f6;
                }
                .page-subtitle {
                    margin: 4px 0 0;
                    color: #9ca3af;
                    font-size: 14px;
                }
                .info-banner {
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                    background: rgba(79, 70, 229, 0.1);
                    border: 1px solid rgba(79, 70, 229, 0.3);
                    border-radius: 10px;
                    padding: 12px 16px;
                    font-size: 13px;
                    color: #a5b4fc;
                    margin-bottom: 24px;
                }
                .info-banner code {
                    background: rgba(79, 70, 229, 0.2);
                    border-radius: 4px;
                    padding: 1px 5px;
                    font-size: 12px;
                }
                .platforms-grid {
                    display: grid;
                    grid-template-columns: 1fr auto 1fr;
                    gap: 0;
                    align-items: start;
                }
                .platforms-divider {
                    width: 1px;
                    background: #1f2937;
                    align-self: stretch;
                    margin: 0 24px;
                }
                .platform-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #1f2937;
                }
                .active-version-banner {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(52, 211, 153, 0.07);
                    border: 1px solid rgba(52, 211, 153, 0.2);
                    border-radius: 8px;
                    padding: 8px 12px;
                    font-size: 13px;
                }
                .version-card {
                    background: #111827;
                    border: 1px solid #1f2937;
                    border-radius: 12px;
                    overflow: hidden;
                    transition: border-color 0.2s;
                }
                .version-card.active {
                    border-color: rgba(52, 211, 153, 0.4);
                    background: rgba(52, 211, 153, 0.04);
                }
                .version-card:hover {
                    border-color: #374151;
                }
                .version-card-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 14px 16px;
                    cursor: pointer;
                    user-select: none;
                }
                .version-card-body {
                    padding: 0 16px 16px;
                    border-top: 1px solid #1f2937;
                    margin-top: 0;
                    padding-top: 14px;
                }
                .badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    padding: 3px 8px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 600;
                }
                .badge-success {
                    background: rgba(52, 211, 153, 0.15);
                    color: #34d399;
                    border: 1px solid rgba(52, 211, 153, 0.3);
                }
                .btn { display: inline-flex; align-items: center; gap: 5px; border-radius: 8px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: none; font-size: 14px; }
                .btn-sm { padding: 6px 12px; font-size: 13px; }
                .btn-xs { padding: 4px 8px; font-size: 12px; border-radius: 6px; }
                .btn-primary { background: #7c3aed; color: white; }
                .btn-primary:hover { background: #6d28d9; }
                .btn-ghost { background: transparent; color: #9ca3af; border: 1px solid #374151; }
                .btn-ghost:hover { background: #1f2937; color: #f3f4f6; }
                .btn-danger-ghost { background: transparent; color: #9ca3af; border: 1px solid #374151; }
                .btn-danger-ghost:hover { background: rgba(239, 68, 68, 0.1); color: #f87171; border-color: rgba(239, 68, 68, 0.4); }
                .btn:disabled { opacity: 0.5; cursor: not-allowed; }
                .tab-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 16px; border-radius: 8px; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid #374151; background: transparent; color: #9ca3af; transition: all 0.15s; }
                .tab-btn.active { background: rgba(124, 58, 237, 0.2); border-color: rgba(124, 58, 237, 0.5); color: #a78bfa; }
                .form-label { display: block; font-size: 12px; font-weight: 600; color: #9ca3af; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; }
                .form-input { width: 100%; padding: 9px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; color: #f3f4f6; font-size: 14px; box-sizing: border-box; transition: border-color 0.15s; }
                .form-input:focus { outline: none; border-color: #7c3aed; }
                .form-textarea { width: 100%; padding: 9px 12px; background: #1f2937; border: 1px solid #374151; border-radius: 8px; color: #f3f4f6; font-size: 13px; box-sizing: border-box; resize: vertical; font-family: inherit; transition: border-color 0.15s; }
                .form-textarea:focus { outline: none; border-color: #7c3aed; }
                .file-drop-zone { border: 2px dashed #374151; border-radius: 10px; padding: 24px 16px; text-align: center; cursor: pointer; transition: border-color 0.2s, background 0.2s; }
                .file-drop-zone:hover { border-color: #7c3aed; background: rgba(124, 58, 237, 0.05); }
                .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(4px); }
                .modal-card { background: #111827; border: 1px solid #1f2937; border-radius: 16px; width: 100%; overflow: hidden; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }
                .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; border-bottom: 1px solid #1f2937; }
                .modal-title { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 16px; font-weight: 700; color: #f3f4f6; }
                .modal-close { background: transparent; border: none; color: #6b7280; cursor: pointer; padding: 4px; border-radius: 6px; display: flex; }
                .modal-close:hover { background: #1f2937; color: #f3f4f6; }
                .modal-body { padding: 20px; }
                .modal-footer { display: flex; justify-content: flex-end; gap: 8px; padding: 14px 20px; border-top: 1px solid #1f2937; }
                .alert { display: flex; align-items: center; gap: 8px; border-radius: 8px; padding: 10px 14px; font-size: 13px; }
                .alert-error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; }
                @keyframes spin { to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                @media (max-width: 900px) {
                    .platforms-grid { grid-template-columns: 1fr; }
                    .platforms-divider { width: 100%; height: 1px; margin: 24px 0; }
                }
            `}</style>
        </div>
    );
}
