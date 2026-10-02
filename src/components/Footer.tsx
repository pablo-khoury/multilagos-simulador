import React from 'react';
import { MULTILAGOS_INFO } from '../data/mockData';
import { MultilagosLogo } from './MultilagosLogo';
import { ShieldCheck, Mail, Phone, MapPin } from 'lucide-react';

interface FooterProps {
  onNavigate: (tabOrSection: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-[#0D181C] text-slate-400 text-xs py-14 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-12 border-b border-slate-800">
          
          {/* Brand Info */}
          <div className="md:col-span-5 space-y-3">
            <MultilagosLogo variant="dark" height={38} />

            <p className="text-slate-400 text-xs max-w-sm leading-relaxed mt-2">
              Gestão de Cobranças 4.0. Automação inteligente para previsibilidade financeira, redução de inadimplência e emissão automática de NFS-e.
            </p>

            <div className="flex items-center gap-2 text-slate-300 text-[11px] pt-1">
              <ShieldCheck className="w-4 h-4 text-[#D40B3A] shrink-0" />
              <span>Parceiro Oficial Asaas · CNPJ: {MULTILAGOS_INFO.cnpj}</span>
            </div>
          </div>

          {/* Quick Navigation */}
          <div className="md:col-span-3 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              Navegação Interna
            </p>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onNavigate('simulador')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Diagnóstico & Simulador Comercial
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('cliente_aceite')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Portal de Aceite do Cliente
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('admin')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Painel Administrativo do Consultor
                </button>
              </li>
            </ul>
          </div>

          {/* Official Contact Info */}
          <div className="md:col-span-4 space-y-3">
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              Canais Oficiais Multilagos
            </p>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D40B3A] shrink-0 mt-0.5" />
                <span>{MULTILAGOS_INFO.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#D40B3A] shrink-0" />
                <span>{MULTILAGOS_INFO.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#D40B3A] shrink-0" />
                <span>{MULTILAGOS_INFO.email}</span>
              </div>
            </div>
          </div>

        </div>

        {/* Quiet Copyright Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>
            © {new Date().getFullYear()} {MULTILAGOS_INFO.companyName}. Todos os direitos reservados.
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Contrato Mestre (MSA)</span>
            <span aria-hidden="true">·</span>
            <span>Segurança & LGPD</span>
            <span aria-hidden="true">·</span>
            <span>asaas.com/parceiros/multilagos</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
