import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
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

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content - Extreme Contrast Fix */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-lg shadow-2xl transform transition-all flex flex-col max-h-[90vh] sm:rounded-3xl rounded-t-3xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-[slideUp_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <h3 className="text-xl font-black text-slate-950 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Body - Explicit Text Colors */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 text-slate-950 dark:text-white">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};