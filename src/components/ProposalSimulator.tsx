import React, { useState, useEffect, useRef } from 'react';
import { 
  Plan, 
  PlanId, 
  ServiceTrack, 
  CommercialProposal, 
  ProposalFinancials,
  DiagnosticSheetData,
  ContractServiceItem,
  ClientPricingTier,
  ReguaPortfolioType,
  SetupPaymentMode
} from '../types';
import { 
  formatBRL, 
  formatCleanPercent,
  buildClientShareUrl,
  calculateDiagnosticMetrics,
  getPricingTierForClientCount,
  getTieredPlanPrice,
  getEffectivePromptDiscountPercent,
  calculateMonthlyWithPromptDiscount,
  getSetupBillingDetails,
  getReguaPlanPrices,
  getReguaFeaturesForPortfolio
} from '../utils/calculator';
import { MULTILAGOS_INFO, DEFAULT_CLIENT_PRICING_TIERS } from '../data/mockData';
import { exportElementToPdf } from '../utils/pdfGenerator';
import { AsaasProposalDoc } from './documents/AsaasProposalDoc';
import { MulticobrancaProposalDoc } from './documents/MulticobrancaProposalDoc';
import { MasterContractDoc } from './documents/MasterContractDoc';

import { 
  Check, 
  ShieldCheck, 
  ArrowRight, 
  Send, 
  Copy, 
  Mail, 
  Download,
  Sliders,
  DollarSign,
  FileText,
  FileCheck,
  Building, 
  CheckCircle2, 
  ExternalLink,
  Trash2,
  Plus,
  Sparkles,
  Layers,
  Package,
  Clock,
  Calendar,
  CreditCard,
  TrendingDown,
  Users,
  RefreshCw,
  Link2
} from 'lucide-react';

interface ProposalSimulatorProps {
  plans: Plan[];
  pricingTiers?: ClientPricingTier[];
  selectedServiceTrack: ServiceTrack;
  selectedPlanId: PlanId;
  activeProposal: CommercialProposal;
  diagnosticData?: DiagnosticSheetData;
  syncVersion?: number;
  onCreateNewProposal?: () => void;
  onUpdateTrack: (track: ServiceTrack) => void;
  onUpdatePlan: (planId: PlanId) => void;
  onUpdateFinancials: (fin: ProposalFinancials) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateCustomFeatures?: (features: string[]) => void;
  onUpdateDiagnostic?: (data: DiagnosticSheetData) => void;
  onProceedToClientAcceptance: () => void;
  onUpdateSelectedServices?: (services: ContractServiceItem[]) => void;
  onUpdateReguaPortfolio?: (portfolio: ReguaPortfolioType) => void;
}

function deriveSelectionFromProposal(
  proposal: CommercialProposal,
  fallbackTrack: ServiceTrack,
  fallbackPlanId: PlanId
) {
  const services = proposal.selectedServices || [];
  if (services.length > 0) {
    const asaasItem = services.find((s) => s.category === 'asaas');
    const reguaItem = services.find((s) => s.category === 'regua-n8n');
    const bpoItem = services.find((s) => s.id === 'serv-bpo' || s.category === 'consultoria');
    const customList = services.filter((s) => s.category === 'custom');

    return {
      includeAsaas: !!asaasItem,
      selectedAsaasPlanId: (asaasItem?.planId || (fallbackTrack === 'esteira-asaas' ? fallbackPlanId : 'pro')) as PlanId,
      includeRegua: !!reguaItem,
      selectedReguaPlanId: (reguaItem?.planId || (fallbackTrack === 'esteira-regua-n8n' ? fallbackPlanId : 'regua-3k')) as PlanId,
      includeBpo: !!bpoItem,
      customServices: customList,
      reguaPortfolio: (reguaItem?.reguaPortfolioType || proposal.reguaPortfolioType || 'multilagos') as ReguaPortfolioType,
    };
  }

  return {
    includeAsaas: fallbackTrack === 'esteira-asaas',
    selectedAsaasPlanId: (fallbackTrack === 'esteira-asaas' ? fallbackPlanId : 'pro') as PlanId,
    includeRegua: fallbackTrack === 'esteira-regua-n8n',
    selectedReguaPlanId: (fallbackTrack === 'esteira-regua-n8n' ? fallbackPlanId : 'regua-3k') as PlanId,
    includeBpo: false,
    customServices: [] as ContractServiceItem[],
    reguaPortfolio: (proposal.reguaPortfolioType || 'multilagos') as ReguaPortfolioType,
  };
}

export const ProposalSimulator: React.FC<ProposalSimulatorProps> = ({
  plans,
  pricingTiers,
  selectedServiceTrack,
  selectedPlanId,
  activeProposal,
  diagnosticData,
  syncVersion = 0,
  onCreateNewProposal,
  onUpdateTrack,
  onUpdatePlan,
  onUpdateFinancials,
  onUpdateNotes,
  onUpdateCustomFeatures,
  onUpdateDiagnostic,
  onProceedToClientAcceptance,
  onUpdateSelectedServices,
  onUpdateReguaPortfolio,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<'proposal' | 'contract'>('proposal');
  const [newFeatureInput, setNewFeatureInput] = useState('');

  // Multi-service state derived from activeProposal so switching tabs never resets the proposal
  const asaasPlans = plans.filter((p) => p.track === 'asaas');
  const reguaPlans = plans.filter((p) => p.track === 'regua-n8n');

  const initialSelection = deriveSelectionFromProposal(activeProposal, selectedServiceTrack, selectedPlanId);

  // Regua WhatsApp Portfolio pricing mode ('multilagos' = Meta inclusa | 'client' = Portfólio BM do Cliente)
  const [reguaPortfolio, setReguaPortfolio] = useState<ReguaPortfolioType>(
    initialSelection.reguaPortfolio
  );

  // Setup installment pricing preset mode
  const [installmentMarkupMode, setInstallmentMarkupMode] = useState<'same' | 'table' | 'plus5' | 'plus10' | 'custom'>(() => {
    const f = activeProposal.financials;
    if (
      typeof f.setupInstallmentTotal === 'number' &&
      typeof f.setupCashPrice === 'number' &&
      f.setupInstallmentTotal !== f.setupCashPrice
    ) {
      return 'custom';
    }
    return 'same';
  });

  // Multi-service checkboxes
  const [includeAsaas, setIncludeAsaas] = useState<boolean>(initialSelection.includeAsaas);
  const [selectedAsaasPlanId, setSelectedAsaasPlanId] = useState<PlanId>(initialSelection.selectedAsaasPlanId);

  const [includeRegua, setIncludeRegua] = useState<boolean>(initialSelection.includeRegua);
  const [selectedReguaPlanId, setSelectedReguaPlanId] = useState<PlanId>(initialSelection.selectedReguaPlanId);

  const [includeBpo, setIncludeBpo] = useState<boolean>(initialSelection.includeBpo);

  // Custom additional services added by the consultant
  const [customServices, setCustomServices] = useState<ContractServiceItem[]>(initialSelection.customServices);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [showAsaasCompareModal, setShowAsaasCompareModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceSetup, setNewServiceSetup] = useState<number>(500);
  const [newServiceMonthly, setNewServiceMonthly] = useState<number>(200);
  const [newServiceDesc, setNewServiceDesc] = useState('');

  const currentAsaasPlan = asaasPlans.find((p) => p.id === selectedAsaasPlanId) || asaasPlans[1] || asaasPlans[0];
  const currentReguaPlan = reguaPlans.find((p) => p.id === selectedReguaPlanId) || reguaPlans[1] || reguaPlans[0];

  const fin = activeProposal.financials;
  const activeDiag = diagnosticData || activeProposal.diagnosticData;
  const diagMetrics = activeDiag ? calculateDiagnosticMetrics(activeDiag) : null;
  const activeScopeList = activeProposal.customFeatures || currentAsaasPlan.features;

  const effectiveTiers = pricingTiers && pricingTiers.length > 0 ? pricingTiers : DEFAULT_CLIENT_PRICING_TIERS;
  const clientCount = activeDiag?.clientCount || 0;
  const matchedTier = clientCount > 0 ? getPricingTierForClientCount(clientCount, effectiveTiers) : effectiveTiers[0];

  // Recalculate combined services and financials
  const updateServicesAndTotals = (
    asaasOn: boolean,
    asaasId: PlanId,
    reguaOn: boolean,
    reguaId: PlanId,
    bpoOn: boolean,
    customList: ContractServiceItem[],
    portfolioOverride?: ReguaPortfolioType
  ) => {
    const asaasObj = asaasPlans.find((p) => p.id === asaasId) || currentAsaasPlan;
    const reguaObj = reguaPlans.find((p) => p.id === reguaId) || currentReguaPlan;
    const activePortfolio = portfolioOverride || reguaPortfolio;

    const tieredAsaas = clientCount > 0 ? getTieredPlanPrice(asaasObj.id, clientCount, effectiveTiers) : null;
    const asaasSetup = tieredAsaas?.setupPrice ?? asaasObj.baseSetupPrice;
    const asaasMonthly = tieredAsaas?.monthlyPrice ?? asaasObj.baseMonthlyPrice;

    const items: ContractServiceItem[] = [];

    if (asaasOn) {
      items.push({
        id: 'serv-asaas',
        name: `Implantação Asaas (${asaasObj.name})`,
        category: 'asaas',
        planId: asaasObj.id,
        setupPrice: asaasSetup,
        monthlyPrice: asaasMonthly,
        description: 'Conta digital homologada, emissão de NFS-e e automações financeiras.',
        features: asaasObj.features,
      });
    }

    if (reguaOn) {
      const reguaPrices = getReguaPlanPrices(reguaObj, activePortfolio);
      const reguaFeats = getReguaFeaturesForPortfolio(reguaObj, activePortfolio);
      const portfolioTag = activePortfolio === 'client' ? 'Portfólio do Cliente' : 'Meu Portfólio Multilagos';

      items.push({
        id: 'serv-regua',
        name: `Régua de Cobrança WhatsApp (${reguaObj.name} disparos/mês · ${portfolioTag})`,
        category: 'regua-n8n',
        planId: reguaObj.id,
        reguaPortfolioType: activePortfolio,
        setupPrice: reguaPrices.setupPrice,
        monthlyPrice: reguaPrices.monthlyPrice,
        description:
          activePortfolio === 'client'
            ? 'Automação multicanal no WhatsApp via n8n conectada ao Portfólio Meta (BM) do Cliente (tarifas Meta diretas).'
            : 'Automação multicanal no WhatsApp via n8n no Portfólio Multilagos com custos da Meta inclusos.',
        features: reguaFeats,
      });
    }

    if (bpoOn) {
      items.push({
        id: 'serv-bpo',
        name: 'Consultoria e BPO Financeiro / Parametrização ERP',
        category: 'consultoria',
        setupPrice: 1500,
        monthlyPrice: 450,
        description: 'Conciliação de recebíveis, auditoria fiscal e suporte de fechamento mensal.',
        features: ['Parametrização contábil', 'Auditoria de recebíveis', 'Suporte avançado ERP'],
      });
    }

    // Add custom services
    customList.forEach((c) => items.push(c));

    // Update track and plan for fallback views
    if (asaasOn && !reguaOn) {
      onUpdateTrack('esteira-asaas');
      onUpdatePlan(asaasObj.id);
    } else if (reguaOn && !asaasOn) {
      onUpdateTrack('esteira-regua-n8n');
      onUpdatePlan(reguaObj.id);
    } else {
      // Both selected or combo
      onUpdateTrack('esteira-asaas');
      onUpdatePlan(asaasObj.id);
    }

    // Calculate aggregated base prices
    const totalBaseSetup = items.reduce((acc, curr) => acc + (curr.setupPrice || 0), 0);
    const totalBaseMonthly = items.reduce((acc, curr) => acc + (curr.monthlyPrice || 0), 0);

    const cashPrice = fin.setupDiscountApplied
      ? Math.max(0, totalBaseSetup - (fin.setupDiscountValue || 0))
      : totalBaseSetup;

    let instTotal = cashPrice;
    if (installmentMarkupMode === 'table') {
      instTotal = totalBaseSetup;
    } else if (installmentMarkupMode === 'plus5') {
      instTotal = Number((cashPrice * 1.05).toFixed(2));
    } else if (installmentMarkupMode === 'plus10') {
      instTotal = Number((cashPrice * 1.10).toFixed(2));
    } else if (installmentMarkupMode === 'custom' && typeof fin.setupInstallmentTotal === 'number') {
      instTotal = fin.setupInstallmentTotal;
    }

    const setupMode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
    const installmentsCount = Math.max(1, fin.setupInstallmentsCount || 3);
    const setupTotal = setupMode === 'installments' ? instTotal : cashPrice;

    const monthlyTotal = fin.monthlyDiscountApplied
      ? Math.max(0, totalBaseMonthly - (fin.monthlyDiscountValue || 0))
      : totalBaseMonthly;

    const hasPrompt = fin.hasPromptPaymentDiscount !== false;
    const promptPct = getEffectivePromptDiscountPercent({ ...fin, hasPromptPaymentDiscount: hasPrompt });
    const monthlyWithPromptDiscount = calculateMonthlyWithPromptDiscount(monthlyTotal, hasPrompt, promptPct);

    onUpdateFinancials({
      ...fin,
      setupPrice: totalBaseSetup,
      setupCashPrice: cashPrice,
      setupInstallmentTotal: instTotal,
      setupInstallmentsCount: installmentsCount,
      setupPaymentMode: setupMode,
      setupTotal,
      monthlyPrice: totalBaseMonthly,
      monthlyTotal,
      hasPromptPaymentDiscount: hasPrompt,
      promptPaymentDiscountPercent: promptPct,
      monthlyWithPromptDiscount,
    });

    if (onUpdateSelectedServices) {
      onUpdateSelectedServices(items);
    }

    // Combine scope features
    if (onUpdateCustomFeatures) {
      const combinedScope: string[] = [];
      items.forEach((item) => {
        if (item.features) {
          item.features.forEach((feat) => {
            if (!combinedScope.includes(feat)) combinedScope.push(feat);
          });
        }
      });
      if (combinedScope.length > 0) {
        onUpdateCustomFeatures(combinedScope);
      }
    }
  };

  const prevSyncVersionRef = useRef(syncVersion);
  const prevPricingDepsRef = useRef({ clientCount, pricingTiers, plans });

  // Sync initial services once on mount ONLY if activeProposal has no selectedServices yet
  useEffect(() => {
    if (!activeProposal.selectedServices || activeProposal.selectedServices.length === 0) {
      updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, includeBpo, customServices, reguaPortfolio);
    }
  }, []);

  // Re-sync UI checkboxes when external action occurs (Apply Diagnostic Recommendation or New Proposal)
  useEffect(() => {
    if (prevSyncVersionRef.current !== syncVersion) {
      prevSyncVersionRef.current = syncVersion;
      const derived = deriveSelectionFromProposal(activeProposal, selectedServiceTrack, selectedPlanId);
      setIncludeAsaas(derived.includeAsaas);
      setSelectedAsaasPlanId(derived.selectedAsaasPlanId);
      setIncludeRegua(derived.includeRegua);
      setSelectedReguaPlanId(derived.selectedReguaPlanId);
      setIncludeBpo(derived.includeBpo);
      setCustomServices(derived.customServices);
      setReguaPortfolio(derived.reguaPortfolio);
      if (!activeProposal.selectedServices || activeProposal.selectedServices.length === 0) {
        updateServicesAndTotals(
          derived.includeAsaas,
          derived.selectedAsaasPlanId,
          derived.includeRegua,
          derived.selectedReguaPlanId,
          derived.includeBpo,
          derived.customServices,
          derived.reguaPortfolio
        );
      }
    }
  }, [syncVersion, activeProposal, selectedServiceTrack, selectedPlanId]);

  // Sync pricing ONLY when client count, pricing tiers, or plan catalog actually change
  useEffect(() => {
    const prev = prevPricingDepsRef.current;
    const changed =
      prev.clientCount !== clientCount ||
      prev.pricingTiers !== pricingTiers ||
      prev.plans !== plans;

    if (changed) {
      prevPricingDepsRef.current = { clientCount, pricingTiers, plans };
      updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, includeBpo, customServices, reguaPortfolio);
    }
  }, [clientCount, pricingTiers, plans]);

  // Preset Handlers
  const handleSelectPresetCombo = () => {
    setIncludeAsaas(true);
    setSelectedAsaasPlanId('pro');
    setIncludeRegua(true);
    setSelectedReguaPlanId('regua-3k');
    setIncludeBpo(false);
    updateServicesAndTotals(true, 'pro', true, 'regua-3k', false, customServices);
  };

  const handleSelectPresetOnlyAsaas = () => {
    setIncludeAsaas(true);
    setIncludeRegua(false);
    setIncludeBpo(false);
    updateServicesAndTotals(true, selectedAsaasPlanId, false, selectedReguaPlanId, false, customServices);
  };

  const handleSelectPresetOnlyRegua = () => {
    setIncludeAsaas(false);
    setIncludeRegua(true);
    setIncludeBpo(false);
    updateServicesAndTotals(false, selectedAsaasPlanId, true, selectedReguaPlanId, false, customServices);
  };

  // Toggle individual service
  const handleToggleAsaas = (val: boolean) => {
    if (!val && !includeRegua && !includeBpo && customServices.length === 0) {
      return; // Keep at least one
    }
    setIncludeAsaas(val);
    updateServicesAndTotals(val, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, includeBpo, customServices);
  };

  const handleToggleRegua = (val: boolean) => {
    if (!val && !includeAsaas && !includeBpo && customServices.length === 0) {
      return; // Keep at least one
    }
    setIncludeRegua(val);
    updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, val, selectedReguaPlanId, includeBpo, customServices);
  };

  const handleToggleBpo = (val: boolean) => {
    setIncludeBpo(val);
    updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, val, customServices);
  };

  const handleSelectAsaasPlan = (planId: PlanId) => {
    setSelectedAsaasPlanId(planId);
    setIncludeAsaas(true);
    updateServicesAndTotals(true, planId, includeRegua, selectedReguaPlanId, includeBpo, customServices);
  };

  const handleSelectReguaPlan = (planId: PlanId) => {
    setSelectedReguaPlanId(planId);
    setIncludeRegua(true);
    updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, true, planId, includeBpo, customServices, reguaPortfolio);
  };

  const handleSelectReguaPortfolio = (portfolio: ReguaPortfolioType) => {
    setReguaPortfolio(portfolio);
    if (onUpdateReguaPortfolio) {
      onUpdateReguaPortfolio(portfolio);
    }
    updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, includeBpo, customServices, portfolio);
  };

  const handleAddCustomService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newService: ContractServiceItem = {
      id: `custom-${Date.now()}`,
      name: newServiceName.trim(),
      category: 'custom',
      setupPrice: Number(newServiceSetup) || 0,
      monthlyPrice: Number(newServiceMonthly) || 0,
      description: newServiceDesc.trim() || 'Serviço personalizado sob medida.',
      features: [newServiceName.trim()],
    };

    const updated = [...customServices, newService];
    setCustomServices(updated);
    setNewServiceName('');
    setNewServiceSetup(500);
    setNewServiceMonthly(200);
    setNewServiceDesc('');
    setShowAddCustomModal(false);

    updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, includeBpo, updated);
  };

  const handleRemoveCustomService = (id: string) => {
    const updated = customServices.filter((s) => s.id !== id);
    setCustomServices(updated);
    updateServicesAndTotals(includeAsaas, selectedAsaasPlanId, includeRegua, selectedReguaPlanId, includeBpo, updated);
  };

  // Scope customization
  const handleAddCustomFeature = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFeatureInput.trim()) return;
    const updated = [...activeScopeList, newFeatureInput.trim()];
    if (onUpdateCustomFeatures) {
      onUpdateCustomFeatures(updated);
    }
    setNewFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    const updated = activeScopeList.filter((_, i) => i !== idx);
    if (onUpdateCustomFeatures) {
      onUpdateCustomFeatures(updated);
    }
  };

  // Setup Payment Mode, Cash Price, Installment Total & Parcel Count handlers
  const computeInstallmentTotalForPreset = (
    preset: 'same' | 'table' | 'plus5' | 'plus10' | 'custom',
    cashPrice: number,
    basePrice: number,
    fallbackCustom: number
  ) => {
    if (preset === 'same') return cashPrice;
    if (preset === 'table') return basePrice;
    if (preset === 'plus5') return Number((cashPrice * 1.05).toFixed(2));
    if (preset === 'plus10') return Number((cashPrice * 1.10).toFixed(2));
    return fallbackCustom;
  };

  const handleChangeSetupPaymentMode = (mode: SetupPaymentMode) => {
    const setupDet = getSetupBillingDetails(fin);
    const nextTotal = mode === 'installments' ? setupDet.installmentTotal : setupDet.cashPrice;
    onUpdateFinancials({
      ...fin,
      setupPaymentMode: mode,
      setupCashPrice: setupDet.cashPrice,
      setupInstallmentTotal: setupDet.installmentTotal,
      setupInstallmentsCount: setupDet.installmentsCount,
      setupTotal: nextTotal,
    });
  };

  const handleToggleSetupDiscount = (applied: boolean) => {
    const discVal = applied ? (fin.setupDiscountValue || 250) : 0;
    const cashPrice = Math.max(0, fin.setupPrice - discVal);
    const instTotal = computeInstallmentTotalForPreset(
      installmentMarkupMode,
      cashPrice,
      fin.setupPrice,
      fin.setupInstallmentTotal ?? cashPrice
    );
    const mode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
    onUpdateFinancials({
      ...fin,
      setupDiscountApplied: applied,
      setupDiscountValue: discVal,
      setupCashPrice: cashPrice,
      setupInstallmentTotal: instTotal,
      setupTotal: mode === 'installments' ? instTotal : cashPrice,
    });
  };

  const handleChangeSetupDiscountValue = (val: number) => {
    const safeDisc = Math.max(0, val || 0);
    const cashPrice = Math.max(0, fin.setupPrice - safeDisc);
    const instTotal = computeInstallmentTotalForPreset(
      installmentMarkupMode,
      cashPrice,
      fin.setupPrice,
      fin.setupInstallmentTotal ?? cashPrice
    );
    const mode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
    onUpdateFinancials({
      ...fin,
      setupDiscountApplied: safeDisc > 0,
      setupDiscountValue: safeDisc,
      setupCashPrice: cashPrice,
      setupInstallmentTotal: instTotal,
      setupTotal: mode === 'installments' ? instTotal : cashPrice,
    });
  };

  const handleChangeSetupCashPriceDirect = (val: number) => {
    const cashPrice = Math.max(0, val || 0);
    const discVal = Math.max(0, fin.setupPrice - cashPrice);
    const instTotal = computeInstallmentTotalForPreset(
      installmentMarkupMode,
      cashPrice,
      fin.setupPrice,
      fin.setupInstallmentTotal ?? cashPrice
    );
    const mode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
    onUpdateFinancials({
      ...fin,
      setupDiscountApplied: discVal > 0,
      setupDiscountValue: discVal,
      setupCashPrice: cashPrice,
      setupInstallmentTotal: instTotal,
      setupTotal: mode === 'installments' ? instTotal : cashPrice,
    });
  };

  const handleSelectInstallmentPreset = (preset: 'same' | 'table' | 'plus5' | 'plus10') => {
    setInstallmentMarkupMode(preset);
    const setupDet = getSetupBillingDetails(fin);
    const instTotal = computeInstallmentTotalForPreset(preset, setupDet.cashPrice, fin.setupPrice, setupDet.installmentTotal);
    const mode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
    onUpdateFinancials({
      ...fin,
      setupCashPrice: setupDet.cashPrice,
      setupInstallmentTotal: instTotal,
      setupTotal: mode === 'installments' ? instTotal : setupDet.cashPrice,
    });
  };

  const handleChangeSetupInstallmentTotalDirect = (val: number) => {
    setInstallmentMarkupMode('custom');
    const instTotal = Math.max(0, val || 0);
    const setupDet = getSetupBillingDetails(fin);
    const mode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
    onUpdateFinancials({
      ...fin,
      setupCashPrice: setupDet.cashPrice,
      setupInstallmentTotal: instTotal,
      setupTotal: mode === 'installments' ? instTotal : setupDet.cashPrice,
    });
  };

  const handleChangeSetupInstallmentsCount = (count: number) => {
    const safeCount = Math.max(1, Math.min(24, Math.round(count || 1)));
    const setupDet = getSetupBillingDetails(fin);
    onUpdateFinancials({
      ...fin,
      setupCashPrice: setupDet.cashPrice,
      setupInstallmentTotal: setupDet.installmentTotal,
      setupInstallmentsCount: safeCount,
    });
  };

  // Monthly Discount, Due Day & Prompt Payment Discount (%) up to Day 05
  const handleToggleMonthlyDiscount = (applied: boolean) => {
    const discVal = applied ? (fin.monthlyDiscountValue || 50) : 0;
    const monthlyTotal = Math.max(0, fin.monthlyPrice - discVal);
    const hasPrompt = fin.hasPromptPaymentDiscount !== false;
    const pct = getEffectivePromptDiscountPercent({ ...fin, hasPromptPaymentDiscount: hasPrompt });
    onUpdateFinancials({
      ...fin,
      monthlyDiscountApplied: applied,
      monthlyDiscountValue: discVal,
      monthlyTotal,
      monthlyWithPromptDiscount: calculateMonthlyWithPromptDiscount(monthlyTotal, hasPrompt, pct),
    });
  };

  const handleChangeMonthlyDiscountValue = (val: number) => {
    const monthlyTotal = Math.max(0, fin.monthlyPrice - val);
    const hasPrompt = fin.hasPromptPaymentDiscount !== false;
    const pct = getEffectivePromptDiscountPercent({ ...fin, hasPromptPaymentDiscount: hasPrompt });
    onUpdateFinancials({
      ...fin,
      monthlyDiscountValue: val,
      monthlyTotal,
      monthlyWithPromptDiscount: calculateMonthlyWithPromptDiscount(monthlyTotal, hasPrompt, pct),
    });
  };

  const handleTogglePromptDiscount = (enabled: boolean) => {
    const pct = enabled ? (fin.promptPaymentDiscountPercent && fin.promptPaymentDiscountPercent > 0 ? fin.promptPaymentDiscountPercent : 5) : 0;
    onUpdateFinancials({
      ...fin,
      hasPromptPaymentDiscount: enabled,
      promptPaymentDiscountPercent: enabled ? pct : (fin.promptPaymentDiscountPercent || 5),
      monthlyWithPromptDiscount: calculateMonthlyWithPromptDiscount(fin.monthlyTotal, enabled, pct),
    });
  };

  const handleChangePromptDiscountPercent = (pctValue: number) => {
    const safePct = Math.max(0, Math.min(100, Number(pctValue) || 0));
    const enabled = safePct > 0;
    onUpdateFinancials({
      ...fin,
      hasPromptPaymentDiscount: enabled,
      promptPaymentDiscountPercent: safePct,
      monthlyWithPromptDiscount: calculateMonthlyWithPromptDiscount(fin.monthlyTotal, enabled, safePct),
    });
  };

  const openExternalHref = (href: string) => {
    const a = document.createElement('a');
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Link and Sharing (UTF-8 safe Base64URL with full proposal state)
  const clientShareUrl = buildClientShareUrl(activeProposal);

  const handleCopyClientLink = () => {
    navigator.clipboard.writeText(clientShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendWhatsAppToClient = () => {
    const serviceNames = (activeProposal.selectedServices || [])
      .map((s) => s.name)
      .join(' + ') || currentAsaasPlan.name;

    const setupDet = getSetupBillingDetails(fin);
    const promptPct = getEffectivePromptDiscountPercent(fin);
    const hasPrompt = fin.hasPromptPaymentDiscount !== false && promptPct > 0;
    const promptLine = hasPrompt
      ? ` (ou ${formatBRL(fin.monthlyWithPromptDiscount)} com ${formatCleanPercent(promptPct)}% de desconto até o dia 05)`
      : '';
    const setupLine =
      setupDet.mode === 'installments'
        ? `${setupDet.installmentsCount}x de ${formatBRL(setupDet.installmentValue)} (Total parcelado: ${formatBRL(setupDet.installmentTotal)} | À vista: ${formatBRL(setupDet.cashPrice)})`
        : `${formatBRL(setupDet.cashPrice)} à vista (ou em ${setupDet.installmentsCount}x de ${formatBRL(setupDet.installmentValue)})`;

    const text = encodeURIComponent(
      `Olá! Aqui é o ${MULTILAGOS_INFO.representativeName} da Multilagos (Negócios & Tecnologia).\n\n` +
      `Conforme alinhamos em nossa reunião, elaborei sua proposta comercial personalizada (Nº ${activeProposal.id}):\n` +
      `• Serviços Contratados: ${serviceNames}\n` +
      `• Vigência: Tempo Indeterminado (sem vencimento preestabelecido)\n` +
      `• Mensalidade: ${formatBRL(fin.monthlyTotal)}${promptLine}\n` +
      `• Taxa de Setup / Implantação: ${setupLine}\n\n` +
      `Acesse o link seguro exclusivo para conferir o contrato mestre, preencher os dados da sua empresa e confirmar o aceite digital:\n` +
      `${clientShareUrl}`
    );
    openExternalHref(`https://api.whatsapp.com/send?text=${text}`);
  };

  const handleSendEmailToClient = () => {
    const serviceNames = (activeProposal.selectedServices || [])
      .map((s) => s.name)
      .join(' + ') || currentAsaasPlan.name;

    const setupDet = getSetupBillingDetails(fin);
    const promptPct = getEffectivePromptDiscountPercent(fin);
    const hasPrompt = fin.hasPromptPaymentDiscount !== false && promptPct > 0;

    const subject = encodeURIComponent(`Proposta Comercial Multilagos - ${serviceNames} [Nº ${activeProposal.id}]`);
    const body = encodeURIComponent(
      `Prezado(a),\n\n` +
      `Conforme nossa reunião, segue o link seguro da sua proposta comercial e Contrato Mestre vinculado (Nº ${activeProposal.contractMasterId}):\n\n` +
      `- Serviços: ${serviceNames}\n` +
      `- Vigência: Tempo Indeterminado (sem vencimento preestabelecido; aviso prévio de 30 dias)\n` +
      `- Mensalidade Total: ${formatBRL(fin.monthlyTotal)} (Vencimento dia ${fin.dueDay || 10})${hasPrompt ? ` | Pagando até dia 05 (${formatCleanPercent(promptPct)}% desc.): ${formatBRL(fin.monthlyWithPromptDiscount)}` : ''}\n` +
      `- Implantação / Setup: ${setupDet.fullBillingNote}\n\n` +
      `Para formalizar a contratação e fazer o download dos documentos em PDF, acesse o link:\n` +
      `${clientShareUrl}\n\n` +
      `Atenciosamente,\n` +
      `${MULTILAGOS_INFO.representativeName}\n` +
      `${MULTILAGOS_INFO.companyName}\n` +
      `${MULTILAGOS_INFO.phone}`
    );
    openExternalHref(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleDownloadConsultantPdf = async () => {
    setDownloadingPdf(true);
    const elementId = previewDocType === 'proposal'
      ? (selectedServiceTrack === 'esteira-asaas' ? 'asaas-proposal-doc' : 'multicobranca-proposal-doc')
      : 'master-contract-doc';
    const filename = previewDocType === 'proposal'
      ? `Proposta_Comercial_${activeProposal.id}`
      : `Contrato_Mestre_${activeProposal.contractMasterId}`;
    await exportElementToPdf(elementId, filename);
    setDownloadingPdf(false);
  };

  const isCombo = includeAsaas && includeRegua;

  return (
    <section id="simulador" className="py-12 bg-[#111F24] text-[#CDDADE] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
              <span>Etapa 2 · Preparação da Proposta Comercial</span>
              <span aria-hidden="true">·</span>
              <span>Painel do Consultor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-display">
              Simulador Comercial & Pacote de Serviços
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Contratos celebrados por <strong>tempo indeterminado</strong> (sem prazo de vigência preestabelecido). Adicione múltiplos serviços conforme a necessidade do cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              Proposta: <strong className="text-white">{activeProposal.id}</strong>
            </span>
            {onCreateNewProposal && (
              <button
                type="button"
                onClick={onCreateNewProposal}
                className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Gerar novo número de proposta zerado para outro cliente"
              >
                <RefreshCw className="w-3.5 h-3.5 text-[#D40B3A]" />
                <span>Nova Proposta</span>
              </button>
            )}
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1.5 rounded-lg">
              Vigência: Tempo Indeterminado
            </span>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-[#D40B3A]" />
              <span>Selecione um Pacote ou Combine Múltiplos Serviços:</span>
            </span>
            {isCombo && (
              <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Combo Multisserviço Ativo</span>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleSelectPresetCombo}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                isCombo
                  ? 'bg-[#1D323C] border-[#D40B3A] ring-1 ring-[#D40B3A] text-white shadow-lg'
                  : 'bg-[#111F24] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-extrabold text-[#D40B3A] block">⭐ PACOTE MAIS CONTRATADO</span>
                <strong className="text-sm font-bold text-white block mt-0.5">Implantação Asaas + Régua de Cobrança</strong>
                <span className="text-[11px] text-slate-400">Conta Digital + Notificações WhatsApp Automatizadas</span>
              </div>
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${isCombo ? 'text-[#D40B3A]' : 'text-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={handleSelectPresetOnlyAsaas}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                includeAsaas && !includeRegua
                  ? 'bg-[#1D323C] border-[#D40B3A] ring-1 ring-[#D40B3A] text-white shadow-lg'
                  : 'bg-[#111F24] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-400 block">ESTEIRA 1 INDIVIDUAL</span>
                <strong className="text-sm font-bold text-white block mt-0.5">Apenas Implantação Asaas</strong>
                <span className="text-[11px] text-slate-400">Conta homologada, NFS-e e Automações</span>
              </div>
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${includeAsaas && !includeRegua ? 'text-[#D40B3A]' : 'text-slate-600'}`} />
            </button>

            <button
              type="button"
              onClick={handleSelectPresetOnlyRegua}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                !includeAsaas && includeRegua
                  ? 'bg-[#1D323C] border-[#D40B3A] ring-1 ring-[#D40B3A] text-white shadow-lg'
                  : 'bg-[#111F24] border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div>
                <span className="text-xs font-bold text-slate-400 block">ESTEIRA 2 INDIVIDUAL</span>
                <strong className="text-sm font-bold text-white block mt-0.5">Apenas Régua de Cobrança</strong>
                <span className="text-[11px] text-slate-400">WhatsApp n8n sem trocar de banco</span>
              </div>
              <CheckCircle2 className={`w-5 h-5 shrink-0 ${!includeAsaas && includeRegua ? 'text-[#D40B3A]' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>

        {/* Services Cards with Checkboxes & Plan Selectors */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Personalize os Serviços Desta Proposta Comercial:
            </span>
            <button
              type="button"
              onClick={() => setShowAddCustomModal(true)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#D40B3A] hover:text-white bg-[#D40B3A]/10 hover:bg-[#D40B3A] border border-[#D40B3A]/30 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Adicionar Outro Serviço Personalizado</span>
            </button>
          </div>

          {/* SERVIÇO 1: Implantação Asaas (Full Width com os 4 Planos Visuais e Checklists) */}
          <div className={`p-6 rounded-2xl border transition-all relative ${
            includeAsaas 
              ? 'bg-[#16242A] border-[#D40B3A] ring-1 ring-[#D40B3A]/80 shadow-xl' 
              : 'bg-[#16242A]/60 border-slate-800 opacity-70'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAsaas}
                  onChange={(e) => handleToggleAsaas(e.target.checked)}
                  className="w-5 h-5 rounded text-[#D40B3A] accent-[#D40B3A] cursor-pointer"
                />
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#D40B3A] block">
                    Serviço 1 · Gestão de Contas Digitais
                  </span>
                  <h3 className="text-xl font-bold text-white font-display">
                    Implantação Asaas (Conta Digital, NFS-e & Automações)
                  </h3>
                </div>
              </label>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {includeAsaas && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                    ✓ Ativo na Proposta
                  </span>
                )}
                {clientCount > 0 && matchedTier && (
                  <span className="text-xs font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-700">
                    👥 Base: <strong className="text-white">{clientCount}</strong> ({matchedTier.label})
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              Conta digital homologada, automação de cobranças, emissão de boletos, Pix dinâmico, conciliação e regras de negócio.
            </p>

            {includeAsaas && (
              <div className="mt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Selecione o Plano Asaas Ideal para o Cliente:
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Preços ajustam automaticamente de acordo com o plano e quantidade de clientes
                  </span>
                </div>

                {/* Grid Visual dos 4 Planos com Checklists Completos */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  {asaasPlans.map((p) => {
                    const isSel = p.id === selectedAsaasPlanId;
                    const pTiered = clientCount > 0 ? getTieredPlanPrice(p.id, clientCount, effectiveTiers) : null;
                    const displayMonthly = pTiered?.monthlyPrice ?? p.baseMonthlyPrice;
                    const displaySetup = pTiered?.setupPrice ?? p.baseSetupPrice;

                    return (
                      <div
                        key={p.id}
                        className={`rounded-2xl p-5 border flex flex-col justify-between transition-all relative ${
                          isSel
                            ? 'bg-[#192A32] border-[#D40B3A] ring-2 ring-[#D40B3A] shadow-xl shadow-red-950/40'
                            : 'bg-[#111F24] border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {p.badge && (
                          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-extrabold uppercase bg-[#D40B3A] text-white px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
                            {p.badge}
                          </span>
                        )}

                        <div className="space-y-3">
                          <div className="pb-2.5 border-b border-slate-800">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              PLANO
                            </span>
                            <h4 className="text-xl font-black text-white font-display mt-0.5">
                              {p.name.toUpperCase()}
                            </h4>
                            <p className="text-xs text-slate-300 mt-1.5 min-h-[42px] leading-snug">
                              {p.headline}
                            </p>
                          </div>

                          <div className="pt-1">
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl sm:text-3xl font-extrabold text-[#D40B3A] font-mono">
                                {formatBRL(displayMonthly)}
                              </span>
                              <span className="text-xs text-slate-400">/mês</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-1">
                              Setup: <strong className="text-slate-200 font-mono">{formatBRL(displaySetup)}</strong>
                            </div>
                            {clientCount > 0 && matchedTier && (
                              <div className="mt-1.5 text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 inline-flex items-center gap-1 font-mono">
                                <span>Faixa: {matchedTier.label}</span>
                              </div>
                            )}
                          </div>

                          {/* Botão Selecionar / Selecionado */}
                          <button
                            type="button"
                            onClick={() => handleSelectAsaasPlan(p.id)}
                            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                              isSel
                                ? 'bg-[#D40B3A] text-white shadow-lg shadow-red-950/50'
                                : 'bg-[#16242A] hover:bg-[#D40B3A]/20 text-slate-300 hover:text-white border border-slate-700 hover:border-[#D40B3A]'
                            }`}
                          >
                            {isSel ? (
                              <>
                                <Check className="w-4 h-4 text-white" />
                                <span>Plano Selecionado</span>
                              </>
                            ) : (
                              <span>Selecionar Plano</span>
                            )}
                          </button>

                          {/* Checklist Oficial de Entregáveis */}
                          <div className="pt-3 border-t border-slate-800/80 space-y-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                              Checklist Incluso ({p.features.length} itens):
                            </span>
                            <div className="space-y-1.5">
                              {p.features.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-start gap-1.5 text-xs leading-tight">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span className="text-slate-200 text-[11px] leading-snug">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 pt-2.5 border-t border-slate-800/70 text-[10px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#D40B3A] shrink-0" />
                          <span>{p.sla}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Serviços Adicionais (Régua WhatsApp, BPO e Personalizados) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* SERVIÇO 2: Régua de Cobrança WhatsApp */}
            <div className={`p-5 rounded-2xl border transition-all relative ${
              includeRegua 
                ? 'bg-[#192A32] border-[#D40B3A] ring-1 ring-[#D40B3A]/80 shadow-xl' 
                : 'bg-[#16242A]/60 border-slate-800 opacity-70'
            }`}>
              <div className="flex items-start justify-between pb-3 border-b border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRegua}
                    onChange={(e) => handleToggleRegua(e.target.checked)}
                    className="w-5 h-5 rounded text-[#D40B3A] accent-[#D40B3A] cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#D40B3A] block">
                      Serviço 2 · Automação de Notificações
                    </span>
                    <h3 className="text-lg font-bold text-white font-display">
                      Régua de Cobrança Automatizada WhatsApp
                    </h3>
                  </div>
                </label>

                {includeRegua && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                    Ativo na Proposta
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                Disparos inteligentes antes, no dia e após o vencimento no WhatsApp oficial com botões interativos e cópia de Pix.
              </p>

              {includeRegua && (
                <div className="mt-4 space-y-3.5 pt-3 border-t border-slate-700/80">
                  {/* Seletor de Portfólio da Régua WhatsApp (Meu Portfólio vs Portfólio do Cliente) */}
                  <div className="p-3 rounded-xl bg-[#111F24] border border-slate-700/90 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        Modalidade de Portfólio API WhatsApp (Precificação):
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {reguaPortfolio === 'client' ? 'Tarifas Meta Diretas' : 'Custos Meta Inclusos'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectReguaPortfolio('multilagos')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          reguaPortfolio === 'multilagos'
                            ? 'bg-[#192A32] border-[#D40B3A] ring-1 ring-[#D40B3A] text-white shadow'
                            : 'bg-[#16242A] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Meu Portfólio (Multilagos)</span>
                          {reguaPortfolio === 'multilagos' && <Check className="w-3.5 h-3.5 text-[#D40B3A]" />}
                        </div>
                        <span className="text-[10px] text-emerald-400 block mt-0.5 font-semibold">
                          ✓ Custos da Meta inclusos na mensalidade
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectReguaPortfolio('client')}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          reguaPortfolio === 'client'
                            ? 'bg-[#192A32] border-[#D40B3A] ring-1 ring-[#D40B3A] text-white shadow'
                            : 'bg-[#16242A] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">Portfólio do Cliente (BM Próprio)</span>
                          {reguaPortfolio === 'client' && <Check className="w-3.5 h-3.5 text-[#D40B3A]" />}
                        </div>
                        <span className="text-[10px] text-amber-300 block mt-0.5 font-semibold">
                          Mensalidade reduzida · Meta paga pelo cliente
                        </span>
                      </button>
                    </div>
                  </div>

                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Selecione a franquia mensal de disparos ({reguaPortfolio === 'client' ? 'Tabela Portfólio do Cliente' : 'Tabela Meu Portfólio Multilagos'}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {reguaPlans.map((p) => {
                      const isSel = p.id === selectedReguaPlanId;
                      const pPrices = getReguaPlanPrices(p, reguaPortfolio);
                      const pFeats = getReguaFeaturesForPortfolio(p, reguaPortfolio);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectReguaPlan(p.id)}
                          className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                            isSel
                              ? 'bg-[#111F24] border-[#D40B3A] text-white ring-1 ring-[#D40B3A]'
                              : 'bg-[#142228] border-slate-800 text-slate-300 hover:border-slate-700'
                          }`}
                        >
                          <span className="text-xs font-bold block">{p.name} msgs</span>
                          <span className="text-xs font-mono font-extrabold text-[#D40B3A] block mt-0.5">
                            {formatBRL(pPrices.monthlyPrice)}/m
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            Setup: {formatBRL(pPrices.setupPrice)}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-semibold block mt-1">
                            ✓ {pFeats.length} itens
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Checklist Oficial da Régua WhatsApp Ativa */}
                  {(() => {
                    const activeReguaFeatures = getReguaFeaturesForPortfolio(currentReguaPlan, reguaPortfolio);
                    return (
                      <div className="p-3.5 rounded-xl bg-[#111F24] border border-slate-700/90 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-800 gap-1.5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-xs font-bold text-white font-display">
                              Checklist · Franquia {currentReguaPlan.name} ({reguaPortfolio === 'client' ? 'Portfólio Cliente' : 'Portfólio Multilagos'}):
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                            {currentReguaPlan.sla}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-400 italic">
                          "{currentReguaPlan.headline}"
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                          {activeReguaFeatures.map((feat, fIdx) => (
                            <div key={fIdx} className="flex items-start gap-1.5 bg-[#16242A]/80 p-1.5 rounded-lg border border-slate-800/80">
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span className="text-slate-200 text-[11px] leading-tight">{feat}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* SERVIÇO 3: Consultoria e BPO Financeiro */}
            <div className={`p-5 rounded-2xl border transition-all relative ${
              includeBpo 
                ? 'bg-[#192A32] border-[#D40B3A] ring-1 ring-[#D40B3A]/80 shadow-xl' 
                : 'bg-[#16242A]/60 border-slate-800 opacity-70'
            }`}>
              <div className="flex items-start justify-between pb-3 border-b border-slate-700">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBpo}
                    onChange={(e) => handleToggleBpo(e.target.checked)}
                    className="w-5 h-5 rounded text-[#D40B3A] accent-[#D40B3A] cursor-pointer"
                  />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Serviço Opcional · Consultoria Especializada
                    </span>
                    <h3 className="text-lg font-bold text-white font-display">
                      BPO Financeiro & Parametrização ERP
                    </h3>
                  </div>
                </label>

                {includeBpo && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800">
                    Ativo na Proposta
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                Acompanhamento executivo, conciliação de faturas, parametrização de categorias e auditoria de fluxo de recebíveis.
              </p>

              <div className="mt-3 flex items-center justify-between text-xs bg-[#111F24] p-3 rounded-xl border border-slate-800">
                <span className="text-slate-400">Setup único: <strong className="text-white font-mono">{formatBRL(1500)}</strong></span>
                <span className="text-slate-400">Mensalidade: <strong className="text-[#D40B3A] font-mono">{formatBRL(450)}/mês</strong></span>
              </div>

              {includeBpo && (
                <div className="mt-3 pt-3 border-t border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs font-bold text-white">Checklist de Entregáveis BPO & ERP (3 itens):</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {[
                      'Parametrização contábil e conciliação bancária',
                      'Auditoria de recebíveis e relatórios de inadimplência',
                      'Suporte avançado e integração com ERP',
                    ].map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-1.5 bg-[#16242A]/80 p-1.5 rounded-lg border border-slate-800/80">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-200 text-[11px] leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Custom Services Added List */}
            {customServices.map((cs) => (
              <div key={cs.id} className="p-5 rounded-2xl border bg-[#192A32] border-emerald-600/80 shadow-xl relative">
                <div className="flex items-start justify-between pb-3 border-b border-slate-700">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 block">
                      Serviço Personalizado Adicional
                    </span>
                    <h3 className="text-lg font-bold text-white font-display">
                      {cs.name}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCustomService(cs.id)}
                    className="text-xs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg bg-rose-950/50 border border-rose-800/60 cursor-pointer"
                    title="Remover este serviço"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {cs.description || 'Escopo acordado sob medida para a operação.'}
                </p>

                <div className="mt-3 flex items-center justify-between text-xs bg-[#111F24] p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400">Setup único: <strong className="text-white font-mono">{formatBRL(cs.setupPrice)}</strong></span>
                  <span className="text-slate-400">Mensalidade: <strong className="text-emerald-400 font-mono">{formatBRL(cs.monthlyPrice)}/mês</strong></span>
                </div>
              </div>
            ))}

          </div>

          {/* Checklist Unificado de Entregáveis e Personalização de Escopo */}
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700 gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-950/60 border border-emerald-800/80 rounded-xl text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Checklist Geral de Entregáveis da Proposta ({activeScopeList.length} itens inclusos)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Estes itens integram a cláusula de escopo da Proposta Comercial e do Contrato Mestre oficial.
                  </p>
                </div>
              </div>

              {activeProposal.customFeatures && (
                <button
                  type="button"
                  onClick={() => onUpdateCustomFeatures && onUpdateCustomFeatures(currentAsaasPlan.features)}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer self-start sm:self-auto"
                >
                  Restaurar Checklist Padrão ({currentAsaasPlan.name})
                </button>
              )}
            </div>

            {/* Lista dos Itens do Checklist */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {activeScopeList.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-2 p-2.5 rounded-xl bg-[#111F24] border border-slate-800 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-slate-200 font-medium leading-snug">{feat}</span>
                  </div>
                  {activeScopeList.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      title="Remover este item do checklist"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Formulário para Adicionar Item Personalizado ao Checklist */}
            <form onSubmit={handleAddCustomFeature} className="pt-3 border-t border-slate-700/80 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Adicionar novo entregável específico ao checklist (ex: Treinamento presencial de 4h)..."
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#D40B3A] hover:bg-[#B50931] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Incluir no Checklist</span>
              </button>
            </form>
          </div>

          {/* Cronograma & Tempo Estimado da Implantação */}
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-950/60 border border-rose-800/80 rounded-xl text-[#D40B3A]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                    <span>Tempo Estimado da Implantação & Cronograma</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Prazos operacionais e etapas de execução técnica vinculados à proposta comercial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-rose-400 bg-rose-950/80 px-3 py-1.5 rounded-lg border border-rose-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {!includeAsaas && includeRegua 
                      ? 'Tempo Total: Até 5 dias úteis' 
                      : 'Tempo Total: 20 dias'}
                  </span>
                </span>
              </div>
            </div>

            {!includeAsaas && includeRegua ? (
              // Somente Régua de Cobrança
              <div className="space-y-3">
                <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200">
                  ⚡ <strong>Modalidade: Somente Régua de Cobrança</strong> — Tempo total estimado de <strong>até 5 dias úteis</strong>.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-[#111F24] border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider block">Etapa 1 · Conexão</span>
                    <h5 className="text-sm font-bold text-white">API WhatsApp & Homologação</h5>
                    <p className="text-xs text-slate-400">Vinculação à Cloud API Meta e validação de remetente.</p>
                    <span className="inline-block text-xs font-mono font-bold text-emerald-400 pt-1">1 a 2 dias úteis</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#111F24] border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider block">Etapa 2 · Parametrização</span>
                    <h5 className="text-sm font-bold text-white">Régua de Cobrança & Mensagens</h5>
                    <p className="text-xs text-slate-400">Configuração de gatilhos, modelos pré, no dia e pós-vencimento.</p>
                    <span className="inline-block text-xs font-mono font-bold text-emerald-400 pt-1">Até 3 dias úteis</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#111F24] border border-slate-800 space-y-1.5">
                    <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider block">Etapa 3 · Ativação</span>
                    <h5 className="text-sm font-bold text-white">Validação, Testes e Go-Live</h5>
                    <p className="text-xs text-slate-400">Homologação final com a equipe e início dos envios automáticos.</p>
                    <span className="inline-block text-xs font-mono font-bold text-emerald-400 pt-1">1 dia útil</span>
                  </div>
                </div>
              </div>
            ) : (
              // Implantação Completa / Asaas
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Fase 1 */}
                  <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider">Fase 1</span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                          1 a 3 dias úteis
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mt-1.5">Kickoff & Diagnóstico Operacional</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Alinhamento de escopo, mapeamento de processos e coleta de acessos da equipe.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                      Dependência: Acessos e contatos
                    </div>
                  </div>

                  {/* Fase 2 */}
                  <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider">Fase 2</span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                          5 a 15 dias úteis
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mt-1.5">Base de Dados & Validação</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Limpeza, preparação, validação e importação da base de dados e cadastros.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                      Dependência: Envio de base de clientes
                    </div>
                  </div>

                  {/* Fase 3 */}
                  <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider">Fase 3</span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                          Até 5 dias úteis
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mt-1.5">Configurações</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Parametrização da conta Asaas, taxas comerciais, emissão de NFS-e, split e réguas.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                      Dependência: Definição de taxas e contas
                    </div>
                  </div>

                  {/* Fase 4 */}
                  <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider">Fase 4</span>
                        <span className="text-[11px] font-mono font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/80">
                          3 dias
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-white mt-1.5">Validação, Go-Live & Treinamento</h5>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                        Homologação final assistida, treinamento da equipe e virada oficial para operação.
                      </p>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                      Dependência: Equipe disponível
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-[#111F24] border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">Tempo total estimado:</span>
                    <span className="text-emerald-400 font-bold font-mono">20 dias</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    * Para contratação exclusiva de régua de cobrança: <strong>até 5 dias úteis</strong>.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal to Add Custom Service */}
        {showAddCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="bg-[#16242A] border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="text-lg font-bold text-white font-display flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#D40B3A]" />
                  <span>Adicionar Serviço Personalizado</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddCustomService} className="space-y-3.5 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Nome do Serviço:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Integração Personalizada com ERP Omie"
                    value={newServiceName}
                    onChange={(e) => setNewServiceName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Setup / Implantação (R$):</label>
                    <input
                      type="number"
                      min="0"
                      value={newServiceSetup}
                      onChange={(e) => setNewServiceSetup(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Mensalidade Recorrente (R$):</label>
                    <input
                      type="number"
                      min="0"
                      value={newServiceMonthly}
                      onChange={(e) => setNewServiceMonthly(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Descrição do Escopo:</label>
                  <textarea
                    rows={2}
                    placeholder="Descreva resumidamente o que está incluso neste serviço..."
                    value={newServiceDesc}
                    onChange={(e) => setNewServiceDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white"
                  />
                </div>

                <div className="pt-3 border-t border-slate-700 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCustomModal(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#D40B3A] hover:bg-[#B50931] text-white font-bold cursor-pointer"
                  >
                    Salvar e Incluir na Proposta
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Comparativo Completo dos 4 Planos Asaas com Checklists */}
        {showAsaasCompareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-[#16242A] border border-slate-700 rounded-2xl p-6 sm:p-8 max-w-5xl w-full space-y-6 shadow-2xl my-8">
              <div className="flex items-center justify-between pb-4 border-b border-slate-700">
                <div>
                  <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                    Comparativo Oficial de Entregáveis
                  </span>
                  <h3 className="text-xl font-bold text-white font-display mt-0.5">
                    Checklists Comparativos dos 4 Planos Asaas
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Veja exatamente o que cada plano inclui e selecione o mais adequado para o cliente em 1 clique.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAsaasCompareModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {asaasPlans.map((plan) => {
                  const isCurrent = plan.id === selectedAsaasPlanId;
                  return (
                    <div
                      key={plan.id}
                      className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative ${
                        isCurrent
                          ? 'bg-[#192A32] border-[#D40B3A] ring-2 ring-[#D40B3A] shadow-xl'
                          : 'bg-[#111F24] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {plan.badge && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-[#D40B3A] text-white px-2.5 py-0.5 rounded-full shadow">
                          {plan.badge}
                        </span>
                      )}

                      <div className="space-y-3">
                        <div className="pb-3 border-b border-slate-800">
                          <h4 className="text-lg font-bold text-white font-display">{plan.name}</h4>
                          <div className="mt-1">
                            <span className="text-2xl font-extrabold text-[#D40B3A] font-mono">
                              {formatBRL(plan.baseMonthlyPrice)}
                            </span>
                            <span className="text-xs text-slate-400">/mês</span>
                          </div>
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Setup: {formatBRL(plan.baseSetupPrice)}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-300 leading-tight">
                          {plan.headline}
                        </p>

                        <div className="pt-2 border-t border-slate-800/80">
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                            Checklist ({plan.features.length} itens):
                          </span>
                          <ul className="space-y-1.5 text-xs text-slate-300">
                            {plan.features.map((feat, fIdx) => (
                              <li key={fIdx} className="flex items-start gap-1.5 text-[11px] leading-snug">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectAsaasPlan(plan.id);
                            setShowAsaasCompareModal(false);
                          }}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                              : 'bg-slate-800 hover:bg-[#D40B3A] text-slate-200 hover:text-white'
                          }`}
                        >
                          {isCurrent ? 'Plano Selecionado ✓' : `Escolher Plano ${plan.name}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Metrics in Meeting */}
        {activeDiag && diagMetrics && (
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-4">
              <div>
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                  Simulação de Impacto Financeiro na Reunião
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                  Meta de Redução da Inadimplência & Projeção de Retorno
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste a meta percentual para demonstrar o retorno financeiro real no caixa do cliente.
                </p>
              </div>

              <div className="flex items-center gap-3 self-start sm:self-auto bg-[#111F24] px-4 py-2 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400">Meta Ativa:</span>
                <span className="text-xl font-extrabold text-emerald-400 font-mono">
                  -{activeDiag.reductionGoalPercent || 80}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-6 space-y-3.5 p-5 rounded-xl bg-[#111F24] border border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-slate-300 font-semibold">
                    Defina o Percentual de Redução Almejado:
                  </label>
                  <div className="flex items-center gap-1.5 font-mono text-emerald-400 font-bold">
                    <span>-</span>
                    <input
                      type="number"
                      min="30"
                      max="95"
                      value={activeDiag.reductionGoalPercent || 80}
                      onChange={(e) => {
                        const val = Math.min(95, Math.max(30, Number(e.target.value)));
                        if (onUpdateDiagnostic && activeDiag) {
                          onUpdateDiagnostic({
                            ...activeDiag,
                            reductionGoalPercent: val,
                          });
                        }
                      }}
                      className="w-14 px-2 py-0.5 bg-[#16242A] border border-slate-700 rounded text-center text-emerald-400 font-bold"
                    />
                    <span>%</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={activeDiag.reductionGoalPercent || 80}
                  onChange={(e) => {
                    if (onUpdateDiagnostic && activeDiag) {
                      onUpdateDiagnostic({
                        ...activeDiag,
                        reductionGoalPercent: Number(e.target.value),
                      });
                    }
                  }}
                  className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-800 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-30%</span>
                  <span>-50%</span>
                  <span className="text-emerald-400 font-bold">-80% (Padrão Multilagos)</span>
                  <span>-95%</span>
                </div>
              </div>

              <div className="md:col-span-6 grid grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Inadimplência Atual:</span>
                  <p className="text-lg font-extrabold text-[#D40B3A] font-mono mt-1">
                    {formatBRL(diagMetrics.delinquencyAmount)}
                  </p>
                  <span className="text-[10px] text-slate-500">travados no mês</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60">
                  <span className="text-emerald-300 block text-[11px]">Recuperação Mensal:</span>
                  <p className="text-lg font-extrabold text-emerald-400 font-mono mt-1">
                    +{formatBRL(diagMetrics.monthlyRecoveredCash)}
                  </p>
                  <span className="text-[10px] text-emerald-300/80">direto no caixa / mês</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-emerald-300 block text-[11px]">Impacto Anual no Fluxo de Caixa:</span>
                      <p className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5">
                        +{formatBRL(diagMetrics.annualRecoveredCash)}
                      </p>
                    </div>
                    <div className="text-right text-[11px]">
                      <span className="text-slate-400 block">Mensalidade Total:</span>
                      <span className="text-white font-mono font-bold">{formatBRL(fin.monthlyTotal)}/mês</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10.5px] text-emerald-200 bg-emerald-900/40 px-2.5 py-1 rounded border border-emerald-700/50">
                    ✓ O retorno financeiro da recuperação de recebíveis supera em múltiplas vezes o investimento da solução.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparativo de Custos de Recebimento (Tarifas Bancárias) */}
        {diagMetrics?.feeComparison && (
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
              <div>
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Comparativo de Custos de Recebimento (Tarifas Bancárias)</span>
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                  Custo Atual do Cliente vs Nossa Solução (Asaas)
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Comparação direta entre os custos de liquidação atuais informados e os valores com a parceria Multilagos.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800 flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4" />
                  <span>Economia de {diagMetrics.feeComparison.savingsPercent.toFixed(0)}% nas tarifas</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-[#111F24] border border-red-900/50">
                <span className="text-[11px] text-slate-400 block">Custo Médio Atual do Cliente:</span>
                <p className="text-xl font-extrabold text-red-400 font-mono mt-1">
                  {formatBRL(diagMetrics.feeComparison.currentMonthlyCost)}
                  <span className="text-xs text-slate-400 font-normal"> /mês</span>
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  Tarifas bancárias informadas na reunião
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#111F24] border border-emerald-900/60">
                <span className="text-[11px] text-slate-400 block">Custo com a Multilagos (Asaas):</span>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                  {formatBRL(diagMetrics.feeComparison.multilagosMonthlyCost)}
                  <span className="text-xs text-slate-400 font-normal"> /mês</span>
                </p>
                <span className="text-[10px] text-emerald-400/80 mt-0.5 block font-semibold">
                  Tarifas negociadas de parceiro homologado
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80">
                <span className="text-[11px] text-emerald-300 block">Economia Gerada em Tarifas:</span>
                <p className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                  {formatBRL(diagMetrics.feeComparison.monthlySavings)}
                  <span className="text-xs text-emerald-300/80 font-normal"> /mês</span>
                </p>
                <span className="text-[10px] text-emerald-300 font-bold mt-0.5 block">
                  +{formatBRL(diagMetrics.feeComparison.annualSavings)}/ano direto no bolso do cliente
                </span>
              </div>
            </div>

            {/* Detalhamento por Forma de Pagamento */}
            {diagMetrics.feeComparison.details && diagMetrics.feeComparison.details.filter((d: any) => d.active).length > 0 && (
              <div className="pt-3 border-t border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Detalhamento por Meio de Cobrança:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {diagMetrics.feeComparison.details.filter((d: any) => d.active).map((det: any, dIdx: number) => (
                    <div key={dIdx} className="p-2.5 rounded-lg bg-[#111F24] border border-slate-800 flex flex-col justify-between">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800/80 font-bold text-white">
                        <span>{det.method}</span>
                        <span className="text-slate-400 text-[10px] font-mono">{det.transactions} cobranças/mês</span>
                      </div>
                      <div className="mt-1.5 space-y-0.5 text-[11px]">
                        <div className="flex justify-between text-slate-400">
                          <span>Taxa atual cliente:</span>
                          <span className="text-red-300 font-mono font-semibold">{det.clientRateText}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Com a Multilagos:</span>
                          <span className="text-emerald-400 font-mono font-semibold">{det.multilagosRateText}</span>
                        </div>
                        <div className="flex justify-between font-bold pt-1 border-t border-slate-800/60 text-emerald-400">
                          <span>Economia estimada:</span>
                          <span className="font-mono">{formatBRL(Math.max(0, det.difference))}/mês</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pricing Adjuster & Discounts Section */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Resumo Financeiro & Descontos em Reunião
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                Condições Comerciais Consolidadas ({activeProposal.selectedServices?.length || 1} serviço(s) ativo(s))
              </h3>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
              Vigência: Tempo Indeterminado
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Setup Controls (À Vista + Parcelamento + Quantidade de Parcelas) */}
            {(() => {
              const setupDet = getSetupBillingDetails(fin);
              const parcelPresets = [2, 3, 4, 6, 10, 12];
              return (
                <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      1. Taxa de Implantação (Setup · À Vista & Parcelado)
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Tabela: {formatBRL(fin.setupPrice)}
                    </span>
                  </div>

                  {/* Modalidade Ativa do Setup */}
                  <div className="space-y-1.5 text-xs">
                    <span className="text-[11px] font-bold text-slate-300 block">
                      Modalidade Contratada para Subir Cobrança no Asaas:
                    </span>
                    <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#16242A] border border-slate-800">
                      <button
                        type="button"
                        onClick={() => handleChangeSetupPaymentMode('cash')}
                        className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          setupDet.mode === 'cash'
                            ? 'bg-[#D40B3A] text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Pagamento À Vista</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleChangeSetupPaymentMode('installments')}
                        className={`py-2 px-3 rounded-lg font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                          setupDet.mode === 'installments'
                            ? 'bg-[#D40B3A] text-white shadow'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Setup Parcelado ({setupDet.installmentsCount}x)</span>
                      </button>
                    </div>
                  </div>

                  {/* Preço à Vista + Desconto */}
                  <div className="p-3.5 rounded-xl bg-[#16242A] border border-slate-700/80 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Preço do Setup À Vista (R$):</span>
                        {setupDet.mode === 'cash' && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                            ATIVO
                          </span>
                        )}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={setupDet.cashPrice}
                        onChange={(e) => handleChangeSetupCashPriceDirect(Number(e.target.value))}
                        className="w-32 px-2.5 py-1 bg-[#111F24] border border-slate-700 rounded-lg text-right text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                      />
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-slate-800">
                      <input
                        type="checkbox"
                        checked={fin.setupDiscountApplied}
                        onChange={(e) => handleToggleSetupDiscount(e.target.checked)}
                        className="w-4 h-4 rounded text-[#D40B3A] border-slate-700 accent-[#D40B3A]"
                      />
                      <span className="text-slate-300 font-semibold text-[11px]">
                        Exibir desconto comercial sobre a tabela ({formatBRL(fin.setupPrice)})
                      </span>
                    </label>

                    {fin.setupDiscountApplied && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="text-slate-400 block mb-1 text-[11px]">Desconto Concedido (R$):</label>
                          <input
                            type="number"
                            min="0"
                            value={fin.setupDiscountValue}
                            onChange={(e) => handleChangeSetupDiscountValue(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1 text-[11px]">Motivo na Proposta:</label>
                          <input
                            type="text"
                            placeholder="Ex: Condição à vista reunião"
                            value={fin.setupDiscountReason || ''}
                            onChange={(e) => onUpdateFinancials({ ...fin, setupDiscountReason: e.target.value })}
                            className="w-full px-2.5 py-1.5 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preço Parcelado + Quantidade de Parcelas */}
                  <div className="p-3.5 rounded-xl bg-[#16242A] border border-slate-700/80 space-y-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200 flex items-center gap-1.5">
                        <span>Preço Total do Setup Parcelado (R$):</span>
                        {setupDet.mode === 'installments' && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-700">
                            ATIVO
                          </span>
                        )}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={setupDet.installmentTotal}
                        onChange={(e) => handleChangeSetupInstallmentTotalDirect(Number(e.target.value))}
                        className="w-32 px-2.5 py-1 bg-[#111F24] border border-slate-700 rounded-lg text-right text-white font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                      />
                    </div>

                    {/* Atalhos rápidos para compor o preço parcelado */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 mr-1">Ajuste rápido:</span>
                      {[
                        { id: 'same', label: 'Sem juros (= À vista)' },
                        { id: 'table', label: `Tabela (${formatBRL(fin.setupPrice)})` },
                        { id: 'plus5', label: '+5%' },
                        { id: 'plus10', label: '+10%' },
                      ].map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectInstallmentPreset(p.id as 'same' | 'table' | 'plus5' | 'plus10')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                            installmentMarkupMode === p.id
                              ? 'bg-[#D40B3A] border-[#D40B3A] text-white'
                              : 'bg-[#111F24] border-slate-700 text-slate-300 hover:border-slate-500'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>

                    {/* Quantidade de Parcelas */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300">Quantidade de Parcelas:</span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="1"
                            max="24"
                            value={setupDet.installmentsCount}
                            onChange={(e) => handleChangeSetupInstallmentsCount(Number(e.target.value))}
                            className="w-16 px-2 py-1 bg-[#111F24] border border-slate-700 rounded text-center text-white font-mono font-bold"
                          />
                          <span className="text-[11px] text-slate-400">parcelas</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {parcelPresets.map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => handleChangeSetupInstallmentsCount(n)}
                            className={`flex-1 min-w-[40px] py-1 rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer ${
                              setupDet.installmentsCount === n
                                ? 'bg-[#D40B3A] border-[#D40B3A] text-white'
                                : 'bg-[#111F24] border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            {n}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resumo pronto para subir cobrança */}
                    <div className="p-2.5 rounded-lg bg-[#111F24] border border-emerald-800/60 flex items-center justify-between">
                      <span className="text-[11px] text-slate-300">Valor da Parcela no Asaas:</span>
                      <span className="font-mono font-extrabold text-emerald-400 text-sm">
                        {setupDet.installmentsCount}x de {formatBRL(setupDet.installmentValue)}
                      </span>
                    </div>
                  </div>

                  {/* Permitir escolha pelo cliente no Portal */}
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={fin.allowClientChooseSetupMode !== false}
                      onChange={(e) => onUpdateFinancials({ ...fin, allowClientChooseSetupMode: e.target.checked })}
                      className="w-4 h-4 rounded text-[#D40B3A] accent-[#D40B3A]"
                    />
                    <span>Permitir que o cliente alterne entre À Vista e Parcelado na tela de aceite</span>
                  </label>

                  {/* Rodapé consolidado do Setup */}
                  <div className="pt-2.5 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block">Setup Contratado ({setupDet.mode === 'installments' ? 'Parcelado' : 'À Vista'}):</span>
                      <span className="text-[10.5px] text-slate-500 font-mono">
                        À vista: {formatBRL(setupDet.cashPrice)} · Parcelado: {setupDet.installmentsCount}x {formatBRL(setupDet.installmentValue)}
                      </span>
                    </div>
                    <span className="text-xl font-bold text-white font-mono">
                      {setupDet.mode === 'installments'
                        ? `${setupDet.installmentsCount}x ${formatBRL(setupDet.installmentValue)}`
                        : formatBRL(setupDet.cashPrice)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* Monthly Controls + % Desconto até Dia 05 */}
            {(() => {
              const promptPct = getEffectivePromptDiscountPercent(fin);
              const hasPrompt = fin.hasPromptPaymentDiscount !== false && promptPct > 0;
              const pctPresets = [3, 5, 7, 10];
              return (
                <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      2. Mensalidade Consolidada & Desconto Dia 05
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Tabela: {formatBRL(fin.monthlyPrice)}/mês
                    </span>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    {/* Desconto Fixo Comercial sobre Mensalidade */}
                    <div className="p-3.5 rounded-xl bg-[#16242A] border border-slate-700/80 space-y-2.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fin.monthlyDiscountApplied}
                          onChange={(e) => handleToggleMonthlyDiscount(e.target.checked)}
                          className="w-4 h-4 rounded text-[#D40B3A] border-slate-700 accent-[#D40B3A]"
                        />
                        <span className="text-slate-200 font-semibold">
                          Aplicar desconto fixo sobre a mensalidade de tabela
                        </span>
                      </label>

                      {fin.monthlyDiscountApplied && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          <div>
                            <label className="text-slate-400 block mb-1 text-[11px]">Desconto Mensal (R$):</label>
                            <input
                              type="number"
                              min="0"
                              value={fin.monthlyDiscountValue}
                              onChange={(e) => handleChangeMonthlyDiscountValue(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-slate-400 block mb-1 text-[11px]">Motivo na Proposta:</label>
                            <input
                              type="text"
                              placeholder="Ex: Parceria comercial"
                              value={fin.monthlyDiscountReason || ''}
                              onChange={(e) => onUpdateFinancials({ ...fin, monthlyDiscountReason: e.target.value })}
                              className="w-full px-2.5 py-1.5 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Dia de Vencimento Padrão */}
                    <div className="p-3.5 rounded-xl bg-[#16242A] border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-200 block">Dia de Vencimento Padrão:</span>
                        <span className="text-[10.5px] text-slate-400">Para subir a assinatura recorrente no Asaas</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {[10, 15, 20].map((d) => (
                          <button
                            key={d}
                            type="button"
                            onClick={() => onUpdateFinancials({ ...fin, dueDay: d })}
                            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border transition-colors cursor-pointer ${
                              (fin.dueDay || 10) === d
                                ? 'bg-[#D40B3A] border-[#D40B3A] text-white'
                                : 'bg-[#111F24] border-slate-700 text-slate-300 hover:text-white'
                            }`}
                          >
                            Dia {d}
                          </button>
                        ))}
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={fin.dueDay || 10}
                          onChange={(e) =>
                            onUpdateFinancials({
                              ...fin,
                              dueDay: Math.max(1, Math.min(28, Number(e.target.value) || 10)),
                            })
                          }
                          className="w-14 px-2 py-1 bg-[#111F24] border border-slate-700 rounded-lg text-center text-white font-mono font-bold"
                          title="Dia personalizado de vencimento"
                        />
                      </div>
                    </div>

                    {/* Configurador do % de Desconto até o Dia 05 */}
                    <div className="p-3.5 rounded-xl bg-[#16242A] border border-emerald-800/60 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={fin.hasPromptPaymentDiscount !== false}
                            onChange={(e) => handleTogglePromptDiscount(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-500 accent-emerald-500"
                          />
                          <span className="text-slate-100 font-bold">
                            Desconto de Pontualidade (Pagamento até o dia 05)
                          </span>
                        </label>
                        {hasPrompt && (
                          <span className="text-[11px] font-mono font-extrabold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700">
                            -{formatCleanPercent(promptPct)}% ATIVO
                          </span>
                        )}
                      </div>

                      {fin.hasPromptPaymentDiscount !== false && (
                        <div className="space-y-2.5 pt-2 border-t border-slate-800">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-300 font-semibold">
                              Percentual de Desconto até o Dia 05 (%):
                            </span>
                            <div className="flex items-center gap-1.5">
                              {pctPresets.map((pctOpt) => (
                                <button
                                  key={pctOpt}
                                  type="button"
                                  onClick={() => handleChangePromptDiscountPercent(pctOpt)}
                                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs border transition-colors cursor-pointer ${
                                    promptPct === pctOpt
                                      ? 'bg-emerald-600 border-emerald-500 text-white'
                                      : 'bg-[#111F24] border-slate-700 text-slate-300 hover:text-white'
                                  }`}
                                >
                                  {pctOpt}%
                                </button>
                              ))}
                              <div className="flex items-center gap-1 bg-[#111F24] border border-slate-700 rounded-lg px-2 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  step="0.5"
                                  value={fin.promptPaymentDiscountPercent ?? 5}
                                  onChange={(e) => handleChangePromptDiscountPercent(Number(e.target.value))}
                                  className="w-12 bg-transparent text-right text-emerald-400 font-mono font-bold focus:outline-none"
                                />
                                <span className="text-slate-400 font-mono font-bold">%</span>
                              </div>
                            </div>
                          </div>

                          <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 flex items-center justify-between">
                            <div>
                              <span className="text-[11px] text-emerald-200 font-semibold block">
                                Valor na Proposta (Pagando até o dia 05):
                              </span>
                              <span className="text-[10px] text-emerald-300/80">
                                Desconto de {formatBRL(Math.max(0, fin.monthlyTotal - fin.monthlyWithPromptDiscount))}/mês refletido no PDF
                              </span>
                            </div>
                            <span className="text-base font-extrabold text-emerald-400 font-mono">
                              {formatBRL(fin.monthlyWithPromptDiscount)}/mês
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Mensalidade Contratada (Venc. dia {fin.dueDay || 10}):</span>
                        <span className="text-xl font-bold text-[#D40B3A] font-mono">
                          {formatBRL(fin.monthlyTotal)}/mês
                        </span>
                      </div>
                      {hasPrompt && (
                        <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-0.5">
                          <span>Pagando até o dia 05 ({formatCleanPercent(promptPct)}% de desconto):</span>
                          <span className="font-mono font-bold">
                            {formatBRL(fin.monthlyWithPromptDiscount)}/mês
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}

          </div>

          {/* Anotações do Consultor */}
          <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                <FileText className="w-3.5 h-3.5 text-[#D40B3A]" />
                <span>Anotações ou Observações Livres</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Livre para anotações do consultor sobre negociação, prazos ou particularidades
              </span>
            </div>
            <textarea
              rows={3}
              value={activeProposal.notes || ''}
              onChange={(e) => onUpdateNotes && onUpdateNotes(e.target.value)}
              placeholder="Digite aqui anotações sobre a reunião comercial, particularidades da operação do cliente, observações ou lembretes de fechamento..."
              className="w-full px-3.5 py-2.5 bg-[#16242A] border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D40B3A] resize-y leading-relaxed"
            />
          </div>

          {/* Link Exclusivo Verificável da Proposta para o Cliente */}
          {(() => {
            const setupDet = getSetupBillingDetails(fin);
            const promptPct = getEffectivePromptDiscountPercent(fin);
            const hasPrompt = fin.hasPromptPaymentDiscount !== false && promptPct > 0;
            const summaryServices =
              (activeProposal.selectedServices || []).map((s) => s.name).join(' + ') ||
              currentAsaasPlan.name;

            return (
              <div className="p-4 rounded-xl bg-[#111F24] border border-emerald-800/70 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white uppercase tracking-wider">
                      Link Exclusivo da Proposta para Enviar ao Cliente ({activeProposal.id})
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400">
                    ✓ Sincronizado: {summaryServices} · Setup {setupDet.mode === 'installments' ? `${setupDet.installmentsCount}x ${formatBRL(setupDet.installmentValue)}` : `${formatBRL(setupDet.cashPrice)} à vista`} · Mensal {formatBRL(fin.monthlyTotal)}{hasPrompt ? ` (${formatCleanPercent(promptPct)}% até dia 05)` : ''}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={clientShareUrl}
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    className="flex-1 px-3 py-2 bg-[#16242A] border border-slate-700 rounded-xl text-[11px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleCopyClientLink}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 shadow"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Link da Proposta Copiado!' : 'Copiar Link do Cliente'}</span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Action Row for the Consultant */}
          <div className="pt-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadConsultantPdf}
                disabled={downloadingPdf}
                className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Download className="w-3.5 h-3.5 text-[#D40B3A]" />
                <span>{downloadingPdf ? 'Gerando PDF...' : 'Salvar Proposta em PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handleSendWhatsAppToClient}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar p/ Cliente via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmailToClient}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Enviar por E-mail</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyClientLink}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link'}</span>
              </button>

              <button
                type="button"
                onClick={onProceedToClientAcceptance}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#D40B3A] hover:bg-[#B50931] text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg active:scale-98 cursor-pointer"
              >
                <span>Abrir Portal do Cliente</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Live Preview of the Official Document on the Consultant Screen */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-[#16242A] p-3 rounded-xl border border-slate-700">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewDocType('proposal')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  previewDocType === 'proposal' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Prévia: Proposta Oficial ({includeAsaas && includeRegua ? 'Combo Integrado' : (selectedServiceTrack === 'esteira-asaas' ? 'Asaas' : 'Multicobrança')})</span>
              </button>

              <button
                onClick={() => setPreviewDocType('contract')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  previewDocType === 'contract' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Prévia: Contrato Mestre (MSA - Vigência Indeterminada)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Layout 100% idêntico ao modelo oficial Multilagos
            </span>
          </div>

          <div className="rounded-2xl overflow-x-auto border border-slate-700 shadow-2xl bg-slate-900/60 p-2 sm:p-4">
            <div className="min-w-[794px] mx-auto flex justify-center">
              <div style={{ display: previewDocType === 'proposal' ? 'block' : 'none' }} className="w-full">
                {selectedServiceTrack === 'esteira-asaas' ? (
                  <AsaasProposalDoc
                    proposal={activeProposal}
                    clientInfo={activeProposal.clientInfo}
                    currentPlan={currentAsaasPlan}
                    signatureData={activeProposal.signature}
                    isSigned={false}
                  />
                ) : (
                  <MulticobrancaProposalDoc
                    proposal={activeProposal}
                    clientInfo={activeProposal.clientInfo}
                    currentPlan={currentReguaPlan}
                    allPlans={plans}
                    signatureData={activeProposal.signature}
                    isSigned={false}
                  />
                )}
              </div>
              <div style={{ display: previewDocType === 'contract' ? 'block' : 'none' }} className="w-full">
                <MasterContractDoc
                  proposal={activeProposal}
                  clientInfo={activeProposal.clientInfo}
                  signatureData={activeProposal.signature}
                  isSigned={false}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
