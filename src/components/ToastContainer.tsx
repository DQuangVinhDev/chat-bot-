import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastMessage } from '../types';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-md w-[calc(100vw-2.5rem)] sm:w-[420px] pointer-events-none">
      {toasts.map((toast) => {
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';
        const isSuccess = toast.type === 'success';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-xl p-4 shadow-2xl border transition-all duration-300 animate-in fade-in slide-in-from-top-4 backdrop-blur-md ${
              isError
                ? 'bg-[#291415]/95 border-red-500/50 text-red-100 shadow-red-950/40'
                : isWarning
                ? 'bg-[#2b2210]/95 border-amber-500/50 text-amber-100 shadow-amber-950/40'
                : isSuccess
                ? 'bg-[#102919]/95 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40'
                : 'bg-[#182234]/95 border-blue-500/50 text-blue-100 shadow-blue-950/40'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
                {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {!isError && !isWarning && !isSuccess && <Info className="w-5 h-5 text-blue-400" />}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-semibold text-sm leading-tight text-white">{toast.title}</h4>
                  <button
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                    aria-label="Đóng thông báo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-zinc-300 leading-relaxed break-words">{toast.message}</p>
                {toast.detail && (
                  <div className="mt-2.5 p-2 rounded bg-black/40 border border-white/10 font-mono text-[11px] text-zinc-300 max-h-28 overflow-y-auto select-all">
                    {toast.detail}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
