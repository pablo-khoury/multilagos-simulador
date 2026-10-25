import { CommercialProposal, ClientInfo, ReguaPortfolioType, SetupPaymentMode } from '../types';
import {
  getSetupBillingDetails,
  getEffectivePromptDiscountPercent,
  calculateMonthlyWithPromptDiscount,
  formatCleanPercent,
} from '../utils/calculator';
import JSZip from 'jszip';

export interface SavedContractRecord {
  id: string; // ex: PROP-2026-104
  contractMasterId: string; // ex: MSA-2026-104
  savedAt: string; // ISO String
  signedAt: string;
  companyName: string;
  cnpj: string;
  tradeName?: string;
  stateRegistration?: string;
  contactName: string;
  cpf: string;
  email: string;
  phone: string;
  role?: string;
  address?: string;

  // Financials & Asaas Billing Upload Details
  setupTotal: number;
  setupPaymentMode?: SetupPaymentMode;
  setupCashPrice?: number;
  setupInstallmentTotal?: number;
  setupInstallmentsCount?: number;
  setupInstallmentValue?: number;
  setupConditionSummary?: string;
  monthlyTotal: number;
  dueDay?: number;
  hasPromptPaymentDiscount?: boolean;
  promptPaymentDiscountPercent?: number;
  monthlyWithPromptDiscount?: number;
  reguaPortfolioType?: ReguaPortfolioType;
  planId: string;
  serviceTrack: string;
  contractDurationText: string;

  // Verification & Signature
  verificationHash: string;
  signerIp: string;
  signatureType: 'draw' | 'type';
  signatureDataString?: string;

  // Full proposal payload
  proposal: CommercialProposal;

  // PDF presence flags
  hasProposalPdf: boolean;
  hasContractPdf: boolean;

  // Google Sync state
  syncedToGoogle: boolean;
  googleDriveLinks?: {
    proposalPdfUrl?: string;
    contractPdfUrl?: string;
  };
  googleSheetSync?: {
    spreadsheetUrl?: string;
  };
}

const STORAGE_KEY_RECORDS = 'multilagos_signed_contracts_history';
const STORAGE_KEY_DRAFT = 'multilagos_client_form_draft';
const DB_NAME = 'multilagos_contracts_db';
const DB_VERSION = 1;
const STORE_NAME = 'contract_pdfs';

// Helper to open IndexedDB for robust large PDF storage (hundreds of megabytes)
const openPdfDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB não suportado'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result as IDBDatabase;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result as IDBDatabase);
    };

    request.onerror = (event: any) => {
      reject(event.target.error);
    };
  });
};

/**
 * Stores a PDF blob into IndexedDB
 */
export const storePdfBlobInDb = async (key: string, blob: Blob): Promise<boolean> => {
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({ key, blob, updatedAt: Date.now() });

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('[Contract Archive] Falha ao gravar PDF no IndexedDB:', err);
    return false;
  }
};

/**
 * Retrieves a PDF blob from IndexedDB
 */
export const getPdfBlobFromDb = async (key: string): Promise<Blob | null> => {
  try {
    const db = await openPdfDatabase();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve(req.result.blob as Blob);
        } else {
          resolve(null);
        }
      };

      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[Contract Archive] Falha ao recuperar PDF do IndexedDB:', err);
    return null;
  }
};

/**
 * Deletes stored PDF blobs for a given proposal ID from IndexedDB
 */
export const deletePdfBlobsFromDb = async (proposalId: string): Promise<void> => {
  try {
    const db = await openPdfDatabase();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(`proposal_${proposalId}`);
    store.delete(`contract_${proposalId}`);
  } catch {}
};

/**
 * Returns all saved contract records from localStorage
 */
export const getContractHistory = (): SavedContractRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[Contract Archive] Erro ao ler histórico:', e);
    return [];
  }
};

/**
 * Saves a signed proposal to the persistent history and stores the generated PDFs
 */
export const saveContractToHistory = async (
  proposal: CommercialProposal,
  proposalBlob?: Blob,
  contractBlob?: Blob
): Promise<SavedContractRecord> => {
  const current = getContractHistory();
  const existingIdx = current.findIndex((r) => r.id === proposal.id);

  let hasProp = false;
  let hasMsa = false;

  if (proposalBlob) {
    hasProp = await storePdfBlobInDb(`proposal_${proposal.id}`, proposalBlob);
  }
  if (contractBlob) {
    hasMsa = await storePdfBlobInDb(`contract_${proposal.id}`, contractBlob);
  }

  const setupDetails = getSetupBillingDetails(proposal.financials);
  const promptPct = getEffectivePromptDiscountPercent(proposal.financials);
  const hasPrompt = proposal.financials.hasPromptPaymentDiscount !== false && promptPct > 0;
  const monthlyPromptVal =
    typeof proposal.financials.monthlyWithPromptDiscount === 'number' && hasPrompt
      ? proposal.financials.monthlyWithPromptDiscount
      : calculateMonthlyWithPromptDiscount(proposal.financials.monthlyTotal, hasPrompt, promptPct);

  const reguaServ = proposal.selectedServices?.find((s) => s.category === 'regua-n8n');
  const resolvedPortfolio = reguaServ?.reguaPortfolioType || proposal.reguaPortfolioType;

  const record: SavedContractRecord = {
    id: proposal.id,
    contractMasterId: proposal.contractMasterId || `MSA-2026-${proposal.id.split('-').pop() || '001'}`,
    savedAt: new Date().toISOString(),
    signedAt: proposal.signature?.signedAt || new Date().toLocaleString('pt-BR'),
    companyName: proposal.clientInfo.companyName,
    cnpj: proposal.clientInfo.cnpj,
    tradeName: proposal.clientInfo.tradeName,
    stateRegistration: proposal.clientInfo.stateRegistration,
    contactName: proposal.clientInfo.contactName,
    cpf: proposal.clientInfo.cpf,
    email: proposal.clientInfo.email,
    phone: proposal.clientInfo.phone,
    role: proposal.clientInfo.contactRole,
    address: proposal.clientInfo.address,

    setupTotal: setupDetails.contractedTotal,
    setupPaymentMode: setupDetails.mode,
    setupCashPrice: setupDetails.cashPrice,
    setupInstallmentTotal: setupDetails.installmentTotal,
    setupInstallmentsCount: setupDetails.installmentsCount,
    setupInstallmentValue: setupDetails.installmentValue,
    setupConditionSummary: setupDetails.shortSummary,
    monthlyTotal: proposal.financials.monthlyTotal,
    dueDay: proposal.financials.dueDay || 10,
    hasPromptPaymentDiscount: hasPrompt,
    promptPaymentDiscountPercent: promptPct,
    monthlyWithPromptDiscount: monthlyPromptVal,
    reguaPortfolioType: resolvedPortfolio,
    planId: proposal.planId,
    serviceTrack: proposal.serviceTrack,
    contractDurationText: proposal.contractDurationText || 'Tempo Indeterminado',

    verificationHash: proposal.signature?.verificationHash || 'ML-AUTH-LOCAL',
    signerIp: proposal.signature?.signerIp || '187.122.45.109 (Verificado)',
    signatureType: proposal.signature?.signatureType || 'draw',
    signatureDataString: proposal.signature?.signatureDataString,

    proposal,
    hasProposalPdf: hasProp || (existingIdx >= 0 ? current[existingIdx].hasProposalPdf : false),
    hasContractPdf: hasMsa || (existingIdx >= 0 ? current[existingIdx].hasContractPdf : false),

    syncedToGoogle: !!(proposal.googleDriveLinks?.proposalPdfUrl || proposal.googleSheetSync?.spreadsheetUrl),
    googleDriveLinks: proposal.googleDriveLinks,
    googleSheetSync: proposal.googleSheetSync,
  };

  let updatedList: SavedContractRecord[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = record;
  } else {
    // Prepend so the newest is at the top
    updatedList = [record, ...current];
  }

  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(updatedList));
  } catch (err) {
    console.warn('[Contract Archive] Erro ao persistir lista no localStorage:', err);
  }

  // Clear draft once signed
  clearClientFormDraft();

  return record;
};

/**
 * Downloads a stored PDF blob directly from IndexedDB
 */
export const downloadStoredContractPdf = async (
  record: SavedContractRecord,
  type: 'proposal' | 'contract'
): Promise<boolean> => {
  try {
    const key = type === 'proposal' ? `proposal_${record.id}` : `contract_${record.id}`;
    const blob = await getPdfBlobFromDb(key);

    const filename =
      type === 'proposal'
        ? `Proposta_Comercial_${record.id}_${record.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
        : `Contrato_Mestre_${record.contractMasterId}_${record.companyName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    if (blob) {
      triggerBlobDownload(blob, filename);
      return true;
    }

    console.warn(`[Contract Archive] PDF blob não encontrado no IndexedDB para ${key}`);
    return false;
  } catch (e) {
    console.error('[Contract Archive] Erro ao baixar PDF armazenado:', e);
    return false;
  }
};

/**
 * Downloads both PDFs and data manifest packaged in a clean ZIP for a single contract
 */
export const downloadContractPackageZip = async (record: SavedContractRecord): Promise<void> => {
  const zip = new JSZip();
  const folderName = `${record.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${record.id}`;
  const folder = zip.folder(folderName) || zip;

  // Add Manifest JSON with all details
  const manifest = {
    ...record,
    exportTimestamp: new Date().toISOString(),
    system: 'Multilagos Negócios & Tecnologia - Simulador Comercial Oficial',
  };
  folder.file('dados_aceite_cliente.json', JSON.stringify(manifest, null, 2));

  // Try to retrieve PDFs from IndexedDB
  const propBlob = await getPdfBlobFromDb(`proposal_${record.id}`);
  if (propBlob) {
    folder.file(`Proposta_Comercial_${record.id}.pdf`, propBlob);
  }

  const contractBlob = await getPdfBlobFromDb(`contract_${record.id}`);
  if (contractBlob) {
    folder.file(`Contrato_Mestre_${record.contractMasterId}.pdf`, contractBlob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(content, `${folderName}_Pacote_Completo.zip`);
};

/**
 * Downloads ALL signed contracts in a single master ZIP file
 */
export const downloadAllContractsMasterZip = async (): Promise<boolean> => {
  const records = getContractHistory();
  if (records.length === 0) return false;

  const zip = new JSZip();
  const root = zip.folder('Multilagos_Todos_Contratos_Assinados') || zip;

  // Add full master manifest JSON and CSV
  root.file('manifesto_geral_contratos.json', JSON.stringify(records, null, 2));
  root.file('relatorio_aceites_multilagos.csv', exportHistoryToCsvString(records));

  // Add each contract folder with its files
  for (const record of records) {
    const safeName = `${record.companyName.replace(/[^a-zA-Z0-9]/g, '_')}_${record.id}`;
    const subfolder = root.folder(safeName);
    if (!subfolder) continue;

    subfolder.file('resumo_cliente.json', JSON.stringify(record, null, 2));

    const propBlob = await getPdfBlobFromDb(`proposal_${record.id}`);
    if (propBlob) {
      subfolder.file(`Proposta_Comercial_${record.id}.pdf`, propBlob);
    }

    const contractBlob = await getPdfBlobFromDb(`contract_${record.id}`);
    if (contractBlob) {
      subfolder.file(`Contrato_Mestre_${record.contractMasterId}.pdf`, contractBlob);
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  triggerBlobDownload(content, `Multilagos_Contratos_Assinados_${new Date().toISOString().split('T')[0]}.zip`);
  return true;
};

/**
 * Exports history to CSV with UTF-8 BOM for immediate opening in Microsoft Excel or Google Sheets
 */
export const exportHistoryToCsvString = (records?: SavedContractRecord[]): string => {
  const list = records || getContractHistory();
  const headers = [
    'ID Proposta',
    'ID Contrato Mestre',
    'Data/Hora Aceite',
    'Razao Social',
    'Nome Fantasia',
    'CNPJ',
    'Inscricao Estadual',
    'Representante Legal',
    'CPF',
    'Email',
    'Telefone',
    'Cargo',
    'Endereco',
    'Plano Contratado',
    'Esteira de Servicos',
    'Portfolio Regua WhatsApp',
    'Duracao do Contrato',
    'Modalidade Setup',
    'Setup a Vista (R$)',
    'Setup Parcelado Total (R$)',
    'Qtd Parcelas Setup',
    'Valor Parcela Setup (R$)',
    'Valor Setup Contratado (R$)',
    'Dia Vencimento Mensal',
    'Valor Mensalidade (R$)',
    '% Desc. ate Dia 05',
    'Mensalidade ate Dia 05 (R$)',
    'Hash Verificacao Digital',
    'IP do Signatario',
    'Tipo de Assinatura',
    'Sincronizado Google Drive',
  ];

  const rows = list.map((r) => {
    const fin = r.proposal?.financials;
    const setupDet = fin ? getSetupBillingDetails(fin) : null;
    const mode = r.setupPaymentMode || setupDet?.mode || 'cash';
    const cashVal = r.setupCashPrice ?? setupDet?.cashPrice ?? r.setupTotal;
    const instTotal = r.setupInstallmentTotal ?? setupDet?.installmentTotal ?? r.setupTotal;
    const instCount = r.setupInstallmentsCount ?? setupDet?.installmentsCount ?? 1;
    const instVal = r.setupInstallmentValue ?? setupDet?.installmentValue ?? r.setupTotal;
    const dueDay = r.dueDay ?? fin?.dueDay ?? 10;
    const pct = r.promptPaymentDiscountPercent ?? (fin ? getEffectivePromptDiscountPercent(fin) : 5);
    const hasPrompt = r.hasPromptPaymentDiscount ?? (fin ? fin.hasPromptPaymentDiscount !== false && pct > 0 : true);
    const promptVal =
      r.monthlyWithPromptDiscount ??
      calculateMonthlyWithPromptDiscount(r.monthlyTotal, hasPrompt, pct);
    const hasRegua =
      r.serviceTrack === 'esteira-regua-n8n' ||
      r.proposal?.selectedServices?.some((s) => s.category === 'regua-n8n');
    const portfolioLabel = hasRegua
      ? (r.reguaPortfolioType || r.proposal?.reguaPortfolioType) === 'client'
        ? 'Portfolio do Cliente (Meta Direta)'
        : 'Portfolio Multilagos (Meta Inclusa)'
      : 'N/A';

    return [
      `"${r.id}"`,
      `"${r.contractMasterId}"`,
      `"${r.signedAt}"`,
      `"${r.companyName.replace(/"/g, '""')}"`,
      `"${(r.tradeName || '').replace(/"/g, '""')}"`,
      `"${r.cnpj}"`,
      `"${r.stateRegistration || ''}"`,
      `"${r.contactName.replace(/"/g, '""')}"`,
      `"${r.cpf}"`,
      `"${r.email}"`,
      `"${r.phone}"`,
      `"${(r.role || '').replace(/"/g, '""')}"`,
      `"${(r.address || '').replace(/"/g, '""')}"`,
      `"${r.planId}"`,
      `"${r.serviceTrack}"`,
      `"${portfolioLabel}"`,
      `"${r.contractDurationText}"`,
      `"${mode === 'installments' ? `Parcelado (${instCount}x)` : 'A Vista'}"`,
      `"${cashVal.toFixed(2).replace('.', ',')}"`,
      `"${instTotal.toFixed(2).replace('.', ',')}"`,
      `"${mode === 'installments' ? instCount : 1}"`,
      `"${(mode === 'installments' ? instVal : cashVal).toFixed(2).replace('.', ',')}"`,
      `"${r.setupTotal.toFixed(2).replace('.', ',')}"`,
      `"Dia ${String(dueDay).padStart(2, '0')}"`,
      `"${r.monthlyTotal.toFixed(2).replace('.', ',')}"`,
      `"${hasPrompt ? `${formatCleanPercent(pct)}%` : '0%'}"`,
      `"${promptVal.toFixed(2).replace('.', ',')}"`,
      `"${r.verificationHash}"`,
      `"${r.signerIp}"`,
      `"${r.signatureType === 'draw' ? 'Desenho na Tela' : 'Digitada'}"`,
      `"${r.syncedToGoogle ? 'Sim' : 'Pendente'}"`,
    ];
  });

  const csvContent = [headers.join(';'), ...rows.map((row) => row.join(';'))].join('\r\n');
  // UTF-8 BOM so Excel opens accents cleanly
  return '\uFEFF' + csvContent;
};

export const downloadHistoryCsv = (): void => {
  const csv = exportHistoryToCsvString();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerBlobDownload(blob, `Multilagos_Relatorio_Contratos_${new Date().toISOString().split('T')[0]}.csv`);
};

export const downloadHistoryJson = (): void => {
  const records = getContractHistory();
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  triggerBlobDownload(blob, `Multilagos_Contratos_Backup_${new Date().toISOString().split('T')[0]}.json`);
};

export const deleteContractRecord = async (id: string): Promise<void> => {
  const current = getContractHistory();
  const filtered = current.filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(filtered));
  } catch {}
  await deletePdfBlobsFromDb(id);
};

export const clearAllContractHistory = async (): Promise<void> => {
  try {
    localStorage.removeItem(STORAGE_KEY_RECORDS);
  } catch {}
};

// Client form draft auto-save
export const saveClientFormDraft = (info: Partial<ClientInfo>): void => {
  try {
    localStorage.setItem(STORAGE_KEY_DRAFT, JSON.stringify({ ...info, updatedAt: Date.now() }));
  } catch {}
};

export const getClientFormDraft = (): Partial<ClientInfo> | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DRAFT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const clearClientFormDraft = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY_DRAFT);
  } catch {}
};

// Internal Blob download helper (avoids window.open / alert)
function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.setAttribute('download', filename);
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 10000);
}
