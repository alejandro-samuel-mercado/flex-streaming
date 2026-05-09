'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import CustomModal from './CustomModal';

interface ModalOptions {
    title: string;
    message: string;
    type?: 'info' | 'warning' | 'error' | 'success' | 'confirm';
    confirmText?: string;
    cancelText?: string;
    onConfirm?: () => void;
}

interface ModalContextType {
    showModal: (options: ModalOptions) => void;
    hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
    const [modalConfig, setModalConfig] = useState<ModalOptions | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const showModal = useCallback((options: ModalOptions) => {
        setModalConfig(options);
        setIsOpen(true);
    }, []);

    const hideModal = useCallback(() => {
        setIsOpen(false);
        // We don't clear config immediately to allow animation to finish
    }, []);

    return (
        <ModalContext.Provider value={{ showModal, hideModal }}>
            {children}
            {modalConfig && (
                <CustomModal
                    isOpen={isOpen}
                    onClose={hideModal}
                    onConfirm={modalConfig.onConfirm}
                    title={modalConfig.title}
                    message={modalConfig.message}
                    type={modalConfig.type}
                    confirmText={modalConfig.confirmText}
                    cancelText={modalConfig.cancelText}
                />
            )}
        </ModalContext.Provider>
    );
}

export function useModal() {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
}
