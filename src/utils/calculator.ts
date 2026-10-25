import { Plan, PlanId, ServiceTrack, DiagnosticSheetData, CommercialProposal } from '../types';
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

// Payload serialization for 100% accurate client link sharing
export function encodeProposalToUrlParam(proposal: CommercialProposal): string {
  try {
    let savedGoogleToken: string | undefined = undefined;
    let savedWebhookUrl: string | undefined = undefined;
    try {
      const tok = localStorage.getItem('multilagos_google_workspace_token');
      if (tok) savedGoogleToken = tok;
      const wh = localStorage.getItem('multilagos_google_webhook_url') || ((import.meta as any).env?.VITE_GOOGLE_WEBHOOK_URL || '');
      if (wh && String(wh).trim()) savedWebhookUrl = String(wh).trim();
    } catch {}

    const compact: Record<string, any> = {
      id: proposal.id,
      mId: proposal.contractMasterId,
      tr: proposal.serviceTrack,
      pId: proposal.planId,
      sP: proposal.financials.setupPrice,
      sD: proposal.financials.setupDiscountApplied,
      sDV: proposal.financials.setupDiscountValue,
      sDR: proposal.financials.setupDiscountReason || '',
      sT: proposal.financials.setupTotal,
      mP: proposal.financials.monthlyPrice,
      mD: proposal.financials.monthlyDiscountApplied,
      mDV: proposal.financials.monthlyDiscountValue,
      mDR: proposal.financials.monthlyDiscountReason || '',
      mT: proposal.financials.monthlyTotal,
      mWP: proposal.financials.monthlyWithPromptDiscount,
      dD: proposal.financials.dueDay,
      cn: proposal.clientInfo.companyName,
      cr: proposal.clientInfo.contactName,
      em: proposal.clientInfo.email,
      ph: proposal.clientInfo.phone,
      cp: proposal.clientInfo.cnpj,
      cSys: proposal.clientInfo.currentSystemName || '',
      cWpp: proposal.clientInfo.connectedWhatsApp || '',
      dt: proposal.createdAt,
      vt: proposal.validUntil,
    };

    if (savedWebhookUrl) {
      compact.wh = savedWebhookUrl;
    }

    if (savedGoogleToken) {
      compact.gt = savedGoogleToken;
    }

    if (proposal.selectedServices && proposal.selectedServices.length > 0) {
      compact.sv = proposal.selectedServices;
    }

    return encodeURIComponent(btoa(JSON.stringify(compact)));
  } catch (e) {
    console.error('Error encoding proposal:', e);
    return '';
  }
}

export function decodeProposalFromUrlParam(param: string): Partial<CommercialProposal> | null {
  try {
    const json = atob(decodeURIComponent(param));
    const data = JSON.parse(json);

    // If a 24h Google Apps Script Webhook URL was encoded by the consultant, save it so remote clients sync 24/7
    if (data.wh) {
      try {
        localStorage.setItem('multilagos_google_webhook_url', String(data.wh).trim());
      } catch {}
    }

    // If a Google Workspace token was encoded by the consultant, save it so client auto-syncs seamlessly
    if (data.gt) {
      try {
        localStorage.setItem('multilagos_google_workspace_token', data.gt);
        localStorage.setItem('multilagos_google_token_time', Date.now().toString());
      } catch {}
    }

    return {
      id: data.id,
      contractMasterId: data.mId,
      serviceTrack: data.tr,
      planId: data.pId,
      financials: {
        setupPrice: data.sP,
        setupDiscountApplied: data.sD,
        setupDiscountValue: data.sDV,
        setupDiscountReason: data.sDR,
        setupTotal: data.sT,
        monthlyPrice: data.mP,
        monthlyDiscountApplied: data.mD,
        monthlyDiscountValue: data.mDV,
        monthlyDiscountReason: data.mDR,
        monthlyTotal: data.mT,
        hasPromptPaymentDiscount: true,
        monthlyWithPromptDiscount: data.mWP,
        dueDay: data.dD || 10,
      },
      clientInfo: {
        companyName: data.cn || '',
        tradeName: '',
        cnpj: data.cp || '',
        address: '',
        contactName: data.cr || '',
        contactRole: 'Representante Legal',
        cpf: '',
        email: data.em || '',
        phone: data.ph || '',
        cityState: 'Belo Horizonte/MG',
        currentSystemName: data.cSys || '',
        connectedWhatsApp: data.cWpp || '',
      },
      selectedServices: data.sv || undefined,
      createdAt: data.dt,
      validUntil: data.vt,
    };
  } catch (e) {
    console.error('Error decoding proposal:', e);
    return null;
  }
}
