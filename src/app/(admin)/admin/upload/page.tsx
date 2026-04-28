'use client';

import { useState } from 'react';
import { UploadCloud, FileVideo, CheckCircle, AlertCircle } from 'lucide-react';
import { API_ROUTES } from '@/lib/api-routes';

export default function UploadManagerPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progresses, setProgresses] = useState<{ [key: string]: number }>({});
  const [overallStatus, setOverallStatus] = useState<'' | 'success' | 'error' | 'partial_error'>('');
  
  // Hardcoded for demo - in reality this would be selected from a list of contents
  const DEMO_CONTENT_ID = 'demo-content-123';

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setOverallStatus('');

    const newProgresses: { [key: string]: number } = {};
    files.forEach(f => newProgresses[f.name] = 0);
    setProgresses(newProgresses);

    let successCount = 0;
    let errorCount = 0;

    await Promise.all(files.map(async (f) => {
      try {
        const formData = new FormData();
        formData.append('video', f);
        formData.append('contentId', DEMO_CONTENT_ID); // Ideally should ask user or create content dynamically

        const res = await fetch(process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/upload` : 'http://localhost:4000/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Upload failed');
        setProgresses(prev => ({ ...prev, [f.name]: 100 }));
        successCount++;
      } catch (err) {
        setProgresses(prev => ({ ...prev, [f.name]: -1 })); // -1 means error
        errorCount++;
      }
    }));

    if (errorCount === 0) setOverallStatus('success');
    else if (successCount === 0) setOverallStatus('error');
    else setOverallStatus('partial_error');

    setUploading(false);
    if (errorCount === 0) setFiles([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gestor de Subidas (Upload Manager)</h1>
        <p className="text-[var(--color-text-muted)]">Sube archivos base (MP4, MKV) para ser codificados a HLS mediante FFmpeg y BullMQ</p>
      </div>

      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-8 max-w-2xl">
        <label className="block mb-2 font-semibold">Seleccionar archivo de video</label>
        
        <div className={`border-2 border-dashed rounded-[var(--radius-lg)] p-12 text-center transition-colors 
            ${files.length > 0 ? 'border-[var(--color-primary)] bg-[var(--color-primary-glow)]' : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'}`}
        >
          <input 
            type="file" 
            accept="video/mp4,video/mkv,video/webm" 
            className="hidden" 
            id="video-upload"
            multiple
            onChange={(e) => setFiles(prev => [...prev, ...Array.from(e.target.files || [])])}
          />
          <label htmlFor="video-upload" className="cursor-pointer flex flex-col items-center gap-4">
            <UploadCloud size={48} className={files.length > 0 ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} />
            {files.length > 0 ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-white font-semibold">
                  {files.length} archivo(s) seleccionado(s)
                </span>
                <div className="text-sm text-[var(--color-text-muted)]">
                  {files.slice(0, 3).map(f => f.name).join(', ')}
                  {files.length > 3 ? ` y ${files.length - 3} más...` : ''}
                </div>
              </div>
            ) : (
              <div className="text-[var(--color-text-muted)]">
                <span className="text-white font-semibold block mb-1">Click para subir múltiples</span> o arrastra varios archivos aquí
                <span className="block mt-2 text-xs">Soporta MP4, MKV, WEBM (Lote, Max 5GB c/u)</span>
              </div>
            )}
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 flex flex-col gap-2 max-h-40 overflow-y-auto">
            {files.map((file, idx) => (
              <div key={idx} className="flex justify-between items-center bg-[var(--color-bg)] p-2 rounded text-sm text-[var(--color-text-muted)]">
                <div className="flex items-center gap-2 truncate">
                  <FileVideo size={16} className="text-[var(--color-primary)]" />
                  <span className="truncate">{file.name}</span>
                </div>
                <span>{(file.size / (1024 * 1024)).toFixed(2)} MB</span>
              </div>
            ))}
          </div>
        )}

        <button 
          onClick={handleUpload}
          disabled={files.length === 0 || uploading}
          className="w-full mt-6 btn-primary-accent disabled:opacity-50 disabled:cursor-not-allowed flex justify-center"
        >
          {uploading ? 'Procesando lote...' : 'Iniciar subidas y enviar a cola BullMQ'}
        </button>

        {/* Status Indicators */}
        {uploading && (
           <div className="mt-6 p-4 bg-[var(--color-surface-2)] rounded-[var(--radius-md)]">
             <p className="text-sm font-semibold mb-3">Subiendo archivos...</p>
             <div className="flex flex-col gap-3 max-h-48 overflow-y-auto">
               {Object.entries(progresses).map(([name, val], idx) => (
                 <div key={idx}>
                   <div className="flex justify-between text-xs mb-1">
                     <span className="truncate max-w-[200px]">{name}</span>
                     <span>{val === -1 ? 'Error' : val === 100 ? 'Enviado!' : 'En proceso...'}</span>
                   </div>
                   <div className="w-full bg-[var(--color-surface-3)] h-1.5 rounded-full overflow-hidden">
                     <div 
                       className={`h-full transition-all duration-300 ${val === -1 ? 'bg-red-500' : 'bg-[#46d369]'}`}
                       style={{ width: `${val === -1 ? 100 : val}%` }}
                     />
                   </div>
                 </div>
               ))}
             </div>
           </div>
        )}

        {overallStatus === 'success' && (
          <div className="mt-6 p-4 bg-[#46d369]/10 border border-[#46d369]/30 rounded-[var(--radius-md)] flex items-center gap-3 text-[#46d369]">
            <CheckCircle size={20} />
            <div>
              <p className="font-semibold text-sm">Todo el lote ha sido enviado a la cola con éxito.</p>
              <p className="text-xs opacity-80 mt-1">El worker procesará estos videos de a 1 según la concurrencia configurada.</p>
            </div>
          </div>
        )}

        {(overallStatus === 'error' || overallStatus === 'partial_error') && (
          <div className="mt-6 p-4 bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-[var(--radius-md)] flex items-center gap-3 text-[var(--color-error)]">
            <AlertCircle size={20} />
            <p className="font-semibold text-sm">Ocurrieron errores al subir algunos archivos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
