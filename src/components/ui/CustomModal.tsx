'use client';

import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';

interface CustomModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
    confirmText?: string;
    cancelText?: string;
}

export default function CustomModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmText = 'Aceptar',
    cancelText = 'Cancelar'
}: CustomModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    const getIcon = () => {
        switch (type) {
            case 'warning': return <AlertTriangle className="modal-icon-warning" size={32} />;
            case 'error': return <AlertCircle className="modal-icon-error" size={32} />;
            case 'success': return <CheckCircle2 className="modal-icon-success" size={32} />;
            case 'confirm': return <AlertTriangle className="modal-icon-confirm" size={32} />;
            default: return <Info className="modal-icon-info" size={32} />;
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className={`modal-container modal-type-${type}`} onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="modal-header">
                    <div className="modal-icon-wrapper">
                        {getIcon()}
                    </div>
                    <h2 className="modal-title">{title}</h2>
                </div>

                <div className="modal-body">
                    <p>{message}</p>
                </div>

                <div className="modal-footer">
                    {type === 'confirm' || onConfirm ? (
                        <>
                            <button className="modal-btn modal-btn-secondary" onClick={onClose}>
                                {cancelText}
                            </button>
                            <button className="modal-btn modal-btn-primary" onClick={() => {
                                onConfirm?.();
                                onClose();
                            }}>
                                {confirmText}
                            </button>
                        </>
                    ) : (
                        <button className="modal-btn modal-btn-primary" onClick={onClose}>
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
