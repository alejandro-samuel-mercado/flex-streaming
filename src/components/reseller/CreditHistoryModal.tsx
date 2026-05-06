'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';
import { adminFetch } from '@/lib/admin-api';
import { resellerFetch } from '@/lib/reseller-api';

interface CreditHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Optional: if targetUserId is provided, it fetches that user's history (Admin use-case).
    // If not provided, it fetches the currently logged in user's history.
    targetUserId?: string; 
    isAdmin?: boolean;
}

interface Transaction {
    id: string;
    amount: number;
    type: 'ADD' | 'DEDUCT';
    description: string;
    createdAt: string;
    referenceId?: string;
}

export function CreditHistoryModal({ isOpen, onClose, targetUserId, isAdmin }: CreditHistoryModalProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [error, setError] = useState('');

    const fetchHistory = async (p = 1) => {
        setLoading(true);
        setError('');
        try {
            const url = targetUserId
                ? `${API_ROUTES.RESELLER.CREDIT_HISTORY(targetUserId)}?page=${p}&limit=10`
                : `${API_ROUTES.RESELLER.TRANSACTIONS}?page=${p}&limit=10`;
            
            const fetchFn = isAdmin ? adminFetch : resellerFetch;
            const res = await fetchFn(url);
            const data = await res.json();

            if (data.success) {
                setTransactions(data.data.transactions);
                setTotalPages(data.data.totalPages || 1);
                setPage(data.data.page || 1);
            } else {
                setError(data.error || 'Error al cargar el historial');
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchHistory(1);
        }
    }, [isOpen, targetUserId]);

    if (!isOpen) return null;

    return (
        <div className="adm-modal-overlay">
            <div className="adm-modal" style={{ maxWidth: 700 }}>
                <div className="adm-modal-header">
                    <h2>Historial de Créditos</h2>
                    <button className="adm-modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="adm-modal-content">
                    {error && <div className="adm-error-box">{error}</div>}

                    {loading && transactions.length === 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                            <Loader2 className="animate-spin" size={32} color="var(--adm-primary)" />
                        </div>
                    ) : transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--adm-muted)' }}>
                            No hay transacciones registradas.
                        </div>
                    ) : (
                        <div className="adm-table-container">
                            <table className="adm-table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Descripción</th>
                                        <th>Tipo</th>
                                        <th style={{ textAlign: 'right' }}>Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map(tx => (
                                        <tr key={tx.id}>
                                            <td style={{ color: 'var(--adm-muted)', fontSize: '0.9rem' }}>
                                                {new Date(tx.createdAt).toLocaleString('es-ES', { 
                                                    day: '2-digit', month: 'short', year: 'numeric', 
                                                    hour: '2-digit', minute: '2-digit' 
                                                })}
                                            </td>
                                            <td>{tx.description}</td>
                                            <td>
                                                {tx.type === 'ADD' ? (
                                                    <span style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                                                        <ArrowUpRight size={14} /> Ingreso
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem' }}>
                                                        <ArrowDownRight size={14} /> Egreso
                                                    </span>
                                                )}
                                            </td>
                                            <td style={{ 
                                                textAlign: 'right', 
                                                fontWeight: 600,
                                                color: tx.type === 'ADD' ? '#4ade80' : '#f87171' 
                                            }}>
                                                {tx.type === 'ADD' ? '+' : '-'}{tx.amount}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && totalPages > 1 && (
                        <div className="adm-pagination" style={{ marginTop: 20 }}>
                            <button
                                className="adm-btn adm-btn--ghost"
                                disabled={page === 1}
                                onClick={() => fetchHistory(page - 1)}
                            >
                                Anterior
                            </button>
                            <span style={{ color: 'var(--adm-muted)', fontSize: '0.9rem' }}>
                                Página {page} de {totalPages}
                            </span>
                            <button
                                className="adm-btn adm-btn--ghost"
                                disabled={page === totalPages}
                                onClick={() => fetchHistory(page + 1)}
                            >
                                Siguiente
                            </button>
                        </div>
                    )}
                </div>

                <div className="adm-modal-footer">
                    <button className="adm-btn adm-btn--ghost" onClick={() => fetchHistory(page)}>
                        <RefreshCw size={16} /> Actualizar
                    </button>
                    <button className="adm-btn adm-btn--primary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}
