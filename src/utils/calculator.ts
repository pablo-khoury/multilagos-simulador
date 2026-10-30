import {
  Plan,
  PlanId,
  ServiceTrack,
  DiagnosticSheetData,
  CommercialProposal,
  ProposalFinancials,
  ReguaPortfolioType,
  SetupPaymentMode,
} from '../types';
import { ALL_INITIAL_PLANS } from '../data/mockData';

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2).replace('.', ',')}%`;
}

export function formatCleanPercent(pct: number): string {
  if (!Number.isFinite(pct)) return '0';
  return Number.isInteger(pct) ? String(pct) : pct.toFixed(1).replace('.', ',');
}

export function getDefaultPromptDiscountPercent(): number {
  try {
    const raw = localStorage.getItem('multilagos_default_prompt_discount_pct');
    if (raw !== null && raw !== '') {
      const parsed = Number(raw);
      if (Number.isFinite(parsed) && parsed >= 0 && parsed <= 100) {
        return parsed;
      }
    }
  } catch {}
  return 5;
}

export function getEffectivePromptDiscountPercent(fin?: Partial<ProposalFinancials>): number {
  if (!fin || fin.hasPromptPaymentDiscount === false) return 0;
  if (typeof fin.promptPaymentDiscountPercent === 'number' && Number.isFinite(fin.promptPaymentDiscountPercent)) {
    return Math.max(0, Math.min(100, fin.promptPaymentDiscountPercent));
  }
  return 5;
}

export function calculateMonthlyWithPromptDiscount(
  monthlyTotal: number,
  hasDiscount: boolean,
  percent = 5
): number {
  const safeMonthly = Math.max(0, monthlyTotal || 0);
  if (!hasDiscount || percent <= 0) {
    return Number(safeMonthly.toFixed(2));
  }
  const cleanPct = Math.max(0, Math.min(100, percent));
  return Number((safeMonthly * (1 - cleanPct / 100)).toFixed(2));
}

export interface SetupBillingDetails {
  mode: SetupPaymentMode;
  cashPrice: number;
  installmentTotal: number;
  installmentsCount: number;
  installmentValue: number;
  contractedTotal: number;
  shortSummary: string;
  fullBillingNote: string;
}

export function getSetupBillingDetails(fin: ProposalFinancials): SetupBillingDetails {
  const mode: SetupPaymentMode = fin.setupPaymentMode === 'installments' ? 'installments' : 'cash';
  const defaultBase = Math.max(0, fin.setupPrice - (fin.setupDiscountApplied ? (fin.setupDiscountValue || 0) : 0));
  const cashPrice =
    typeof fin.setupCashPrice === 'number' && Number.isFinite(fin.setupCashPrice)
      ? Math.max(0, fin.setupCashPrice)
      : (mode === 'cash' ? fin.setupTotal : defaultBase);
  const installmentTotal =
    typeof fin.setupInstallmentTotal === 'number' && Number.isFinite(fin.setupInstallmentTotal)
      ? Math.max(0, fin.setupInstallmentTotal)
      : (mode === 'installments' ? fin.setupTotal : cashPrice);
  const installmentsCount = Math.max(1, Math.round(fin.setupInstallmentsCount || 3));
  const installmentValue = Number((installmentTotal / installmentsCount).toFixed(2));
  const contractedTotal = mode === 'installments' ? installmentTotal : cashPrice;

  const shortSummary =
    mode === 'installments'
      ? `Parcelado em ${installmentsCount}x de ${formatBRL(installmentValue)} (Total ${formatBRL(installmentTotal)})`
      : `À vista: ${formatBRL(cashPrice)}`;

  const fullBillingNote =
    mode === 'installments'
      ? `Parcelado em ${installmentsCount}x de ${formatBRL(installmentValue)} (Total parcelado: ${formatBRL(installmentTotal)} | Preço à vista: ${formatBRL(cashPrice)})`
      : `À vista por ${formatBRL(cashPrice)} (Opção parcelada: ${installmentsCount}x de ${formatBRL(installmentValue)} = ${formatBRL(installmentTotal)})`;

  return {
    mode,
    cashPrice,
    installmentTotal,
    installmentsCount,
    installmentValue,
    contractedTotal,
    shortSummary,
    fullBillingNote,
  };
}

const DEFAULT_CLIENT_PORTFOLIO_MONTHLY: Record<string, number> = {
  'regua-1k': 119,
  'regua-3k': 199,
  'regua-5k': 329,
  'regua-10k': 599,
};

export function getReguaPlanPrices(
  plan: Plan,
  portfolio: ReguaPortfolioType = 'multilagos'
): { monthlyPrice: number; setupPrice: number } {
  if (portfolio === 'client') {
    const fallbackMonthly = DEFAULT_CLIENT_PORTFOLIO_MONTHLY[plan.id] ?? Math.round(plan.baseMonthlyPrice * 0.67);
    return {
      monthlyPrice:
        typeof plan.clientPortfolioMonthlyPrice === 'number' && Number.isFinite(plan.clientPortfolioMonthlyPrice)
          ? plan.clientPortfolioMonthlyPrice
          : fallbackMonthly,
      setupPrice:
        typeof plan.clientPortfolioSetupPrice === 'number' && Number.isFinite(plan.clientPortfolioSetupPrice)
          ? plan.clientPortfolioSetupPrice
          : plan.baseSetupPrice,
    };
  }
  return {
    monthlyPrice: plan.baseMonthlyPrice,
    setupPrice: plan.baseSetupPrice,
  };
}

export function getReguaFeaturesForPortfolio(
  plan: Plan,
  portfolio: ReguaPortfolioType = 'multilagos'
): string[] {
  const base = plan.features || [];
  const filtered = base.filter(
    (f) => !f.toLowerCase().includes('custos da meta') && !f.toLowerCase().includes('portfólio empresarial')
  );
  if (portfolio === 'client') {
    return [
      ...filtered,
      'Conexão no Portfólio Meta (BM) do Cliente — tarifas de conversas pagas diretamente à Meta',
    ];
  }
  return [
    ...filtered,
    'Custos da Meta (WhatsApp) incluídos na mensalidade (Portfólio Multilagos)',
  ];
}

export function generateProposalCode(): { propId: string; msaId: string } {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(100 + Math.random() * 900);
  return {
    propId: `PROP-${year}-${randomNum}`,
    msaId: `MSA-${year}-${randomNum}`,
  };
}

export function getFormattedCurrentDate(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
}

export function getValidityDate(days = 15): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export interface MonthProjection {
  monthName: string;
  totalClients: number;
  delinquencyRate: number;
  revenue: number;
  delinquencyAmount: number;
  collectionCost: number;
  adjustedRevenue: number;
}

export interface FeeMethodDetail {
  method: string;
  active: boolean;
  transactions: number;
  clientRateText: string;
  multilagosRateText: string;
  clientCost: number;
  multilagosCost: number;
  difference: number;
}

export interface FeeComparisonMetrics {
  currentMonthlyCost: number;
  multilagosMonthlyCost: number;
  monthlySavings: number;
  annualSavings: number;
  savingsPercent: number;
  details: FeeMethodDetail[];
}

export interface DiagnosticCalculatedMetrics {
  averageTicket: number;
  delinquencyRate: number;
  delinquencyAmount: number;
  costWithCollection: number;
  reductionGoalPercent: number;
  targetDelinquentClients: number;
  targetDelinquencyRate: number;
  monthlyRecoveredCash: number;
  annualRecoveredCash: number;
  statusQuoProjections: MonthProjection[];
  solutionProjections: MonthProjection[];
  totalRevenueDifference: number;
  totalDelinquencyDifference: number;
  recommendedTrack: ServiceTrack;
  recommendedPlanId: PlanId;
  recommendationReason: string;
  feeComparison: FeeComparisonMetrics;
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function calculateDiagnosticMetrics(sheet: DiagnosticSheetData): DiagnosticCalculatedMetrics {
  const clientCount = Math.max(1, sheet.clientCount || 1);
  const revenue = sheet.monthlyRevenue || 0;
  const averageTicket = revenue / clientCount;
  const delinquentCount = sheet.delinquentClientCount || 0;
  const delinquencyRate = delinquentCount / clientCount;
  const delinquencyAmount = revenue * delinquencyRate;

  // Cost with collection (ex: estimated time and manual resources)
  const costWithCollection = Math.round((sheet.hoursSpentPerWeek || 0) * 4 * 65); // R$ 65/hora homem estimada

  // Reduction target (-80% as in user spreadsheet)
  const reductionGoalPercent = sheet.reductionGoalPercent || 80;
  const reductionRatio = reductionGoalPercent / 100;
  const targetDelinquentClients = Math.max(1, Math.round(delinquentCount * (1 - reductionRatio)));
  const targetDelinquencyRate = targetDelinquentClients / clientCount;
  const monthlyRecoveredCash = delinquencyAmount * reductionRatio;
  const annualRecoveredCash = monthlyRecoveredCash * 12;

  // 12-Month Projections matching user sheet
  const netMonthlyGrowth = (sheet.newClientsPerMonth || 0) - (sheet.churnClientsPerMonth || 0);

  const statusQuoProjections: MonthProjection[] = [];
  const solutionProjections: MonthProjection[] = [];

  let statusQuoAdjustedSum = 0;
  let solutionAdjustedSum = 0;
  let statusQuoDelinquencySum = 0;
  let solutionDelinquencySum = 0;

  for (let i = 0; i < 12; i++) {
    const projectedClients = Math.max(1, clientCount + netMonthlyGrowth * i);
    const projectedRevenue = projectedClients * averageTicket;

    // Status quo (no solution)
    const sqDelinq = projectedRevenue * delinquencyRate;
    const sqCost = 0;
    const sqAdjusted = projectedRevenue - sqDelinq;
    statusQuoAdjustedSum += sqAdjusted;
    statusQuoDelinquencySum += sqDelinq;

    statusQuoProjections.push({
      monthName: MONTH_NAMES[i],
      totalClients: projectedClients,
      delinquencyRate: delinquencyRate,
      revenue: projectedRevenue,
      delinquencyAmount: sqDelinq,
      collectionCost: sqCost,
      adjustedRevenue: sqAdjusted,
    });

    // With Multilagos Solution (-80% reduction)
    const solDelinq = projectedRevenue * targetDelinquencyRate;
    // Estimated software & automation fee per month in table
    const solCost = Math.round(379 + (projectedClients > 200 ? (projectedClients - 200) * 0.5 : 0));
    const solAdjusted = projectedRevenue - solDelinq;
    solutionAdjustedSum += solAdjusted;
    solutionDelinquencySum += solDelinq;

    solutionProjections.push({
      monthName: MONTH_NAMES[i],
      totalClients: projectedClients,
      delinquencyRate: targetDelinquencyRate,
      revenue: projectedRevenue,
      delinquencyAmount: solDelinq,
      collectionCost: solCost,
      adjustedRevenue: solAdjusted,
    });
  }

  const totalRevenueDifference = solutionAdjustedSum - statusQuoAdjustedSum;
  const totalDelinquencyDifference = statusQuoDelinquencySum - solutionDelinquencySum;

  // Comparativo de Custos de Recebimento (Taxas Atuais do Cliente vs Multilagos/Asaas)
  const pm = sheet.paymentMethods || {
    pix: true,
    pixFee: 1.50,
    boleto: true,
    boletoFee: 3.50,
    creditCard: true,
    creditCardFee: 3.99,
    debitCard: false,
    debitCardFee: 1.99,
  };

  const activeMethodsCount = [pm.pix, pm.boleto, pm.creditCard, pm.debitCard].filter(Boolean).length || 1;
  const weightPix = pm.pix ? (pm.boleto ? 0.45 : 0.7) : 0;
  const weightBoleto = pm.boleto ? (pm.pix ? 0.40 : 0.7) : 0;
  const weightCard = pm.creditCard ? (1 - weightPix - weightBoleto) : 0;

  const pixTransactions = Math.round(clientCount * (weightPix > 0 ? weightPix : (pm.pix ? 1 / activeMethodsCount : 0)));
  const boletoTransactions = Math.round(clientCount * (weightBoleto > 0 ? weightBoleto : (pm.boleto ? 1 / activeMethodsCount : 0)));
  const cardTransactions = Math.max(0, clientCount - pixTransactions - boletoTransactions);

  // Client Current Costs
  const clientPixCost = pm.pix ? (
    pm.pixFeeType === 'percent'
      ? (pixTransactions * averageTicket * (pm.pixFee || 0) / 100)
      : (pixTransactions * (pm.pixFee || 0))
  ) : 0;

  const clientBoletoCost = pm.boleto ? (boletoTransactions * (pm.boletoFee || 0)) : 0;

  const clientCardFeeRate = pm.creditCardFee || 3.99;
  const cardVolume = cardTransactions * averageTicket;
  const clientCardCost = pm.creditCard ? (cardVolume * (clientCardFeeRate / 100)) : 0;

  // Multilagos (Asaas Homologado) Costs:
  // Pix: R$ 0,99 por transação
  const multilagosPixCost = pm.pix ? (pixTransactions * 0.99) : 0;
  // Boleto: R$ 1,89 por liquidação
  const multilagosBoletoCost = pm.boleto ? (boletoTransactions * 1.89) : 0;
  // Cartão: 2,93% + R$ 0,29
  const multilagosCardCost = pm.creditCard ? (cardVolume * 0.0293 + (cardTransactions * 0.29)) : 0;

  const currentMonthlyCost = clientPixCost + clientBoletoCost + clientCardCost;
  const multilagosMonthlyCost = multilagosPixCost + multilagosBoletoCost + multilagosCardCost;
  const monthlySavings = Math.max(0, currentMonthlyCost - multilagosMonthlyCost);
  const annualSavings = monthlySavings * 12;
  const savingsPercent = currentMonthlyCost > 0 ? (monthlySavings / currentMonthlyCost) * 100 : 0;

  const feeDetails: FeeMethodDetail[] = [
    {
      method: 'Pix',
      active: !!pm.pix,
      transactions: pixTransactions,
      clientRateText: pm.pixFeeType === 'percent' ? `${pm.pixFee}%` : formatBRL(pm.pixFee || 0),
      multilagosRateText: 'R$ 0,99 (fixo)',
      clientCost: clientPixCost,
      multilagosCost: multilagosPixCost,
      difference: clientPixCost - multilagosPixCost,
    },
    {
      method: 'Boleto Bancário',
      active: !!pm.boleto,
      transactions: boletoTransactions,
      clientRateText: formatBRL(pm.boletoFee || 0),
      multilagosRateText: 'R$ 1,89 (liquidado)',
      clientCost: clientBoletoCost,
      multilagosCost: multilagosBoletoCost,
      difference: clientBoletoCost - multilagosBoletoCost,
    },
    {
      method: 'Cartão de Crédito',
      active: !!pm.creditCard,
      transactions: cardTransactions,
      clientRateText: `${(pm.creditCardFee || 3.99).toFixed(2).replace('.', ',')}%`,
      multilagosRateText: '2,93% + R$ 0,29',
      clientCost: clientCardCost,
      multilagosCost: multilagosCardCost,
      difference: clientCardCost - multilagosCardCost,
    },
  ];

  const feeComparison: FeeComparisonMetrics = {
    currentMonthlyCost,
    multilagosMonthlyCost,
    monthlySavings,
    annualSavings,
    savingsPercent,
    details: feeDetails,
  };

  // Intelligent Recommendation logic:
  let recommendedTrack: ServiceTrack = 'esteira-asaas';
  let recommendedPlanId: PlanId = 'pro';
  let recommendationReason = 'Recomendado Plano PRO (Asaas) para automação de NFS-e, régua no WhatsApp e gestão financeira completa.';

  const usesErp = sheet.currentSystem && sheet.currentSystem.toLowerCase() !== 'nenhum' && sheet.currentSystem.trim() !== '';

  // Split is exclusively in Performance (and Personalizado) as requested by user!
  if (sheet.hasCommissionOrSplit === 'sim') {
    recommendedTrack = 'esteira-asaas';
    recommendedPlanId = 'performance';
    recommendationReason = 'Recomendado Plano Performance (Asaas) exclusivo com Split de Pagamentos automático, NFS-e e integração com ERP.';
  } else if (sheet.issuesNfse === 'sim') {
    recommendedTrack = 'esteira-asaas';
    if (clientCount > 600 || usesErp) {
      recommendedPlanId = 'performance';
      recommendationReason = 'Recomendado Plano Performance (Asaas) com integração direta ao seu ERP, NFS-e e Dashboard avançado.';
    } else {
      recommendedPlanId = 'pro';
      recommendationReason = 'Recomendado Plano PRO (Asaas) com emissão automática de NFS-e e régua completa de recebimento.';
    }
  } else if (usesErp) {
    // If they already have their billing gateway/ERP and only want WhatsApp collection:
    recommendedTrack = 'esteira-regua-n8n';
    if (clientCount <= 300) {
      recommendedPlanId = 'regua-1k';
      recommendationReason = 'Recomendado Multicobrança 1.000 msgs/mês para conectar ao seu sistema atual sem trocar de banco.';
    } else if (clientCount <= 800) {
      recommendedPlanId = 'regua-3k';
      recommendationReason = 'Recomendado Multicobrança 3.000 msgs/mês para cobertura completa da sua carteira no WhatsApp.';
    } else {
      recommendedPlanId = 'regua-5k';
      recommendationReason = 'Recomendado Multicobrança 5.000 msgs/mês para alta volumetria no WhatsApp com Meta inclusa.';
    }
  } else {
    // Standard Asaas
    if (clientCount <= 150) {
      recommendedTrack = 'esteira-asaas';
      recommendedPlanId = 'essencial';
      recommendationReason = 'Recomendado Plano Essencial (Asaas) para estruturar a conta digital e padronizar recebíveis.';
    } else {
      recommendedTrack = 'esteira-asaas';
      recommendedPlanId = 'pro';
      recommendationReason = 'Recomendado Plano PRO (Asaas), o plano mais indicado da Multilagos para previsibilidade financeira.';
    }
  }

  return {
    averageTicket,
    delinquencyRate,
    delinquencyAmount,
    costWithCollection,
    reductionGoalPercent,
    targetDelinquentClients,
    targetDelinquencyRate,
    monthlyRecoveredCash,
    annualRecoveredCash,
    statusQuoProjections,
    solutionProjections,
    totalRevenueDifference,
    totalDelinquencyDifference,
    recommendedTrack,
    recommendedPlanId,
    recommendationReason,
    feeComparison,
  };
}

export function getPricingTierForClientCount(
  clientCount: number,
  tiers: import('../types').ClientPricingTier[]
): import('../types').ClientPricingTier {
  const count = Math.max(1, clientCount || 1);
  const found = tiers.find((t) => count >= t.minClients && count <= t.maxClients);
  return found || tiers[tiers.length - 1] || tiers[0];
}

export function getTieredPlanPrice(
  planId: PlanId,
  clientCount: number,
  tiers: import('../types').ClientPricingTier[]
): { monthlyPrice: number; setupPrice: number } | null {
  const tier = getPricingTierForClientCount(clientCount, tiers);
  if (!tier || !tier.plans) return null;
  if (planId === 'essencial') return tier.plans.essencial;
  if (planId === 'pro') return tier.plans.pro;
  if (planId === 'performance') return tier.plans.performance;
  if (planId === 'personalizado') return tier.plans.personalizado;
  return null;
}

const PROPOSALS_BY_ID_STORAGE_KEY = 'multilagos_proposals_by_id_v1';

function utf8ToBase64Url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function decodeBase64Flexible(input: string): string {
  let unescaped = input.trim();
  try {
    unescaped = decodeURIComponent(unescaped);
  } catch {
    // Keep raw if already decoded
  }
  let b64 = unescaped.replace(/-/g, '+').replace(/_/g, '/').replace(/\s/g, '');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Fallback for legacy Latin-1 btoa links
    return binary;
  }
}

export function saveProposalSnapshotLocally(proposal: CommercialProposal): void {
  if (!proposal?.id) return;
  try {
    const raw = localStorage.getItem(PROPOSALS_BY_ID_STORAGE_KEY);
    const map: Record<string, CommercialProposal> = raw ? JSON.parse(raw) : {};
    map[proposal.id] = proposal;
    const keys = Object.keys(map);
    if (keys.length > 30) {
      delete map[keys[0]];
    }
    localStorage.setItem(PROPOSALS_BY_ID_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function loadProposalSnapshotLocally(proposalId: string): CommercialProposal | null {
  if (!proposalId) return null;
  try {
    const raw = localStorage.getItem(PROPOSALS_BY_ID_STORAGE_KEY);
    if (!raw) return null;
    const map: Record<string, CommercialProposal> = JSON.parse(raw);
    return map[proposalId] || null;
  } catch {
    return null;
  }
}

// Payload serialization for 100% accurate client link sharing (UTF-8 & URL-safe Base64)
export function encodeProposalToUrlParam(proposal: CommercialProposal): string {
  try {
    let savedWebhookUrl: string | undefined = undefined;
    try {
      const wh =
        localStorage.getItem('multilagos_google_webhook_url') ||
        ((import.meta as any).env?.VITE_GOOGLE_WEBHOOK_URL || '');
      if (wh && String(wh).trim()) savedWebhookUrl = String(wh).trim();
    } catch {}

    const setupDetails = getSetupBillingDetails(proposal.financials);
    const promptPct = getEffectivePromptDiscountPercent(proposal.financials);
    const rawCompanyName = (proposal.clientInfo.companyName || '').trim();
    const cleanCompanyName = rawCompanyName === 'Minha Empresa Ltda' ? '' : rawCompanyName;

    const compact: Record<string, any> = {
      v: 2,
      id: proposal.id,
      mId: proposal.contractMasterId,
      tr: proposal.serviceTrack,
      pId: proposal.planId,
      rPT: proposal.reguaPortfolioType || 'multilagos',
      sP: proposal.financials.setupPrice,
      sD: proposal.financials.setupDiscountApplied,
      sDV: proposal.financials.setupDiscountValue,
      sDR: proposal.financials.setupDiscountReason || '',
      sT: setupDetails.contractedTotal,
      sPM: setupDetails.mode,
      sCP: setupDetails.cashPrice,
      sIT: setupDetails.installmentTotal,
      sIC: setupDetails.installmentsCount,
      sAC: proposal.financials.allowClientChooseSetupMode !== false,
      mP: proposal.financials.monthlyPrice,
      mD: proposal.financials.monthlyDiscountApplied,
      mDV: proposal.financials.monthlyDiscountValue,
      mDR: proposal.financials.monthlyDiscountReason || '',
      mT: proposal.financials.monthlyTotal,
      hPP: proposal.financials.hasPromptPaymentDiscount !== false && promptPct > 0,
      pPP: promptPct,
      mWP: proposal.financials.monthlyWithPromptDiscount,
      dD: proposal.financials.dueDay || 10,
      cn: cleanCompanyName,
      tn: proposal.clientInfo.tradeName || '',
      cp: proposal.clientInfo.cnpj || '',
      ad: proposal.clientInfo.address || '',
      cr: proposal.clientInfo.contactName || '',
      rl: proposal.clientInfo.contactRole || '',
      cpf: proposal.clientInfo.cpf || '',
      em: proposal.clientInfo.email || '',
      ph: proposal.clientInfo.phone || '',
      cs: proposal.clientInfo.cityState || '',
      cSys: proposal.clientInfo.currentSystemName || '',
      cWpp: proposal.clientInfo.connectedWhatsApp || '',
      dt: proposal.createdAt,
      vt: proposal.validUntil,
    };

    if (proposal.notes && proposal.notes.trim()) {
      compact.nt = proposal.notes.trim();
    }

    if (proposal.customFeatures && proposal.customFeatures.length > 0) {
      compact.cf = proposal.customFeatures;
    }

    if (savedWebhookUrl) {
      compact.wh = savedWebhookUrl;
    }

    if (proposal.selectedServices && proposal.selectedServices.length > 0) {
      compact.sv = proposal.selectedServices.map((s) => ({
        i: s.id,
        n: s.name,
        c: s.category,
        p: s.planId,
        r: s.reguaPortfolioType,
        s: s.setupPrice,
        m: s.monthlyPrice,
        d: s.description,
        f: s.features,
      }));
    }

    return utf8ToBase64Url(JSON.stringify(compact));
  } catch (e) {
    console.error('Error encoding proposal:', e);
    return '';
  }
}

export function decodeProposalFromUrlParam(param: string): Partial<CommercialProposal> | null {
  try {
    if (!param || !param.trim()) return null;
    const json = decodeBase64Flexible(param);
    const data = JSON.parse(json);
    if (!data || typeof data !== 'object') return null;

    // If a 24h Google Apps Script Webhook URL was encoded by the consultant, save it so remote clients sync 24/7
    if (data.wh) {
      try {
        localStorage.setItem('multilagos_google_webhook_url', String(data.wh).trim());
      } catch {}
    }

    // Legacy Google Workspace OAuth token support
    if (data.gt) {
      try {
        localStorage.setItem('multilagos_google_workspace_token', data.gt);
        localStorage.setItem('multilagos_google_token_time', Date.now().toString());
      } catch {}
    }

    const hasPrompt = typeof data.hPP === 'boolean' ? data.hPP : true;
    const promptPct = typeof data.pPP === 'number' ? data.pPP : (hasPrompt ? 5 : 0);

    const decodedServices = Array.isArray(data.sv)
      ? data.sv.map((item: any) => {
          // Support both v2 compact keys and v1 legacy keys
          if (item && typeof item === 'object' && ('i' in item || 'n' in item)) {
            const matchedPlan = ALL_INITIAL_PLANS.find((pl) => pl.id === item.p);
            return {
              id: item.i || 'serv-item',
              name: item.n || matchedPlan?.name || 'Serviço Contratado',
              category: item.c || 'asaas',
              planId: item.p,
              reguaPortfolioType: item.r,
              setupPrice: typeof item.s === 'number' ? item.s : 0,
              monthlyPrice: typeof item.m === 'number' ? item.m : 0,
              description: item.d || '',
              features: Array.isArray(item.f) ? item.f : matchedPlan?.features,
            };
          }
          return item;
        })
      : undefined;

    const rawCompany = data.cn || '';
    const cleanCompany = rawCompany === 'Minha Empresa Ltda' ? '' : rawCompany;

    return {
      id: data.id,
      contractMasterId: data.mId,
      serviceTrack: data.tr || 'esteira-asaas',
      planId: data.pId || 'pro',
      reguaPortfolioType: data.rPT === 'client' ? 'client' : 'multilagos',
      notes: typeof data.nt === 'string' ? data.nt : undefined,
      customFeatures: Array.isArray(data.cf) ? data.cf : undefined,
      financials: {
        setupPrice: typeof data.sP === 'number' ? data.sP : (data.sT || 0),
        setupDiscountApplied: !!data.sD,
        setupDiscountValue: typeof data.sDV === 'number' ? data.sDV : 0,
        setupDiscountReason: data.sDR || '',
        setupTotal: typeof data.sT === 'number' ? data.sT : 0,
        setupPaymentMode: data.sPM === 'installments' ? 'installments' : 'cash',
        setupCashPrice: typeof data.sCP === 'number' ? data.sCP : (data.sT || 0),
        setupInstallmentTotal: typeof data.sIT === 'number' ? data.sIT : (data.sT || 0),
        setupInstallmentsCount: typeof data.sIC === 'number' ? data.sIC : 3,
        allowClientChooseSetupMode: data.sAC !== false,
        monthlyPrice: typeof data.mP === 'number' ? data.mP : (data.mT || 0),
        monthlyDiscountApplied: !!data.mD,
        monthlyDiscountValue: typeof data.mDV === 'number' ? data.mDV : 0,
        monthlyDiscountReason: data.mDR || '',
        monthlyTotal: typeof data.mT === 'number' ? data.mT : 0,
        hasPromptPaymentDiscount: hasPrompt,
        promptPaymentDiscountPercent: promptPct,
        monthlyWithPromptDiscount:
          typeof data.mWP === 'number'
            ? data.mWP
            : calculateMonthlyWithPromptDiscount(data.mT || 0, hasPrompt, promptPct),
        dueDay: data.dD || 10,
      },
      clientInfo: {
        companyName: cleanCompany,
        tradeName: data.tn || '',
        cnpj: data.cp || '',
        address: data.ad || '',
        contactName: data.cr || '',
        contactRole: data.rl || 'Representante Legal',
        cpf: data.cpf || '',
        email: data.em || '',
        phone: data.ph || '',
        cityState: data.cs && data.cs !== 'Belo Horizonte/MG' ? data.cs : '',
        currentSystemName: data.cSys || '',
        connectedWhatsApp: data.cWpp || '',
      },
      selectedServices: decodedServices,
      createdAt: data.dt,
      validUntil: data.vt,
    };
  } catch (e) {
    console.error('Error decoding proposal:', e);
    return null;
  }
}

export function buildClientShareUrl(proposal: CommercialProposal): string {
  if (typeof window === 'undefined') return '';
  saveProposalSnapshotLocally(proposal);
  const encoded = encodeProposalToUrlParam(proposal);
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}?proposta=${encodeURIComponent(proposal.id)}&p=${encoded}`;
}

export function extractProposalFromCurrentUrl(): {
  isClientAccess: boolean;
  decoded: Partial<CommercialProposal> | null;
  proposalId: string | null;
} {
  if (typeof window === 'undefined') {
    return { isClientAccess: false, decoded: null, proposalId: null };
  }

  const searchParams = new URLSearchParams(window.location.search);
  const hashRaw = window.location.hash.startsWith('#')
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hashRaw.startsWith('?') ? hashRaw.slice(1) : hashRaw);

  const encodedPayload = searchParams.get('p') || hashParams.get('p');
  const proposalId = searchParams.get('proposta') || hashParams.get('proposta');
  const isClientTab = searchParams.get('tab') === 'cliente' || hashParams.get('tab') === 'cliente';

  if (encodedPayload && encodedPayload.trim()) {
    const decoded = decodeProposalFromUrlParam(encodedPayload);
    if (decoded) {
      return {
        isClientAccess: true,
        decoded,
        proposalId: decoded.id || proposalId,
      };
    }
  }

  if (proposalId) {
    const localSnapshot = loadProposalSnapshotLocally(proposalId);
    if (localSnapshot) {
      return {
        isClientAccess: true,
        decoded: localSnapshot,
        proposalId,
      };
    }
    return {
      isClientAccess: true,
      decoded: null,
      proposalId,
    };
  }

  if (isClientTab) {
    return {
      isClientAccess: true,
      decoded: null,
      proposalId: null,
    };
  }

  return {
    isClientAccess: false,
    decoded: null,
    proposalId: null,
  };
}
