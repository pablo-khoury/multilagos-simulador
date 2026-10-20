export type ServiceTrack = 'esteira-asaas' | 'esteira-regua-n8n';

export type PlanId = 
  | 'essencial' 
  | 'pro' 
  | 'performance' 
  | 'personalizado' 
  | 'regua-1k' 
  | 'regua-3k' 
  | 'regua-5k' 
  | 'regua-10k';

export interface Plan {
  id: PlanId;
  track: 'asaas' | 'regua-n8n';
  name: string;
  headline: string;
  baseMonthlyPrice: number;
  baseSetupPrice: number;
  badge?: string;
  recommended?: boolean;
  idealFor: string;
  sla: string;
  features: string[];
  messageQuota?: number;
}

export type PaymentFrequency = 'mensal' | 'semestral' | 'anual';

export type BillingModel = 'recorrente' | 'parcelamento' | 'avulso' | 'misto';

export interface DiagnosticSheetData {
  companyName: string;
  segment: string;
  monthlyRevenue: number;
  clientCount: number;
  delinquentClientCount: number;
  newClientsPerMonth: number;
  churnClientsPerMonth: number;
  issuesNfse: 'sim' | 'nao' | 'manual';
  hasCommissionOrSplit: 'sim' | 'nao';
  billingModel: BillingModel;
  financialTeamSize: number; // 1 to 10 or 11 (+10)
  paymentMethods: {
    pix: boolean;
    pixFee: number;
    boleto: boolean;
    boletoFee: number;
    creditCard: boolean;
    debitCard: boolean;
  };
  currentSystem: string;
  collectionMethodNotes: string;
  hoursSpentPerWeek: number;
  reductionGoalPercent: number; // editable reduction goal, ex: 80%
  generalNotes?: string; // livre para anotações ou observações
}

export interface ClientInfo {
  companyName: string;
  tradeName: string;
  cnpj: string;
  stateRegistration?: string;
  address: string;
  contactName: string;
  contactRole: string;
  cpf: string;
  email: string;
  phone: string;
  cityState: string;
  currentSystemName?: string;
  connectedWhatsApp?: string;
}

export interface DigitalSignatureData {
  signed: boolean;
  signedAt?: string;
  signatureType: 'draw' | 'type';
  signatureDataString?: string;
  signerName?: string;
  signerCpf?: string;
  signerIp?: string;
  verificationHash?: string;
}

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  approvedRatePerLiquidation: number; // R$ 0,99
  webhookUrl: string;
  autoIssueNfse: boolean;
  erpIntegration: string;
}

export interface AsaasBillingResult {
  customerId: string;
  paymentId: string;
  invoiceNumber: string;
  pixQrCodeBase64: string;
  pixCopiaECola: string;
  bankSlipUrl: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED';
  netValue: number;
  feeApplied: number;
  dueDate: string;
}

export type ProposalStatus = 'draft' | 'shared_with_client' | 'client_accepted';

export interface ProposalFinancials {
  setupPrice: number;
  setupDiscountApplied: boolean;
  setupDiscountValue: number;
  setupDiscountReason?: string;
  setupTotal: number;

  monthlyPrice: number;
  monthlyDiscountApplied: boolean;
  monthlyDiscountValue: number;
  monthlyDiscountReason?: string;
  monthlyTotal: number;

  hasPromptPaymentDiscount: boolean;
  monthlyWithPromptDiscount: number;
  dueDay: number;
}

export interface CommercialProposal {
  id: string; // ex: PROP-2026-104
  contractMasterId: string; // ex: MSA-2026-104
  createdAt: string;
  validUntil: string;
  consultantName: string;
  consultantEmail: string;
  consultantPhone: string;
  status: ProposalStatus;
  
  serviceTrack: ServiceTrack;
  planId: PlanId;
  
  clientInfo: ClientInfo;
  diagnosticData?: DiagnosticSheetData;
  notes?: string;
  customFeatures?: string[];
  
  financials: ProposalFinancials;
  
  minimumContractMonths: number;
  startDate: string;

  signature: DigitalSignatureData;
  asaasBilling?: AsaasBillingResult;
}

export type ActiveAppTab = 'simulador' | 'cliente_aceite' | 'admin';
