/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DiagnosticTool } from './components/DiagnosticTool';
import { ProposalSimulator } from './components/ProposalSimulator';
import { ClientAcceptanceView } from './components/ClientAcceptanceView';
import { AdminPanel } from './components/AdminPanel';
import { Footer } from './components/Footer';
import { WhatsAppFloat } from './components/WhatsAppFloat';

import { 
  Plan, 
  AsaasConfig, 
  CommercialProposal, 
  ActiveAppTab,
  PlanId,
  ServiceTrack,
  DiagnosticSheetData,
  ProposalFinancials
} from './types';

import { 
  MULTILAGOS_INFO, 
  DEFAULT_ASAAS_CONFIG, 
  ALL_INITIAL_PLANS, 
  INITIAL_DIAGNOSTIC_SHEET 
} from './data/mockData';

import { 
  generateProposalCode, 
  getFormattedCurrentDate, 
  getValidityDate,
  decodeProposalFromUrlParam
} from './utils/calculator';

const STORAGE_KEYS = {
  PLANS: 'multilagos_commercial_plans_v3',
  ASAAS: 'multilagos_asaas_config_v3',
  ACTIVE_PROPOSAL: 'multilagos_active_proposal_v3',
  DIAGNOSTIC: 'multilagos_diagnostic_sheet_v3',
};

export default function App() {
  // Navigation tab state (default: simulador)
  const [currentTab, setCurrentTab] = useState<ActiveAppTab>('simulador');
  const [isClientDirectAccess, setIsClientDirectAccess] = useState(false);

  // Proposal identification codes
  const [codes] = useState(() => generateProposalCode());

  // Admin editable states with localStorage persistence
  const [plans, setPlans] = useState<Plan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
    return saved ? JSON.parse(saved) : ALL_INITIAL_PLANS;
  });

  const [asaasConfig, setAsaasConfig] = useState<AsaasConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ASAAS);
    return saved ? JSON.parse(saved) : DEFAULT_ASAAS_CONFIG;
  });

  // Diagnostic sheet data
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticSheetData>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC);
    return saved ? JSON.parse(saved) : INITIAL_DIAGNOSTIC_SHEET;
  });

  // Current simulation state (managed by the consultant)
  const [selectedTrack, setSelectedTrack] = useState<ServiceTrack>('esteira-asaas');
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>('pro');

  // Active Proposal Object
  const [activeProposal, setActiveProposal] = useState<CommercialProposal>(() => {
    const basePlan = ALL_INITIAL_PLANS.find((p) => p.id === 'pro') || ALL_INITIAL_PLANS[0];
    const initialFinancials: ProposalFinancials = {
      setupPrice: basePlan.baseSetupPrice,
      setupDiscountApplied: false,
      setupDiscountValue: 0,
      setupDiscountReason: '',
      setupTotal: basePlan.baseSetupPrice,
      monthlyPrice: basePlan.baseMonthlyPrice,
      monthlyDiscountApplied: false,
      monthlyDiscountValue: 0,
      monthlyDiscountReason: '',
      monthlyTotal: basePlan.baseMonthlyPrice,
      hasPromptPaymentDiscount: true,
      monthlyWithPromptDiscount: Math.round(basePlan.baseMonthlyPrice * 0.95),
      dueDay: 10,
    };

    return {
      id: codes.propId,
      contractMasterId: codes.msaId,
      createdAt: getFormattedCurrentDate(),
      validUntil: getValidityDate(15),
      consultantName: MULTILAGOS_INFO.representativeName,
      consultantEmail: MULTILAGOS_INFO.email,
      consultantPhone: MULTILAGOS_INFO.phone,
      status: 'draft',
      
      serviceTrack: 'esteira-asaas',
      planId: 'pro',

      clientInfo: {
        companyName: INITIAL_DIAGNOSTIC_SHEET.companyName,
        tradeName: '',
        cnpj: '',
        stateRegistration: '',
        address: '',
        contactName: '',
        contactRole: 'Diretor / Sócio-Administrador',
        cpf: '',
        email: '',
        phone: '',
        cityState: 'Belo Horizonte/MG',
        currentSystemName: INITIAL_DIAGNOSTIC_SHEET.currentSystem,
        connectedWhatsApp: '',
      },

      diagnosticData: INITIAL_DIAGNOSTIC_SHEET,
      financials: initialFinancials,
      minimumContractMonths: 12,
      startDate: getFormattedCurrentDate(),

      signature: {
        signed: false,
        signatureType: 'draw',
      },
    };
  });

  // Check URL query parameters on mount to accurately load proposal for client
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedPayload = urlParams.get('p');
    const proposalIdParam = urlParams.get('proposta');

    if (encodedPayload) {
      const decoded = decodeProposalFromUrlParam(encodedPayload);
      if (decoded) {
        setActiveProposal((prev) => ({
          ...prev,
          ...decoded,
          clientInfo: {
            ...prev.clientInfo,
            ...decoded.clientInfo,
          },
          financials: {
            ...prev.financials,
            ...(decoded.financials as any),
          },
        }));
        if (decoded.serviceTrack) setSelectedTrack(decoded.serviceTrack);
        if (decoded.planId) setSelectedPlanId(decoded.planId);
      }
      setIsClientDirectAccess(true);
      setCurrentTab('cliente_aceite');
    } else if (proposalIdParam || urlParams.get('tab') === 'cliente') {
      setIsClientDirectAccess(true);
      setCurrentTab('cliente_aceite');
    }
  }, []);

  // Save diagnostic changes and sync company name
  const handleUpdateDiagnostic = (updated: DiagnosticSheetData) => {
    setDiagnosticData(updated);
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC, JSON.stringify(updated));
    if (updated.companyName) {
      setActiveProposal((prev) => ({
        ...prev,
        clientInfo: {
          ...prev.clientInfo,
          companyName: updated.companyName,
          currentSystemName: updated.currentSystem,
        },
      }));
    }
  };

  // When consultant applies recommendation from diagnostic
  const handleApplyDiagnosticRecommendation = (
    track: ServiceTrack,
    planId: PlanId,
    companyName: string
  ) => {
    setSelectedTrack(track);
    setSelectedPlanId(planId);
    
    const targetPlan = plans.find((p) => p.id === planId) || plans[0];
    const newFinancials: ProposalFinancials = {
      setupPrice: targetPlan.baseSetupPrice,
      setupDiscountApplied: false,
      setupDiscountValue: 0,
      setupTotal: targetPlan.baseSetupPrice,
      monthlyPrice: targetPlan.baseMonthlyPrice,
      monthlyDiscountApplied: false,
      monthlyDiscountValue: 0,
      monthlyTotal: targetPlan.baseMonthlyPrice,
      hasPromptPaymentDiscount: true,
      monthlyWithPromptDiscount: Math.round(targetPlan.baseMonthlyPrice * 0.95),
      dueDay: 10,
    };

    setActiveProposal((prev) => ({
      ...prev,
      serviceTrack: track,
      planId,
      financials: newFinancials,
      clientInfo: {
        ...prev.clientInfo,
        companyName: companyName || prev.clientInfo.companyName,
      },
    }));

    setTimeout(() => {
      const el = document.getElementById('simulador');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Financial updates from proposal simulator
  const handleUpdateFinancials = (fin: ProposalFinancials) => {
    setActiveProposal((prev) => ({
      ...prev,
      financials: fin,
    }));
  };

  const handleUpdateTrack = (track: ServiceTrack) => {
    setSelectedTrack(track);
    setActiveProposal((prev) => ({
      ...prev,
      serviceTrack: track,
    }));
  };

  const handleUpdatePlan = (planId: PlanId) => {
    setSelectedPlanId(planId);
    setActiveProposal((prev) => ({
      ...prev,
      planId,
    }));
  };

  const handleUpdateCustomFeatures = (customFeatures: string[]) => {
    setActiveProposal((prev) => ({
      ...prev,
      customFeatures,
    }));
  };

  // Admin save handlers
  const handleSavePlans = (updated: Plan[]) => {
    setPlans(updated);
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(updated));
  };

  const handleSaveAsaasConfig = (updated: AsaasConfig) => {
    setAsaasConfig(updated);
    localStorage.setItem(STORAGE_KEYS.ASAAS, JSON.stringify(updated));
  };

  const handleResetDefaults = () => {
    if (confirm('Deseja restaurar as configurações e planos originais da Multilagos?')) {
      localStorage.clear();
      setPlans(ALL_INITIAL_PLANS);
      setAsaasConfig(DEFAULT_ASAAS_CONFIG);
      setDiagnosticData(INITIAL_DIAGNOSTIC_SHEET);
      alert('Padrões restaurados com sucesso.');
    }
  };

  return (
    <div className="min-h-screen bg-[#111F24] flex flex-col font-sans text-[#CDDADE] selection:bg-[#D40B3A] selection:text-white">
      {/* Top Header for Consultant Workstation */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        proposalCode={codes.propId}
        isClientDirectAccess={isClientDirectAccess}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        
        {/* TAB 1: DIAGNÓSTICO & SIMULADOR COMERCIAL (Ferramenta de Reunião do Consultor) */}
        {currentTab === 'simulador' && (
          <div>
            {/* 1. Practical Spreadsheet Diagnostic Tool */}
            <DiagnosticTool
              diagnosticData={diagnosticData}
              onUpdateDiagnostic={handleUpdateDiagnostic}
              onApplyRecommendation={handleApplyDiagnosticRecommendation}
            />

            {/* 2. Proposal Preparation & Discount Adjuster */}
            <ProposalSimulator
              plans={plans}
              selectedServiceTrack={selectedTrack}
              selectedPlanId={selectedPlanId}
              activeProposal={activeProposal}
              diagnosticData={diagnosticData}
              onUpdateTrack={handleUpdateTrack}
              onUpdatePlan={handleUpdatePlan}
              onUpdateFinancials={handleUpdateFinancials}
              onUpdateNotes={(notes) => setActiveProposal((prev) => ({ ...prev, notes }))}
              onUpdateCustomFeatures={handleUpdateCustomFeatures}
              onUpdateDiagnostic={handleUpdateDiagnostic}
              onProceedToClientAcceptance={() => {
                setCurrentTab('cliente_aceite');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* TAB 2: PORTAL DE ACEITE EXCLUSIVO DO CLIENTE */}
        {currentTab === 'cliente_aceite' && (
          <ClientAcceptanceView
            proposal={activeProposal}
            asaasConfig={asaasConfig}
            customPlans={plans}
            isClientDirectAccess={isClientDirectAccess}
            onProposalSigned={(updated) => setActiveProposal(updated)}
            onBackToConsultantView={() => {
              setCurrentTab('simulador');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {/* TAB 3: PAINEL ADMINISTRATIVO DO CONSULTOR */}
        {currentTab === 'admin' && (
          <AdminPanel
            plans={plans}
            asaasConfig={asaasConfig}
            diagnosticData={diagnosticData}
            onSavePlans={handleSavePlans}
            onSaveAsaasConfig={handleSaveAsaasConfig}
            onSaveDiagnosticData={(data) => {
              setDiagnosticData(data);
              localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC, JSON.stringify(data));
            }}
            onResetDefaults={handleResetDefaults}
            onCloseAdmin={() => {
              setCurrentTab('simulador');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

      </main>

      {/* Corporate Footer (Hidden if direct client access) */}
      {!isClientDirectAccess && (
        <Footer
          onNavigate={(tab) => {
            if (['simulador', 'cliente_aceite', 'admin'].includes(tab)) {
              setCurrentTab(tab as ActiveAppTab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {/* Floating WhatsApp Contact Button */}
      <WhatsAppFloat />
    </div>
  );
}
