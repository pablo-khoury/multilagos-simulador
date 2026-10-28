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
  ProposalFinancials,
  ClientPricingTier,
  ReguaPortfolioType,
  ContractServiceItem
} from './types';

import { 
  MULTILAGOS_INFO, 
  DEFAULT_ASAAS_CONFIG, 
  ALL_INITIAL_PLANS, 
  INITIAL_DIAGNOSTIC_SHEET,
  DEFAULT_CLIENT_PRICING_TIERS
} from './data/mockData';

import { 
  generateProposalCode, 
  getFormattedCurrentDate, 
  getValidityDate,
  extractProposalFromCurrentUrl,
  buildClientShareUrl,
  saveProposalSnapshotLocally,
  getDefaultPromptDiscountPercent,
  calculateMonthlyWithPromptDiscount,
  getTieredPlanPrice,
  getReguaPlanPrices,
  getReguaFeaturesForPortfolio
} from './utils/calculator';

const STORAGE_KEYS = {
  PLANS: 'multilagos_commercial_plans_v3',
  ASAAS: 'multilagos_asaas_config_v3',
  ACTIVE_PROPOSAL: 'multilagos_active_proposal_v3',
  DIAGNOSTIC: 'multilagos_diagnostic_sheet_v3',
  PRICING_TIERS: 'multilagos_pricing_tiers_v4',
};

function buildBaseProposal(
  codesObj: { propId: string; msaId: string },
  diag: DiagnosticSheetData
): CommercialProposal {
  const basePlan = ALL_INITIAL_PLANS.find((p) => p.id === 'pro') || ALL_INITIAL_PLANS[0];
  const defaultPromptPct = getDefaultPromptDiscountPercent();
  const initialFinancials: ProposalFinancials = {
    setupPrice: basePlan.baseSetupPrice,
    setupDiscountApplied: false,
    setupDiscountValue: 0,
    setupDiscountReason: '',
    setupTotal: basePlan.baseSetupPrice,
    setupPaymentMode: 'cash',
    setupCashPrice: basePlan.baseSetupPrice,
    setupInstallmentTotal: basePlan.baseSetupPrice,
    setupInstallmentsCount: 3,
    allowClientChooseSetupMode: true,
    monthlyPrice: basePlan.baseMonthlyPrice,
    monthlyDiscountApplied: false,
    monthlyDiscountValue: 0,
    monthlyDiscountReason: '',
    monthlyTotal: basePlan.baseMonthlyPrice,
    hasPromptPaymentDiscount: defaultPromptPct > 0,
    promptPaymentDiscountPercent: defaultPromptPct,
    monthlyWithPromptDiscount: calculateMonthlyWithPromptDiscount(
      basePlan.baseMonthlyPrice,
      defaultPromptPct > 0,
      defaultPromptPct
    ),
    dueDay: 10,
  };

  const cleanCompany =
    diag.companyName && diag.companyName !== 'Minha Empresa Ltda' ? diag.companyName : '';

  return {
    id: codesObj.propId,
    contractMasterId: codesObj.msaId,
    createdAt: getFormattedCurrentDate(),
    validUntil: getValidityDate(15),
    consultantName: MULTILAGOS_INFO.representativeName,
    consultantEmail: MULTILAGOS_INFO.email,
    consultantPhone: MULTILAGOS_INFO.phone,
    status: 'draft',

    serviceTrack: 'esteira-asaas',
    planId: 'pro',
    reguaPortfolioType: 'multilagos',

    clientInfo: {
      companyName: cleanCompany,
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
      currentSystemName: diag.currentSystem,
      connectedWhatsApp: '',
    },

    diagnosticData: diag,
    financials: initialFinancials,
    minimumContractMonths: 0,
    contractDurationText: 'Tempo Indeterminado (sem vencimento preestabelecido)',
    startDate: getFormattedCurrentDate(),

    signature: {
      signed: false,
      signatureType: 'draw',
    },
  };
}

export default function App() {
  // Synchronously inspect URL parameters BEFORE first render so client links never mount ProposalSimulator
  const [initialUrlState] = useState(() => extractProposalFromCurrentUrl());

  const [isClientDirectAccess, setIsClientDirectAccess] = useState<boolean>(
    () => initialUrlState.isClientAccess
  );
  const [currentTab, setCurrentTab] = useState<ActiveAppTab>(() =>
    initialUrlState.isClientAccess ? 'cliente_aceite' : 'simulador'
  );

  // Proposal identification codes & external sync counter for ProposalSimulator
  const [codes, setCodes] = useState(() => generateProposalCode());
  const [proposalSyncVersion, setProposalSyncVersion] = useState(0);

  // Admin editable states with localStorage persistence (merged with defaults for new portfolio fields)
  const [plans, setPlans] = useState<Plan[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PLANS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return ALL_INITIAL_PLANS.map((defPlan) => {
            const found = parsed.find((p: Plan) => p.id === defPlan.id);
            if (!found) return defPlan;
            return {
              ...defPlan,
              ...found,
              clientPortfolioMonthlyPrice:
                typeof found.clientPortfolioMonthlyPrice === 'number'
                  ? found.clientPortfolioMonthlyPrice
                  : defPlan.clientPortfolioMonthlyPrice,
              clientPortfolioSetupPrice:
                typeof found.clientPortfolioSetupPrice === 'number'
                  ? found.clientPortfolioSetupPrice
                  : defPlan.clientPortfolioSetupPrice,
            };
          });
        }
      }
    } catch {}
    return ALL_INITIAL_PLANS;
  });

  const [asaasConfig, setAsaasConfig] = useState<AsaasConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ASAAS);
      return saved ? JSON.parse(saved) : DEFAULT_ASAAS_CONFIG;
    } catch {
      return DEFAULT_ASAAS_CONFIG;
    }
  });

  const [pricingTiers, setPricingTiers] = useState<ClientPricingTier[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRICING_TIERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= DEFAULT_CLIENT_PRICING_TIERS.length) {
          return parsed;
        }
      }
    } catch {}
    return DEFAULT_CLIENT_PRICING_TIERS;
  });

  // Diagnostic sheet data
  const [diagnosticData, setDiagnosticData] = useState<DiagnosticSheetData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DIAGNOSTIC);
      return saved ? JSON.parse(saved) : INITIAL_DIAGNOSTIC_SHEET;
    } catch {
      return INITIAL_DIAGNOSTIC_SHEET;
    }
  });

  // Active Proposal Object initialized synchronously from URL (if client link) or saved consultant state
  const [activeProposal, setActiveProposal] = useState<CommercialProposal>(() => {
    const base = buildBaseProposal(codes, diagnosticData);

    // 1. Client Direct Link: use decoded URL payload with 100% priority!
    if (initialUrlState.isClientAccess && initialUrlState.decoded) {
      const dec = initialUrlState.decoded;
      return {
        ...base,
        ...dec,
        id: dec.id || initialUrlState.proposalId || base.id,
        contractMasterId: dec.contractMasterId || base.contractMasterId,
        clientInfo: {
          ...base.clientInfo,
          ...(dec.clientInfo || {}),
        },
        financials: {
          ...base.financials,
          ...(dec.financials as ProposalFinancials),
        },
      };
    }

    // 2. Consultant Workstation: restore last active simulation if still in draft
    if (!initialUrlState.isClientAccess) {
      try {
        const savedProp = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROPOSAL);
        if (savedProp) {
          const parsed = JSON.parse(savedProp) as CommercialProposal;
          if (parsed && parsed.id && parsed.financials && !parsed.signature?.signed) {
            return {
              ...base,
              ...parsed,
              clientInfo: {
                ...base.clientInfo,
                ...(parsed.clientInfo || {}),
              },
              financials: {
                ...base.financials,
                ...parsed.financials,
              },
            };
          }
        }
      } catch {}
    }

    return base;
  });

  // Current simulation state synced with activeProposal
  const [selectedTrack, setSelectedTrack] = useState<ServiceTrack>(
    () => activeProposal.serviceTrack || 'esteira-asaas'
  );
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(
    () => activeProposal.planId || 'pro'
  );

  // Also listen to popstate/hashchange in case a client URL is navigated to dynamically
  useEffect(() => {
    const syncFromUrl = () => {
      const extracted = extractProposalFromCurrentUrl();
      if (extracted.isClientAccess && extracted.decoded) {
        const dec = extracted.decoded;
        setActiveProposal((prev) => ({
          ...prev,
          ...dec,
          clientInfo: {
            ...prev.clientInfo,
            ...(dec.clientInfo || {}),
          },
          financials: {
            ...prev.financials,
            ...(dec.financials as ProposalFinancials),
          },
        }));
        if (dec.serviceTrack) setSelectedTrack(dec.serviceTrack);
        if (dec.planId) setSelectedPlanId(dec.planId);
        setIsClientDirectAccess(true);
        setCurrentTab('cliente_aceite');
      }
    };

    window.addEventListener('popstate', syncFromUrl);
    window.addEventListener('hashchange', syncFromUrl);
    return () => {
      window.removeEventListener('popstate', syncFromUrl);
      window.removeEventListener('hashchange', syncFromUrl);
    };
  }, []);

  // Persist active proposal in consultant mode & keep URL bar ready when previewing Client Portal
  useEffect(() => {
    if (isClientDirectAccess) return;

    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PROPOSAL, JSON.stringify(activeProposal));
      saveProposalSnapshotLocally(activeProposal);
    } catch {}

    try {
      if (currentTab === 'cliente_aceite') {
        const shareUrl = buildClientShareUrl(activeProposal);
        if (shareUrl) {
          window.history.replaceState(null, '', shareUrl);
        }
      } else if (window.location.search.includes('proposta=') || window.location.search.includes('p=')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    } catch {}
  }, [activeProposal, currentTab, isClientDirectAccess]);

  // Create a brand-new proposal (fresh ID & default clean values)
  const handleCreateNewProposal = () => {
    const newCodes = generateProposalCode();
    setCodes(newCodes);
    const fresh = buildBaseProposal(newCodes, diagnosticData);
    setSelectedTrack('esteira-asaas');
    setSelectedPlanId('pro');
    setActiveProposal(fresh);
    setProposalSyncVersion((v) => v + 1);
  };

  // Save diagnostic changes and sync company name
  const handleUpdateDiagnostic = (updated: DiagnosticSheetData) => {
    setDiagnosticData(updated);
    localStorage.setItem(STORAGE_KEYS.DIAGNOSTIC, JSON.stringify(updated));
    const cleanCompany =
      updated.companyName && updated.companyName !== 'Minha Empresa Ltda'
        ? updated.companyName
        : '';
    setActiveProposal((prev) => ({
      ...prev,
      diagnosticData: updated,
      clientInfo: {
        ...prev.clientInfo,
        companyName: cleanCompany || prev.clientInfo.companyName,
        currentSystemName: updated.currentSystem,
      },
    }));
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
    const portfolio: ReguaPortfolioType = activeProposal.reguaPortfolioType || 'multilagos';
    const clientCount = diagnosticData.clientCount || 0;

    let setupVal = targetPlan.baseSetupPrice;
    let monthlyVal = targetPlan.baseMonthlyPrice;
    let serviceItem: ContractServiceItem;

    if (track === 'esteira-asaas') {
      const tiered = clientCount > 0 ? getTieredPlanPrice(targetPlan.id, clientCount, pricingTiers) : null;
      setupVal = tiered?.setupPrice ?? targetPlan.baseSetupPrice;
      monthlyVal = tiered?.monthlyPrice ?? targetPlan.baseMonthlyPrice;
      serviceItem = {
        id: 'serv-asaas',
        name: `Implantação Asaas (${targetPlan.name})`,
        category: 'asaas',
        planId: targetPlan.id,
        setupPrice: setupVal,
        monthlyPrice: monthlyVal,
        description: 'Conta digital homologada, emissão de NFS-e e automações financeiras.',
        features: targetPlan.features,
      };
    } else {
      const reguaPrices = getReguaPlanPrices(targetPlan, portfolio);
      const reguaFeats = getReguaFeaturesForPortfolio(targetPlan, portfolio);
      const portfolioTag = portfolio === 'client' ? 'Portfólio do Cliente' : 'Meu Portfólio Multilagos';
      setupVal = reguaPrices.setupPrice;
      monthlyVal = reguaPrices.monthlyPrice;
      serviceItem = {
        id: 'serv-regua',
        name: `Régua de Cobrança WhatsApp (${targetPlan.name} disparos/mês · ${portfolioTag})`,
        category: 'regua-n8n',
        planId: targetPlan.id,
        reguaPortfolioType: portfolio,
        setupPrice: setupVal,
        monthlyPrice: monthlyVal,
        description:
          portfolio === 'client'
            ? 'Automação multicanal no WhatsApp via n8n conectada ao Portfólio Meta (BM) do Cliente (tarifas Meta diretas).'
            : 'Automação multicanal no WhatsApp via n8n no Portfólio Multilagos com custos da Meta inclusos.',
        features: reguaFeats,
      };
    }

    const defaultPromptPct = getDefaultPromptDiscountPercent();
    const newFinancials: ProposalFinancials = {
      setupPrice: setupVal,
      setupDiscountApplied: false,
      setupDiscountValue: 0,
      setupTotal: setupVal,
      setupPaymentMode: 'cash',
      setupCashPrice: setupVal,
      setupInstallmentTotal: setupVal,
      setupInstallmentsCount: 3,
      allowClientChooseSetupMode: true,
      monthlyPrice: monthlyVal,
      monthlyDiscountApplied: false,
      monthlyDiscountValue: 0,
      monthlyTotal: monthlyVal,
      hasPromptPaymentDiscount: defaultPromptPct > 0,
      promptPaymentDiscountPercent: defaultPromptPct,
      monthlyWithPromptDiscount: calculateMonthlyWithPromptDiscount(
        monthlyVal,
        defaultPromptPct > 0,
        defaultPromptPct
      ),
      dueDay: 10,
    };

    const cleanCompany =
      companyName && companyName !== 'Minha Empresa Ltda' ? companyName : '';

    setActiveProposal((prev) => ({
      ...prev,
      serviceTrack: track,
      planId,
      selectedServices: [serviceItem],
      customFeatures: serviceItem.features,
      financials: newFinancials,
      clientInfo: {
        ...prev.clientInfo,
        companyName: cleanCompany || prev.clientInfo.companyName,
      },
    }));

    setProposalSyncVersion((v) => v + 1);

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

  const handleUpdateReguaPortfolio = (reguaPortfolioType: ReguaPortfolioType) => {
    setActiveProposal((prev) => ({
      ...prev,
      reguaPortfolioType,
    }));
  };

  const handleUpdateCustomFeatures = (customFeatures: string[]) => {
    setActiveProposal((prev) => ({
      ...prev,
      customFeatures,
    }));
  };

  const handleUpdateSelectedServices = (services: ContractServiceItem[]) => {
    setActiveProposal((prev) => ({
      ...prev,
      selectedServices: services,
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

  const handleSavePricingTiers = (updated: ClientPricingTier[]) => {
    setPricingTiers(updated);
    localStorage.setItem(STORAGE_KEYS.PRICING_TIERS, JSON.stringify(updated));
  };

  const handleResetDefaults = () => {
    localStorage.clear();
    setPlans(ALL_INITIAL_PLANS);
    setPricingTiers(DEFAULT_CLIENT_PRICING_TIERS);
    setAsaasConfig(DEFAULT_ASAAS_CONFIG);
    setDiagnosticData(INITIAL_DIAGNOSTIC_SHEET);
    handleCreateNewProposal();
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
        proposalCode={activeProposal.id}
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
              pricingTiers={pricingTiers}
              selectedServiceTrack={selectedTrack}
              selectedPlanId={selectedPlanId}
              activeProposal={activeProposal}
              diagnosticData={diagnosticData}
              syncVersion={proposalSyncVersion}
              onCreateNewProposal={handleCreateNewProposal}
              onUpdateTrack={handleUpdateTrack}
              onUpdatePlan={handleUpdatePlan}
              onUpdateReguaPortfolio={handleUpdateReguaPortfolio}
              onUpdateFinancials={handleUpdateFinancials}
              onUpdateNotes={(notes) => setActiveProposal((prev) => ({ ...prev, notes }))}
              onUpdateCustomFeatures={handleUpdateCustomFeatures}
              onUpdateDiagnostic={handleUpdateDiagnostic}
              onUpdateSelectedServices={handleUpdateSelectedServices}
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
            onUpdateFinancials={handleUpdateFinancials}
            onUpdateClientInfo={(info) =>
              setActiveProposal((prev) =>
                JSON.stringify(prev.clientInfo) === JSON.stringify(info)
                  ? prev
                  : { ...prev, clientInfo: info }
              )
            }
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
            pricingTiers={pricingTiers}
            asaasConfig={asaasConfig}
            diagnosticData={diagnosticData}
            onSavePlans={handleSavePlans}
            onSavePricingTiers={handleSavePricingTiers}
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
