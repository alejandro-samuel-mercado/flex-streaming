'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Database, Download, Upload, Trash2, RefreshCw, Clock, Shield,
    CheckCircle, AlertTriangle, Settings, ChevronDown, X, Loader2,
    HardDrive, Calendar, RotateCcw
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-api';
import { API_ROUTES } from '@/lib/api-routes';

interface BackupMeta {
    filename: string;
    createdAt: string;
    sizeBytes: number;
    sizeMB: string;
    recordCounts: Record<string, number>;
    version: string;
}

interface BackupSettings {
    enabled: boolean;
    intervalHours: number;
    retentionCount: number;
    lastRun: string | null;
}

interface ImportResult {
    mode: string;
    results: Record<string, { upserted: number; errors: number }>;
}

export default function BackupPage() {
    const [backups, setBackups] = useState<BackupMeta[]>([]);
    const [settings, setSettings] = useState<BackupSettings>({ enabled: false, intervalHours: 24, retentionCount: 10, lastRun: null });
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [importing, setImporting] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [confirmModal, setConfirmModal] = useState<{ filename: string; mode: 'merge' | 'replace' } | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

    const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [listRes, settingsRes] = await Promise.all([
                adminFetch(API_ROUTES.BACKUP.LIST),
                adminFetch(API_ROUTES.BACKUP.SETTINGS),
            ]);
            const listData = await listRes.json();
            const settingsData = await settingsRes.json();
            if (listData.success) setBackups(listData.data.backups);
            if (settingsData.success) setSettings(settingsData.data);
        } catch (err) {
            showToast('Error al cargar los backups', 'error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleCreate = async () => {
        setCreating(true);
        try {
            const res = await adminFetch(API_ROUTES.BACKUP.CREATE, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Backup creado correctamente');
                loadData();
            } else {
                showToast('Error al crear el backup', 'error');
            }
        } catch {
            showToast('Error de conexión', 'error');
        } finally {
            setCreating(false);
        }
    };

    const handleImport = async (filename: string, mode: 'merge' | 'replace') => {
        setImporting(filename);
        setImportResult(null);
        try {
            const res = await adminFetch(API_ROUTES.BACKUP.IMPORT, {
                method: 'POST',
                body: JSON.stringify({ filename, mode }),
            });
            const data = await res.json();
            if (data.success) {
                setImportResult(data.data);
                showToast(`✅ Importación (${mode}) completada`);
            } else {
                showToast(data.error || 'Error al importar', 'error');
            }
        } catch {
            showToast('Error de conexión', 'error');
        } finally {
            setImporting(null);
            setConfirmModal(null);
        }
    };

    const handleDelete = async (filename: string) => {
        setDeleting(filename);
        try {
            const res = await adminFetch(API_ROUTES.BACKUP.DELETE(filename), { method: 'DELETE' });
            const data = await res.json();
            if (data.success) {
                showToast('🗑️ Backup eliminado');
                loadData();
            } else {
                showToast('Error al eliminar', 'error');
            }
        } catch {
            showToast('Error de conexión', 'error');
        } finally {
            setDeleting(null);
        }
    };

    const handleSaveSettings = async (overriddenSettings?: BackupSettings) => {
        setSavingSettings(true);
        try {
            const res = await adminFetch(API_ROUTES.BACKUP.SETTINGS, {
                method: 'PUT',
                body: JSON.stringify(overriddenSettings || settings),
            });
            const data = await res.json();
            if (data.success) {
                showToast('✅ Configuración guardada');
            } else {
                showToast('Error al guardar', 'error');
            }
        } catch {
            showToast('Error de conexión', 'error');
        } finally {
            setSavingSettings(false);
        }
    };

    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const totalRecords = (counts: Record<string, number>) =>
        Object.values(counts).reduce((a, b) => a + b, 0);

    return (
        <div className="adm-page !mt-4">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-6 right-6 z-[200] flex items-center !gap-3 !px-5 !py-3 rounded-2xl font-bold text-sm shadow-2xl animate-in slide-in-from-right duration-300 ${toast.type === 'success' ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300' : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
                    {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                    {toast.msg}
                </div>
            )}

            {/* Confirm Modal */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[100] flex items-center justify-center !p-4" onClick={() => setConfirmModal(null)}>
                    <div className="adm-card max-w-md w-full !p-8 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center !gap-3 !mb-6">
                            {confirmModal.mode === 'replace'
                                ? <AlertTriangle size={24} className="text-orange-400" />
                                : <Database size={24} className="text-primary" />
                            }
                            <h3 className="adm-section-title !!mb-0">
                                {confirmModal.mode === 'replace' ? 'Restauración completa' : 'Importación inteligente'}
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm !mb-2">
                            Archivo: <span className="text-white font-bold font-mono text-xs">{confirmModal.filename}</span>
                        </p>
                        {confirmModal.mode === 'replace' ? (
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl !p-4 !mb-6 text-sm text-orange-300">
                                ⚠️ <strong>Modo reemplazo:</strong> Borrará y reemplazará todos los datos de la base de datos con los del backup. Los datos actuales se perderán.
                            </div>
                        ) : (
                            <div className="bg-primary/10 border border-primary/30 rounded-xl !p-4 !mb-6 text-sm text-primary">
                                🔄 <strong>Modo merge:</strong> Actualiza lo que cambió y agrega lo nuevo. No borra datos existentes que no estén en el backup.
                            </div>
                        )}
                        <div className="flex !gap-3">
                            <button onClick={() => setConfirmModal(null)} className="adm-btn-secondary flex-1">Cancelar</button>
                            <button
                                onClick={() => handleImport(confirmModal.filename, confirmModal.mode)}
                                disabled={!importing}
                                className={`flex-1 adm-btn flex items-center justify-center !gap-2 ${confirmModal.mode === 'replace' ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                            >
                                {importing ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="adm-header">
                <div>
                    <h1 className="adm-title">Copias de Seguridad</h1>
                    <p className="adm-subtitle">Exporta, programa y restaura la base de datos de forma segura</p>
                </div>
                <button onClick={handleCreate} disabled={creating} className="adm-btn flex items-center !gap-2">
                    {creating ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                    {creating ? 'Creando...' : 'Crear Backup Ahora'}
                </button>
            </div>

            {/* Stats Row */}
            <div className="adm-stats-grid">
                <div className="adm-stat-card">
                    <HardDrive size={22} className="text-primary !mb-2" />
                    <div className="adm-stat-value">{backups.length}</div>
                    <div className="adm-stat-label">Backups disponibles</div>
                </div>
                <div className="adm-stat-card">
                    <Calendar size={22} className="text-emerald-400 !mb-2" />
                    <div className="adm-stat-value text-sm">{settings.lastRun ? formatDate(settings.lastRun) : '—'}</div>
                    <div className="adm-stat-label">Último backup</div>
                </div>
                <div className="adm-stat-card">
                    <Clock size={22} className="text-blue-400 !mb-2" />
                    <div className="adm-stat-value">{settings.enabled ? `Cada ${settings.intervalHours}h` : 'Desactivado'}</div>
                    <div className="adm-stat-label">Programación automática</div>
                </div>
                <div className="adm-stat-card">
                    <Shield size={22} className="text-yellow-400 !mb-2" />
                    <div className="adm-stat-value">{settings.retentionCount}</div>
                    <div className="adm-stat-label">Backups a retener</div>
                </div>
            </div>

            {/* Auto-backup Settings */}
            <div className="adm-card !p-6 !mb-6">
                <div className="flex items-center !gap-3 !mb-6">
                    <Settings size={18} className="text-primary" />
                    <h2 className="adm-section-title !!mb-0">Configuración Automática</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 !gap-6 !mb-6">
                    {/* Toggle */}
                    <div className="flex flex-col !gap-2">
                        <label className="adm-label">Activar backups automáticos</label>
                        <button
                            onClick={() => {
                                const newVal = !settings.enabled;
                                setSettings(s => ({ ...s, enabled: newVal }));
                                handleSaveSettings({ ...settings, enabled: newVal });
                            }}
                            className={`flex items-center !gap-3 !px-4 !py-3 rounded-xl border font-bold text-sm transition-all w-fit ${settings.enabled ? 'bg-primary/20 border-primary/40 text-primary' : 'bg-white/5 border-white/10 text-gray-400'}`}
                        >
                            <div className={`w-10 h-5 rounded-full relative transition-all ${settings.enabled ? 'bg-primary' : 'bg-white/10'}`}>
                                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${settings.enabled ? 'left-5' : 'left-0.5'}`} />
                            </div>
                            <span>{settings.enabled ? 'Activado' : 'Desactivado'}</span>
                        </button>
                    </div>

                    {/* Interval */}
                    <div className="flex flex-col !gap-2">
                        <label className="adm-label">Intervalo</label>
                        <select
                            value={settings.intervalHours}
                            onChange={e => setSettings(s => ({ ...s, intervalHours: parseInt(e.target.value) }))}
                            className="adm-input"
                        >
                            <option value={6}>Cada 6 horas</option>
                            <option value={12}>Cada 12 horas</option>
                            <option value={24}>Cada 24 horas (diario)</option>
                            <option value={48}>Cada 48 horas</option>
                            <option value={168}>Semanal</option>
                        </select>
                    </div>

                    {/* Retention */}
                    <div className="flex flex-col !gap-2">
                        <label className="adm-label">Máximo de backups a guardar</label>
                        <select
                            value={settings.retentionCount}
                            onChange={e => setSettings(s => ({ ...s, retentionCount: parseInt(e.target.value) }))}
                            className="adm-input"
                        >
                            {[3, 5, 7, 10, 15, 20, 30].map(n => (
                                <option key={n} value={n}>Últimos {n} backups</option>
                            ))}
                        </select>
                    </div>
                </div>
                <button onClick={() => handleSaveSettings()} disabled={savingSettings} className="adm-btn flex items-center !gap-2">
                    {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                    {savingSettings ? 'Guardando...' : 'Guardar Configuración'}
                </button>
            </div>

            {/* Import Result */}
            {importResult && (
                <div className="adm-card !p-6 !mb-6 border-emerald-500/30">
                    <div className="flex items-center justify-between !mb-4">
                        <div className="flex items-center !gap-3">
                            <CheckCircle size={18} className="text-emerald-400" />
                            <h2 className="adm-section-title !!mb-0 text-emerald-400">Resultado de la importación ({importResult.mode})</h2>
                        </div>
                        <button onClick={() => setImportResult(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 !gap-3">
                        {Object.entries(importResult.results).map(([table, { upserted, errors }]) => (
                            <div key={table} className={`!p-3 rounded-xl border text-sm ${errors > 0 ? 'bg-orange-500/10 border-orange-500/20' : 'bg-white/3 border-white/5'}`}>
                                <div className="font-bold text-white capitalize">{table.replace(/([A-Z])/g, ' $1')}</div>
                                <div className="text-emerald-400">{upserted} registros</div>
                                {errors > 0 && <div className="text-orange-400">{errors} errores</div>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Backups List */}
            <div className="adm-card overflow-hidden">
                <div className="!p-6 border-b border-white/5 flex items-center justify-between">
                    <h2 className="adm-section-title !!mb-0">Backups Disponibles</h2>
                    <button onClick={loadData} className="adm-btn-secondary flex items-center !gap-2 text-sm">
                        <RefreshCw size={14} /> Actualizar
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center !py-16 !gap-3 text-gray-400">
                        <Loader2 size={24} className="animate-spin" /> Cargando backups...
                    </div>
                ) : backups.length === 0 ? (
                    <div className="flex flex-col items-center justify-center !py-16 !gap-4 text-gray-400">
                        <Database size={48} className="opacity-20" />
                        <p className="text-lg font-bold">No hay backups todavía</p>
                        <p className="text-sm">Crea tu primer backup con el botón de arriba</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="adm-table w-full">
                            <thead>
                                <tr>
                                    <th>Archivo</th>
                                    <th>Fecha</th>
                                    <th>Tamaño</th>
                                    <th>Registros</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {backups.map(backup => (
                                    <tr key={backup.filename}>
                                        <td>
                                            <div className="font-mono text-xs text-gray-300">{backup.filename}</div>
                                            <div className="text-[10px] text-gray-500 !mt-0.5">v{backup.version}</div>
                                        </td>
                                        <td className="text-sm text-gray-300">{formatDate(backup.createdAt)}</td>
                                        <td className="text-sm font-bold">{backup.sizeMB} MB</td>
                                        <td>
                                            <div className="text-sm font-bold text-primary">{totalRecords(backup.recordCounts).toLocaleString()}</div>
                                            <div className="text-[10px] text-gray-500">
                                                {backup.recordCounts.users || 0}u · {backup.recordCounts.contents || 0}c · {backup.recordCounts.endUserAccounts || 0}eu
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center !gap-2 flex-wrap">
                                                {/* Download */}
                                                <a
                                                    href={API_ROUTES.BACKUP.DOWNLOAD(backup.filename)}
                                                    download={backup.filename}
                                                    className="adm-btn-secondary flex items-center !gap-1.5 text-xs !px-3 !py-1.5"
                                                    title="Descargar"
                                                >
                                                    <Download size={12} /> Descargar
                                                </a>
                                                {/* Merge Import */}
                                                <button
                                                    onClick={() => setConfirmModal({ filename: backup.filename, mode: 'merge' })}
                                                    disabled={!!importing}
                                                    className="flex items-center !gap-1.5 text-xs !px-3 !py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all font-bold disabled:opacity-50"
                                                    title="Importar (merge — no borra datos)"
                                                >
                                                    {importing === backup.filename ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                                                    Merge
                                                </button>
                                                {/* Replace Import */}
                                                <button
                                                    onClick={() => setConfirmModal({ filename: backup.filename, mode: 'replace' })}
                                                    disabled={!!importing}
                                                    className="flex items-center !gap-1.5 text-xs !px-3 !py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-all font-bold disabled:opacity-50"
                                                    title="Restaurar completo (borra todo primero)"
                                                >
                                                    <RotateCcw size={12} /> Restaurar
                                                </button>
                                                {/* Delete */}
                                                <button
                                                    onClick={() => handleDelete(backup.filename)}
                                                    disabled={deleting === backup.filename}
                                                    className="flex items-center !gap-1.5 text-xs !px-3 !py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-all font-bold disabled:opacity-50"
                                                    title="Eliminar backup"
                                                >
                                                    {deleting === backup.filename ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
