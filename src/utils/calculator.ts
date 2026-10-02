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

  // Intelligent Recommendation logic:
  let recommendedTrack: ServiceTrack = 'esteira-asaas';
  let recommendedPlanId: PlanId = 'pro';
  let recommendationReason = 'Recomendado Plano PRO (Asaas) para automação de NFS-e, régua no WhatsApp e gestão financeira completa.';

  const usesErp = sheet.currentSystem && sheet.currentSystem.toLowerCase() !== 'nenhum' && sheet.currentSystem.trim() !== '';

  if (sheet.issuesNfse === 'sim' || sheet.hasCommissionOrSplit === 'sim') {
    recommendedTrack = 'esteira-asaas';
    if (clientCount > 600 || usesErp) {
      recommendedPlanId = 'performance';
      recommendationReason = 'Recomendado Plano Performance (Asaas) com integração direta ao seu ERP, NFS-e automática e Split de Pagamentos.';
    } else {
      recommendedPlanId = 'pro';
      recommendationReason = 'Recomendado Plano PRO (Asaas) com NFS-e automática e Split de comissões/repasses.';
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
  };
}

// Payload serialization for 100% accurate client link sharing
export function encodeProposalToUrlParam(proposal: CommercialProposal): string {
  try {
    const compact = {
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
      createdAt: data.dt,
      validUntil: data.vt,
    };
  } catch (e) {
    console.error('Error decoding proposal:', e);
    return null;
  }
}
