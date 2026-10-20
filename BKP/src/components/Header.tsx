import React, { useState } from 'react';
import { Menu, X, ArrowRight, ShieldCheck, Sliders, Eye, FileText } from 'lucide-react';
import { ActiveAppTab } from '../types';
import { MultilagosLogo } from './MultilagosLogo';

interface HeaderProps {
  currentTab: ActiveAppTab;
  onSelectTab: (tab: ActiveAppTab) => void;
  proposalCode?: string;
  isClientDirectAccess?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentTab, 
  onSelectTab, 
  proposalCode,
  isClientDirectAccess = false 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: ActiveAppTab) => {
    onSelectTab(tab);
    setMobileMenuOpen(false);
  };

  // If the client accessed directly via the generated link, hide internal consultant navigation
  if (isClientDirectAccess) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 bg-[#111F24]/95 backdrop-blur-md border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Official Multilagos Logo & Consultant Station Badge */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => handleNavClick('simulador')}
              className="cursor-pointer text-left transition-opacity hover:opacity-90 flex items-center"
              title="MULTILAGOS Negócios & Tecnologia"
            >
              <MultilagosLogo variant="dark" height={38} />
            </button>

            <div className="hidden lg:flex items-center pl-4 border-l border-slate-700 text-xs text-slate-300 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-semibold text-white">Estação Comercial do Consultor</span>
            </div>
          </div>

          {/* Navigation Tabs for the Consultant */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <button
              onClick={() => handleNavClick('simulador')}
              className={`relative py-1 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'simulador' 
                  ? 'text-white font-bold' 
                  : 'hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4 text-[#D40B3A]" />
              <span>Diagnóstico & Simulador de Propostas</span>
              {currentTab === 'simulador' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D40B3A] rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('cliente_aceite')}
              className={`relative py-1 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'cliente_aceite' 
                  ? 'text-white font-bold' 
                  : 'hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Portal de Aceite do Cliente</span>
              {currentTab === 'cliente_aceite' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D40B3A] rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('admin')}
              className={`relative py-1 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'admin' 
                  ? 'text-white font-bold' 
                  : 'hover:text-white'
              }`}
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Painel do Consultor</span>
              {currentTab === 'admin' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D40B3A] rounded-full" />
              )}
            </button>
          </nav>

          {/* Action button */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={() => handleNavClick(currentTab === 'simulador' ? 'cliente_aceite' : 'simulador')}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#D40B3A] hover:bg-[#B50931] rounded-xl transition-all shadow-md active:scale-98 cursor-pointer"
            >
              <span>{currentTab === 'simulador' ? 'Ver Link do Cliente' : 'Voltar ao Simulador'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#16242A] px-4 pt-3 pb-6 space-y-2">
          <button
            onClick={() => handleNavClick('simulador')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              currentTab === 'simulador' ? 'bg-[#D40B3A] text-white font-bold' : 'text-slate-300'
            }`}
          >
            Diagnóstico & Simulador de Propostas
          </button>
          <button
            onClick={() => handleNavClick('cliente_aceite')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              currentTab === 'cliente_aceite' ? 'bg-[#D40B3A] text-white font-bold' : 'text-slate-300'
            }`}
          >
            Portal de Aceite do Cliente
          </button>
          <button
            onClick={() => handleNavClick('admin')}
            className={`w-full text-left px-3 py-2 rounded-md text-base font-medium ${
              currentTab === 'admin' ? 'bg-[#D40B3A] text-white font-bold' : 'text-slate-300'
            }`}
          >
            Painel do Consultor (Configurações)
          </button>
        </div>
      )}
    </header>
  );
};
