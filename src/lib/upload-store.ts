'use client';

import { create } from 'zustand';

interface UploadFile {
  file: File;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
}

interface UploadState {
  files: UploadFile[];
  addFiles: (newFiles: File[]) => void;
  removeFile: (name: string) => void;
  updateProgress: (name: string, progress: number) => void;
  updateStatus: (name: string, status: UploadFile['status']) => void;
  clearCompleted: () => void;
}

export const useUploadStore = create<UploadState>((set) => ({
  files: [],
  addFiles: (newFiles) => set((state) => {
    // Avoid duplicates by name
    const existingNames = new Set(state.files.map(f => f.file.name));
    const filtered = newFiles.filter(f => !existingNames.has(f.name));
    return {
      files: [
        ...state.files,
        ...filtered.map(f => ({ file: f, progress: 0, status: 'idle' as const }))
      ]
    };
  }),
  removeFile: (name) => set((state) => ({
    files: state.files.filter(f => f.file.name !== name)
  })),
  updateProgress: (name, progress) => set((state) => ({
    files: state.files.map(f => f.file.name === name ? { ...f, progress } : f)
  })),
  updateStatus: (name, status) => set((state) => ({
    files: state.files.map(f => f.file.name === name ? { ...f, status } : f)
  })),
  clearCompleted: () => set((state) => ({
    files: state.files.filter(f => f.status !== 'success')
  })),
}));
