'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UploadFile {
  file?: File;
  fileName: string;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  type: 'MOVIE' | 'TRAILER';
  errorMessage?: string;
  contentId?: string;
}

interface UploadBlock {
  id: string;
  contentId: string;
}

interface UploadState {
  files: UploadFile[];
  blocks: UploadBlock[];
  hasHydrated: boolean;
  setHasHydrated: (val: boolean) => void;
  addFiles: (newFiles: File[], contentId: string) => void;
  addFile: (file: UploadFile) => void;
  setFiles: (files: UploadFile[]) => void;
  removeFile: (name: string) => void;
  updateProgress: (name: string, progress: number) => void;
  updateStatus: (name: string, status: UploadFile['status']) => void;
  updateType: (name: string, type: UploadFile['type']) => void;
  setErrorMessage: (name: string, message: string) => void;
  clearCompleted: () => void;
  setBlocks: (blocks: UploadBlock[]) => void;
  updateBlockContent: (blockId: string, contentId: string) => void;
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      files: [],
      blocks: [],
      hasHydrated: false,
      setHasHydrated: (val) => set({ hasHydrated: val }),
      addFiles: (newFiles, contentId) => set((state) => {
        const updatedFiles = [...state.files];
        const trulyNewFiles: File[] = [];

        newFiles.forEach(f => {
          const existingIdx = updatedFiles.findIndex(ef => ef.fileName === f.name);
          if (existingIdx !== -1) {
            // Si ya existe pero no tiene el objeto File (por refresh), lo reconectamos
            if (!updatedFiles[existingIdx].file) {
              updatedFiles[existingIdx].file = f;
              updatedFiles[existingIdx].status = 'idle'; // Reset status to allow retry
            }
          } else {
            trulyNewFiles.push(f);
          }
        });

        return {
          files: [
            ...updatedFiles,
            ...trulyNewFiles.map(f => ({ 
              file: f, 
              fileName: f.name,
              progress: 0, 
              status: 'idle' as const, 
              type: 'MOVIE' as const, 
              contentId 
            }))
          ]
        };
      }),
      addFile: (file) => set((state) => ({
        files: [...state.files.filter(f => f.fileName !== file.fileName), file]
      })),
      setFiles: (files) => set({ files }),
      removeFile: (name) => set((state) => ({
        files: state.files.filter(f => f.fileName !== name)
      })),
      updateProgress: (name, progress) => set((state) => ({
        files: state.files.map(f => {
          if (f.fileName === name) {
            // Sanity check: progress should never go backwards
            return { ...f, progress: Math.max(f.progress, progress) };
          }
          return f;
        })
      })),
      updateStatus: (name, status) => set((state) => ({
        files: state.files.map(f => f.fileName === name ? { ...f, status, errorMessage: status !== 'error' ? undefined : f.errorMessage } : f)
      })),
      updateType: (name, type) => set((state) => ({
        files: state.files.map(f => f.fileName === name ? { ...f, type } : f)
      })),
      setErrorMessage: (name, errorMessage) => set((state) => ({
        files: state.files.map(f => f.fileName === name ? { ...f, errorMessage } : f)
      })),
      clearCompleted: () => set((state) => ({
        files: state.files.filter(f => f.status !== 'success')
      })),
      setBlocks: (blocks) => set({ blocks }),
      updateBlockContent: (blockId, contentId) => set((state) => ({
        blocks: state.blocks.map(b => b.id === blockId ? { ...b, contentId } : b)
      })),
    }),
    {
      name: 'peliplus-upload-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: (state) => {
        return () => state?.setHasHydrated(true);
      },
      // IMPORTANT: Don't try to persist the File object, it's not serializable
      partialize: (state) => ({
        files: state.files.map(({ file, ...rest }) => rest),
        blocks: state.blocks,
      }) as UploadState,
    }
  )
);
