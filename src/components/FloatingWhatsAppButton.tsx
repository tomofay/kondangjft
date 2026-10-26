'use client';

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { WHATSAPP_CONTACT_NUMBER } from '../lib/dataStore';

interface FloatingWhatsAppButtonProps {
  customMessage?: string;
  phoneNumber?: string;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  customMessage = 'Halo Admin KondangSensei, saya butuh bantuan mengenai simulasi CBT JFT-Basic.',
  phoneNumber = WHATSAPP_CONTACT_NUMBER
}) => {
  const [showTooltip, setShowTooltip] = useState(true);

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(customMessage)}`;

  return (
    <aside aria-label="Bantuan WhatsApp" className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end gap-2 group">
      {/* Tooltip / Speech Bubble */}
      {showTooltip && (
        <div className="hidden xs:flex items-center gap-2 px-3 py-1.5 bg-stone-900/95 text-white text-[11px] font-bold rounded-2xl shadow-xl border border-stone-700/60 backdrop-blur-md animate-in fade-in slide-in-from-bottom-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span>Butuh Bantuan? Chat CS</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowTooltip(false);
            }}
            className="text-stone-400 hover:text-white p-0.5 ml-1 transition"
            title="Tutup pesan bantuan"
            aria-label="Tutup pesan bantuan"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Floating Action Button */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi WhatsApp Customer Service KondangSensei"
        className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 hover:shadow-xl hover:shadow-emerald-600/50 hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/30 cursor-pointer"
        title="Hubungi WhatsApp Customer Service"
      >
        <MessageCircle className="w-7 h-7 sm:w-7.5 sm:h-7.5 fill-white/20 stroke-[2.2]" />
      </a>
    </aside>
  );
};
