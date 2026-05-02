'use client';

import { create } from 'zustand';

interface UploadFile {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  type: 'MOVIE' | 'TRAILER';
  errorMessage?: string;
  contentId: string;
}

interface UploadState {
  files: UploadFile[];
  addFiles: (newFiles: File[], contentId: string) => void;
  removeFile: (name: string) => void;
  updateProgress: (name: string, progress: number) => void;
  updateStatus: (name: string, status: UploadFile['status']) => void;
  updateType: (name: string, type: UploadFile['type']) => void;
  setErrorMessage: (name: string, message: string) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  addFiles: (newFiles, contentId) => set((state) => {
    // Avoid duplicates by name
    const existingNames = new Set(state.files.map(f => f.file.name));
    const filtered = newFiles.filter(f => !existingNames.has(f.name));
    return {
      files: [
        ...state.files,
        ...filtered.map(f => ({ file: f, progress: 0, status: 'idle' as const, type: 'MOVIE' as const, contentId }))
      ]
    };
  }),
  removeFile: (name) => set((state) => ({
    files: state.files.filter(f => f.file.name !== name)
  })),
  updateProgress: (name, progress) => set((state) => ({
    files: state.files.map(f => {
      if (f.file.name === name) {
        // Sanity check: progress should never go backwards
        return { ...f, progress: Math.max(f.progress, progress) };
      }
      return f;
    })
  })),
  updateStatus: (name, status) => set((state) => ({
    files: state.files.map(f => f.file.name === name ? { ...f, status, errorMessage: status !== 'error' ? undefined : f.errorMessage } : f)
  })),
  updateType: (name, type) => set((state) => ({
    files: state.files.map(f => f.file.name === name ? { ...f, type } : f)
  })),
  setErrorMessage: (name, errorMessage) => set((state) => ({
    files: state.files.map(f => f.file.name === name ? { ...f, errorMessage } : f)
  })),
  clearCompleted: () => set((state) => ({
    files: state.files.filter(f => f.status !== 'success')
  })),
}));
