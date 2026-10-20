import React from 'react';
import { MessageSquare } from 'lucide-react';
import { MULTILAGOS_INFO } from '../data/mockData';

export const WhatsAppFloat: React.FC = () => {
  return (
    <div id="floating-whatsapp" className="no-print fixed bottom-6 right-6 z-40">
      <a
        href={`https://api.whatsapp.com/send?phone=${MULTILAGOS_INFO.whatsapp}&text=${encodeURIComponent('Olá! Estou na página oficial da Multilagos e gostaria de falar com um consultor sobre o simulador de propostas.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2.5 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95"
        aria-label="Atendimento Comercial no WhatsApp"
      >
        <MessageSquare className="w-5 h-5 fill-current" />
        <span className="hidden sm:inline text-xs font-bold whitespace-nowrap">
          WhatsApp Comercial
        </span>
      </a>
    </div>
  );
};
