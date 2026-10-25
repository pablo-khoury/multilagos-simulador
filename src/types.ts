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

export type ReguaPortfolioType = 'multilagos' | 'client';

export type SetupPaymentMode = 'cash' | 'installments';

export interface Plan {
  id: PlanId;
  track: 'asaas' | 'regua-n8n';
  name: string;
  headline: string;
  baseMonthlyPrice: number;
  baseSetupPrice: number;
  clientPortfolioMonthlyPrice?: number;
  clientPortfolioSetupPrice?: number;
  badge?: string;
  recommended?: boolean;
  idealFor: string;
  sla: string;
  features: string[];
  messageQuota?: number;
}

export type PaymentFrequency = 'mensal' | 'semestral' | 'anual';

export type BillingModel = 'recorrente' | 'parcelamento' | 'avulso' | 'misto';

export interface ClientPricingTierPlanPrices {
  monthlyPrice: number;
  setupPrice: number;
}

export interface ClientPricingTier {
  id: string;
  minClients: number;
  maxClients: number;
  label: string;
  plans: {
    essencial: ClientPricingTierPlanPrices;
    pro: ClientPricingTierPlanPrices;
    performance: ClientPricingTierPlanPrices;
    personalizado: ClientPricingTierPlanPrices;
  };
}

export interface DiagnosticPaymentMethods {
  pix: boolean;
  pixFee: number; // R$ por pix ou %
  pixFeeType?: 'fixed' | 'percent';
  boleto: boolean;
  boletoFee: number; // R$ por boleto liquidado
  creditCard: boolean;
  creditCardFee?: number; // % taxa média cartão de crédito
  debitCard: boolean;
  debitCardFee?: number; // % taxa média cartão de débito
}

export interface DiagnosticSheetData {
  companyName: string;
  segment: string;
  monthlyRevenue: number;
  clientCount: number;
  delinquentClientCount: number;
  delinquencyInputMode?: 'count' | 'percent';
  delinquencyInputPercent?: number;
  newClientsPerMonth: number;
  churnClientsPerMonth: number;
  issuesNfse: 'sim' | 'nao' | 'manual';
  hasCommissionOrSplit: 'sim' | 'nao';
  billingModel: BillingModel;
  financialTeamSize: number; // 1 to 10 or 11 (+10)
  paymentMethods: DiagnosticPaymentMethods;
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

  setupPaymentMode?: SetupPaymentMode;
  setupCashPrice?: number;
  setupInstallmentTotal?: number;
  setupInstallmentsCount?: number;
  allowClientChooseSetupMode?: boolean;

  monthlyPrice: number;
  monthlyDiscountApplied: boolean;
  monthlyDiscountValue: number;
  monthlyDiscountReason?: string;
  monthlyTotal: number;

  hasPromptPaymentDiscount: boolean;
  promptPaymentDiscountPercent?: number;
  monthlyWithPromptDiscount: number;
  dueDay: number;
}

export interface ContractServiceItem {
  id: string;
  name: string;
  category: 'asaas' | 'regua-n8n' | 'consultoria' | 'custom';
  planId?: PlanId;
  reguaPortfolioType?: ReguaPortfolioType;
  setupPrice: number;
  monthlyPrice: number;
  description?: string;
  features?: string[];
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
  reguaPortfolioType?: ReguaPortfolioType;
  selectedServices?: ContractServiceItem[];
  contractDurationText?: string; // ex: 'Tempo Indeterminado (sem vencimento preestabelecido)'
  
  clientInfo: ClientInfo;
  diagnosticData?: DiagnosticSheetData;
  notes?: string;
  customFeatures?: string[];
  
  financials: ProposalFinancials;
  
  minimumContractMonths: number;
  startDate: string;

  signature: DigitalSignatureData;
  asaasBilling?: AsaasBillingResult;

  googleDriveLinks?: {
    proposalPdfUrl?: string;
    contractPdfUrl?: string;
    folderUrl?: string;
    folderId?: string;
    syncedAt?: string;
  };
  googleSheetSync?: {
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    syncedAt?: string;
  };
}

export type ActiveAppTab = 'simulador' | 'cliente_aceite' | 'admin';
