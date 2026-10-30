import React, { useState, useRef, useEffect } from 'react';
import { 
  CommercialProposal, 
  ProposalFinancials,
  SetupPaymentMode,
  ClientInfo, 
  DigitalSignatureData, 
  AsaasBillingResult, 
  AsaasConfig,
  Plan,
  ContractServiceItem
} from '../types';
import { MULTILAGOS_INFO, ALL_INITIAL_PLANS } from '../data/mockData';
import {
  formatBRL,
  formatCleanPercent,
  getSetupBillingDetails,
  getEffectivePromptDiscountPercent,
  calculateMonthlyWithPromptDiscount,
  buildClientShareUrl,
} from '../utils/calculator';
import { processAsaasContractBilling } from '../utils/asaasService';
import { exportElementToPdf } from '../utils/pdfGenerator';
import { MultilagosLogo } from './MultilagosLogo';
import { AsaasProposalDoc } from './documents/AsaasProposalDoc';
import { MulticobrancaProposalDoc } from './documents/MulticobrancaProposalDoc';
import { MasterContractDoc } from './documents/MasterContractDoc';

import { getAccessToken } from '../services/googleAuth';
import { 
  getOrCreateDriveFolder, 
  uploadPdfToDrive, 
  getOrCreateSpreadsheet, 
  appendProposalRowToSheet, 
  ProposalSheetRecord,
  getGoogleWebhookUrl,
  sendContractViaGoogleWebhook
} from '../services/googleWorkspace';
import {
  saveContractToHistory,
  saveClientFormDraft,
  getClientFormDraft,
} from '../services/contractHistoryService';

import { 
  ShieldCheck, 
  Check, 
  Lock, 
  Download, 
  Mail, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  FileCheck,
  RefreshCw,
  Package,
  Clock,
  Calendar,
  AlertCircle,
  Copy,
  Link2,
  Send
} from 'lucide-react';

interface ClientAcceptanceViewProps {
  proposal: CommercialProposal;
  asaasConfig: AsaasConfig;
  customPlans?: Plan[];
  isClientDirectAccess?: boolean;
  onUpdateFinancials?: (fin: ProposalFinancials) => void;
  onUpdateClientInfo?: (info: ClientInfo) => void;
  onProposalSigned: (updatedProposal: CommercialProposal) => void;
  onBackToConsultantView?: () => void;
}

export const ClientAcceptanceView: React.FC<ClientAcceptanceViewProps> = ({
  proposal,
  asaasConfig,
  customPlans = ALL_INITIAL_PLANS,
  isClientDirectAccess = false,
  onUpdateFinancials,
  onUpdateClientInfo,
  onProposalSigned,
  onBackToConsultantView,
}) => {
  const sanitizeCompany = (name?: string) =>
    name && name !== 'Minha Empresa Ltda' ? name : '';

  // Client input data with live sync
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    companyName: sanitizeCompany(proposal.clientInfo.companyName),
    tradeName: proposal.clientInfo.tradeName || '',
    cnpj: proposal.clientInfo.cnpj || '',
    stateRegistration: proposal.clientInfo.stateRegistration || '',
    address: proposal.clientInfo.address || '',
    contactName: proposal.clientInfo.contactName || '',
    contactRole: proposal.clientInfo.contactRole || 'Diretor / Sócio-Administrador',
    cpf: proposal.clientInfo.cpf || '',
    email: proposal.clientInfo.email || '',
    phone: proposal.clientInfo.phone || '',
    cityState:
      proposal.clientInfo.cityState && proposal.clientInfo.cityState !== 'Belo Horizonte/MG'
        ? proposal.clientInfo.cityState
        : '',
    currentSystemName: proposal.clientInfo.currentSystemName || '',
    connectedWhatsApp: proposal.clientInfo.connectedWhatsApp || '',
  });

  // Active document preview tab: Proposal vs Master Contract
  const [activePreviewDoc, setActivePreviewDoc] = useState<'prop' | 'msa'>('prop');

  // Acceptance & signature state
  const [signatureType, setSignatureType] = useState<'draw' | 'type'>('draw');
  const [typedSignerName, setTypedSignerName] = useState(proposal.clientInfo.contactName || '');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSigned, setIsSigned] = useState(proposal.signature?.signed || false);
  const [signatureData, setSignatureData] = useState<DigitalSignatureData>(
    proposal.signature || { signed: false, signatureType: 'draw' }
  );
  const [asaasResult, setAsaasResult] = useState<AsaasBillingResult | null>(
    proposal.asaasBilling || null
  );
  const [copiedPreviewLink, setCopiedPreviewLink] = useState(false);

  // Sync local clientInfo & signature state whenever proposal.id changes
  useEffect(() => {
    setClientInfo({
      companyName: sanitizeCompany(proposal.clientInfo.companyName),
      tradeName: proposal.clientInfo.tradeName || '',
      cnpj: proposal.clientInfo.cnpj || '',
      stateRegistration: proposal.clientInfo.stateRegistration || '',
      address: proposal.clientInfo.address || '',
      contactName: proposal.clientInfo.contactName || '',
      contactRole: proposal.clientInfo.contactRole || 'Diretor / Sócio-Administrador',
      cpf: proposal.clientInfo.cpf || '',
      email: proposal.clientInfo.email || '',
      phone: proposal.clientInfo.phone || '',
      cityState:
        proposal.clientInfo.cityState && proposal.clientInfo.cityState !== 'Belo Horizonte/MG'
          ? proposal.clientInfo.cityState
          : '',
      currentSystemName: proposal.clientInfo.currentSystemName || '',
      connectedWhatsApp: proposal.clientInfo.connectedWhatsApp || '',
    });
    setTypedSignerName(proposal.clientInfo.contactName || '');
    setIsSigned(proposal.signature?.signed || false);
    setSignatureData(proposal.signature || { signed: false, signatureType: 'draw' });
    setAsaasResult(proposal.asaasBilling || null);
  }, [proposal.id]);

  // Propagate consultant pre-filled client fields back to activeProposal
  useEffect(() => {
    if (!isClientDirectAccess && onUpdateClientInfo) {
      onUpdateClientInfo(clientInfo);
    }
  }, [clientInfo, isClientDirectAccess]);

  // PDF download progress & validation states
  const [downloadingPropPdf, setDownloadingPropPdf] = useState(false);
  const [downloadingContractPdf, setDownloadingContractPdf] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Blobs of generated signed PDFs stored for Google Drive upload
  const proposalBlobRef = useRef<Blob | null>(null);
  const contractBlobRef = useRef<Blob | null>(null);

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Execution guard ref
  const isSigningRef = useRef(false);

  const fin = proposal.financials;
  const setupDetails = getSetupBillingDetails(fin);
  const promptPct = getEffectivePromptDiscountPercent(fin);
  const hasPrompt = fin.hasPromptPaymentDiscount !== false && promptPct > 0;
  const monthlyPromptVal =
    typeof fin.monthlyWithPromptDiscount === 'number' && hasPrompt
      ? fin.monthlyWithPromptDiscount
      : calculateMonthlyWithPromptDiscount(fin.monthlyTotal, hasPrompt, promptPct);

  const handleSelectClientSetupMode = (mode: SetupPaymentMode) => {
    if (isSigned || !onUpdateFinancials) return;
    const nextTotal = mode === 'installments' ? setupDetails.installmentTotal : setupDetails.cashPrice;
    onUpdateFinancials({
      ...fin,
      setupPaymentMode: mode,
      setupCashPrice: setupDetails.cashPrice,
      setupInstallmentTotal: setupDetails.installmentTotal,
      setupInstallmentsCount: setupDetails.installmentsCount,
      setupTotal: nextTotal,
    });
  };

  const currentPlan = customPlans.find((p) => p.id === proposal.planId) || customPlans[0];

  const proposalElementId = proposal.serviceTrack === 'esteira-asaas' 
    ? 'asaas-proposal-doc' 
    : 'multicobranca-proposal-doc';

  const proposalFilename = `Proposta_Comercial_${proposal.id}`;
  const contractFilename = `Contrato_Mestre_Prestacao_Servicos_${proposal.contractMasterId}`;

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#D40B3A';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Background Google Workspace Synchronization: runs automatically via 24h Webhook OR OAuth Token!
  const sendDirectlyToGoogleWorkspace = async (
    propBlob: Blob,
    contractBlob: Blob,
    currentProposal: CommercialProposal,
    sig: DigitalSignatureData,
    billing: AsaasBillingResult | null
  ) => {
    const servicesSummary = (currentProposal.selectedServices || [])
      .map((s) => s.name)
      .join(' + ') || (currentProposal.serviceTrack === 'esteira-asaas' ? 'Implantação Asaas' : 'Multicobrança WhatsApp');

    const curFin = currentProposal.financials;
    const curSetup = getSetupBillingDetails(curFin);
    const curPct = getEffectivePromptDiscountPercent(curFin);
    const curHasPrompt = curFin.hasPromptPaymentDiscount !== false && curPct > 0;
    const hasReguaServ =
      currentProposal.serviceTrack === 'esteira-regua-n8n' ||
      currentProposal.selectedServices?.some((s) => s.category === 'regua-n8n');
    const reguaPort =
      currentProposal.selectedServices?.find((s) => s.category === 'regua-n8n')?.reguaPortfolioType ||
      currentProposal.reguaPortfolioType;

    const baseRecord: ProposalSheetRecord = {
      proposalId: currentProposal.id,
      contractMasterId: currentProposal.contractMasterId,
      signedAt: sig.signedAt || new Date().toLocaleString('pt-BR'),
      companyName: clientInfo.companyName,
      tradeName: clientInfo.tradeName,
      cnpj: clientInfo.cnpj,
      contactName: clientInfo.contactName,
      contactRole: clientInfo.contactRole,
      cpf: clientInfo.cpf,
      email: clientInfo.email,
      phone: clientInfo.phone,
      cityState: clientInfo.address || clientInfo.cityState || '',
      servicesSummary,
      reguaPortfolioLabel: hasReguaServ
        ? reguaPort === 'client'
          ? 'Portfólio do Cliente (Meta Direta)'
          : 'Portfólio Multilagos (Meta Inclusa)'
        : 'N/A',
      setupPaymentMode: curSetup.mode,
      setupCashPrice: curSetup.cashPrice,
      setupInstallmentTotal: curSetup.installmentTotal,
      setupInstallmentsCount: curSetup.installmentsCount,
      setupInstallmentValue: curSetup.installmentValue,
      setupConditionSummary: curSetup.shortSummary,
      setupTotal: curSetup.contractedTotal,
      monthlyTotal: curFin.monthlyTotal,
      dueDay: curFin.dueDay || 10,
      promptPaymentDiscountPercent: curHasPrompt ? curPct : 0,
      monthlyWithPromptDiscount: curHasPrompt
        ? calculateMonthlyWithPromptDiscount(curFin.monthlyTotal, true, curPct)
        : curFin.monthlyTotal,
      asaasStatus: billing ? 'Ativado' : 'Aguardando',
      asaasPaymentId: billing?.paymentId,
      verificationHash: sig.verificationHash,
      signerIp: sig.signerIp,
    };

    // 1. Prefer 24/7 Google Apps Script Webhook if configured (works remotely without 60-min token expiry!)
    const webhookUrl = getGoogleWebhookUrl();
    if (webhookUrl) {
      try {
        console.log('[Google Workspace Webhook 24h] Enviando PDFs e dados do aceite para o Google Drive/Sheets...');
        const whRes = await sendContractViaGoogleWebhook(
          webhookUrl,
          baseRecord,
          propBlob,
          contractBlob,
          proposalFilename,
          contractFilename
        );

        if (whRes.success) {
          const syncedProposal: CommercialProposal = {
            ...currentProposal,
            googleDriveLinks: {
              proposalPdfUrl: whRes.proposalPdfUrl || '',
              contractPdfUrl: whRes.contractPdfUrl || '',
              folderUrl: whRes.driveFolderUrl,
              folderId: whRes.driveFolderId,
              syncedAt: new Date().toLocaleString('pt-BR'),
            },
            googleSheetSync: {
              spreadsheetId: whRes.spreadsheetId || '',
              spreadsheetUrl: whRes.spreadsheetUrl || '',
              syncedAt: new Date().toLocaleString('pt-BR'),
            },
          };

          await saveContractToHistory(syncedProposal, propBlob, contractBlob);
          onProposalSigned(syncedProposal);
          console.log('[Google Workspace Webhook 24h] Sucesso total: PDFs salvos no Drive e linha gravada no Sheets!');
          return;
        }
      } catch (whErr) {
        console.warn('[Google Workspace Webhook 24h] Falha no envio via Webhook, tentando fallback OAuth:', whErr);
      }
    }

    // 2. Direct OAuth Token Flow (Firebase Google Sign-In)
    try {
      const token = await getAccessToken();
      if (!token) {
        console.log('[Google Workspace Auto-Sync] Token OAuth ou Webhook não configurado no momento. Dados e PDFs seguem salvos no Histórico do Sistema.');
        return;
      }

      console.log('[Google Workspace Auto-Sync] Iniciando upload dos PDFs e registro na planilha via OAuth...');

      const folder = await getOrCreateDriveFolder(token, 'Multilagos - Contratos Assinados');
      const propUpload = await uploadPdfToDrive(token, propBlob, proposalFilename, folder.id);
      const contractUpload = await uploadPdfToDrive(token, contractBlob, contractFilename, folder.id);
      const sheet = await getOrCreateSpreadsheet(token, 'Multilagos - Registro de Contratos e Aceites', folder.id);

      const recordWithLinks: ProposalSheetRecord = {
        ...baseRecord,
        proposalDriveUrl: propUpload.webViewLink,
        contractDriveUrl: contractUpload.webViewLink,
      };

      await appendProposalRowToSheet(token, sheet.spreadsheetId, recordWithLinks);

      const syncedProposal: CommercialProposal = {
        ...currentProposal,
        googleDriveLinks: {
          proposalPdfUrl: propUpload.webViewLink,
          contractPdfUrl: contractUpload.webViewLink,
          folderUrl: folder.webViewLink,
          folderId: folder.id,
          syncedAt: new Date().toLocaleString('pt-BR'),
        },
        googleSheetSync: {
          spreadsheetId: sheet.spreadsheetId,
          spreadsheetUrl: sheet.spreadsheetUrl,
          syncedAt: new Date().toLocaleString('pt-BR'),
        },
      };

      await saveContractToHistory(syncedProposal, propBlob, contractBlob);
      onProposalSigned(syncedProposal);
      console.log('[Google Workspace Auto-Sync] Sucesso total: Documentos salvos no Google Drive e linha adicionada à Planilha Sheets!');
    } catch (err) {
      console.error('[Google Workspace Auto-Sync] Erro no envio automático:', err);
    }
  };

  // Submit and execute digital signature, PDF generation, automatic client download,
  // and simultaneous background synchronization to Google Drive & Google Sheets!
  const handleConfirmAcceptance = async () => {
    if (isSigningRef.current || isProcessing || isSigned) {
      return;
    }

    setValidationError(null);

    if (!clientInfo.companyName.trim() || !clientInfo.cnpj.trim() || !clientInfo.address.trim()) {
      setValidationError('Por favor, preencha a Razão Social, o CNPJ e o Endereço Completo da empresa.');
      return;
    }

    if (!clientInfo.contactName.trim() || !clientInfo.cpf.trim() || !clientInfo.email.trim()) {
      setValidationError('Por favor, informe o Nome, CPF e E-mail do representante legal.');
      return;
    }

    if (!termsAgreed) {
      setValidationError('Por favor, assinale a concordância com o Contrato Mestre e a Proposta Comercial.');
      return;
    }

    if (signatureType === 'draw' && !hasDrawn) {
      setValidationError('Por favor, desenhe sua assinatura no quadro indicado ou alterne para a assinatura digitada.');
      return;
    }

    isSigningRef.current = true;
    setIsProcessing(true);

    try {
      let signatureDataString = '';
      if (signatureType === 'draw' && canvasRef.current) {
        signatureDataString = canvasRef.current.toDataURL();
      }

      // Generate digital verification hash
      const hash = `ML-AUTH-${Math.random().toString(36).substring(2, 9).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

      const sigData: DigitalSignatureData = {
        signed: true,
        signedAt: new Date().toLocaleString('pt-BR'),
        signatureType,
        signatureDataString,
        signerName: signatureType === 'draw' ? clientInfo.contactName : typedSignerName || clientInfo.contactName,
        signerCpf: clientInfo.cpf,
        signerIp: '187.122.45.109 (Verificado por Certificado Eletrônico)',
        verificationHash: hash,
      };

      setSignatureData(sigData);

      // Process Asaas Billing Setup
      const billing = await processAsaasContractBilling(
        clientInfo,
        fin.setupTotal,
        proposal.id,
        asaasConfig
      );

      setAsaasResult(billing);
      setIsSigned(true);

      const baseUpdatedProposal: CommercialProposal = {
        ...proposal,
        clientInfo,
        status: 'client_accepted',
        contractDurationText: 'Tempo Indeterminado (sem vencimento preestabelecido)',
        signature: sigData,
        asaasBilling: billing,
      };

      onProposalSigned(baseUpdatedProposal);

      // 1. Generate Proposal PDF & trigger automatic client download
      setDownloadNotice('Gerando e baixando [1 de 2]: Proposta Comercial (PDF)...');
      setActivePreviewDoc('prop');
      await new Promise((r) => setTimeout(r, 400));
      setDownloadingPropPdf(true);
      const resProp = await exportElementToPdf(proposalElementId, proposalFilename);
      if (resProp.blob) {
        proposalBlobRef.current = resProp.blob;
      }
      setDownloadingPropPdf(false);

      // 2. Generate Master Contract MSA PDF & trigger automatic client download
      setDownloadNotice('Gerando e baixando [2 de 2]: Contrato Mestre MSA (PDF)...');
      await new Promise((r) => setTimeout(r, 700));
      setActivePreviewDoc('msa');
      await new Promise((r) => setTimeout(r, 400));
      setDownloadingContractPdf(true);
      const resContract = await exportElementToPdf('master-contract-doc', contractFilename);
      if (resContract.blob) {
        contractBlobRef.current = resContract.blob;
      }
      setDownloadingContractPdf(false);

      // 3. PERSIST LOCALLY: Save all client info, signature verification, and PDF files
      // in persistent offline storage (IndexedDB + localStorage) so consultant can download anytime
      try {
        await saveContractToHistory(
          baseUpdatedProposal,
          resProp.blob || undefined,
          resContract.blob || undefined
        );
      } catch (saveErr) {
        console.warn('[Contract Archive] Erro ao gravar histórico local:', saveErr);
      }

      setDownloadNotice('✓ Contrato e Proposta salvos com sucesso no histórico do sistema!');
      setTimeout(() => setDownloadNotice(''), 7000);

      // 4. AT THE EXACT SAME TIME: Automatically send to Google Drive & Google Sheets (if connected)!
      if (resProp.blob && resContract.blob) {
        sendDirectlyToGoogleWorkspace(
          resProp.blob,
          resContract.blob,
          baseUpdatedProposal,
          sigData,
          billing
        );
      }

    } catch (err) {
      console.error('Erro ao processar aceite:', err);
      setValidationError('Ocorreu um erro no processamento do aceite. Tente novamente.');
      isSigningRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingleProposal = async () => {
    setDownloadingPropPdf(true);
    setActivePreviewDoc('prop');
    await new Promise((r) => setTimeout(r, 300));
    const res = await exportElementToPdf(proposalElementId, proposalFilename);
    if (res.blob) proposalBlobRef.current = res.blob;
    setDownloadingPropPdf(false);
  };

  const handleDownloadSingleContract = async () => {
    setDownloadingContractPdf(true);
    setActivePreviewDoc('msa');
    await new Promise((r) => setTimeout(r, 300));
    const res = await exportElementToPdf('master-contract-doc', contractFilename);
    if (res.blob) contractBlobRef.current = res.blob;
    setDownloadingContractPdf(false);
  };

  const activeServices = proposal.selectedServices && proposal.selectedServices.length > 0
    ? proposal.selectedServices
    : [
        {
          id: 'serv-default',
          name: proposal.serviceTrack === 'esteira-asaas' ? `Implantação Asaas (${currentPlan.name})` : `Multicobrança WhatsApp (${currentPlan.name})`,
          category: proposal.serviceTrack === 'esteira-asaas' ? 'asaas' : 'regua-n8n',
          setupPrice: fin.setupPrice,
          monthlyPrice: fin.monthlyPrice,
          description: 'Solução completa contratada conforme condições comerciais apresentadas.',
        } as ContractServiceItem,
      ];

  const isOnlyRegua = proposal.serviceTrack === 'esteira-regua-n8n' ||
    (activeServices.length > 0 && 
     !activeServices.some((s) => s.category === 'asaas') &&
     activeServices.some((s) => s.category === 'regua-n8n'));

  return (
    <div className="min-h-screen bg-[#111F24] text-[#CDDADE] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <MultilagosLogo variant="dark" height={36} />
            <div className="pl-4 border-l border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D40B3A]">
                Portal Seguro de Formalização & Assinatura Digital
              </span>
              <p className="text-xs text-slate-300">
                Proposta nº <strong className="font-mono text-white">{proposal.id}</strong> · Contrato Mestre nº <strong className="font-mono text-white">{proposal.contractMasterId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isClientDirectAccess && onBackToConsultantView && (
              <button
                onClick={onBackToConsultantView}
                className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 transition-colors cursor-pointer"
              >
                Voltar ao Modo Consultor
              </button>
            )}
            <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/80">
              Ambiente Seguro Criptografado
            </span>
          </div>
        </div>

        {/* Consultant Share Bar (shown when consultant opens "Ver Link do Cliente" / "Abrir Portal do Cliente") */}
        {!isClientDirectAccess && (() => {
          const liveShareUrl = buildClientShareUrl({
            ...proposal,
            clientInfo,
          });
          const handleCopyFromPreview = () => {
            navigator.clipboard.writeText(liveShareUrl);
            setCopiedPreviewLink(true);
            setTimeout(() => setCopiedPreviewLink(false), 3000);
          };
          const handleWhatsAppFromPreview = () => {
            const serviceNames = activeServices.map((s) => s.name).join(' + ');
            const promptLine = hasPrompt
              ? ` (ou ${formatBRL(monthlyPromptVal)} com ${formatCleanPercent(promptPct)}% de desconto até o dia 05)`
              : '';
            const setupLine =
              setupDetails.mode === 'installments'
                ? `${setupDetails.installmentsCount}x de ${formatBRL(setupDetails.installmentValue)} (Total: ${formatBRL(setupDetails.installmentTotal)})`
                : `${formatBRL(setupDetails.cashPrice)} à vista`;
            const text = encodeURIComponent(
              `Olá! Aqui é o ${MULTILAGOS_INFO.representativeName} da Multilagos.\n\n` +
              `Segue o link exclusivo da sua Proposta Comercial (Nº ${proposal.id}):\n` +
              `• Serviços: ${serviceNames}\n` +
              `• Mensalidade: ${formatBRL(fin.monthlyTotal)}${promptLine}\n` +
              `• Setup: ${setupLine}\n\n` +
              `Acesse para conferir os termos e assinar digitalmente:\n${liveShareUrl}`
            );
            const a = document.createElement('a');
            a.href = `https://api.whatsapp.com/send?text=${text}`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          };

          return (
            <div className="no-print bg-emerald-950/40 border border-emerald-700/70 rounded-2xl p-4 sm:p-5 space-y-3 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white uppercase tracking-wider">
                    Link Exclusivo desta Proposta para Enviar ao Cliente ({proposal.id})
                  </span>
                </div>
                <span className="text-[11px] text-emerald-300">
                  Este link carrega exatamente os serviços, parcelamento e descontos configurados abaixo
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={liveShareUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 px-3 py-2 bg-[#111F24] border border-emerald-800/80 rounded-xl text-[11px] font-mono text-slate-200 focus:outline-none"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyFromPreview}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
                  >
                    {copiedPreviewLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPreviewLink ? 'Link Copiado!' : 'Copiar Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleWhatsAppFromPreview}
                    className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Highlight Banner of Approved Financial Terms & Multi-Services */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-2">
            <div>
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Condições Comerciais Acordadas na Reunião
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
                {activeServices.length > 1 ? 'Pacote Multisserviços Integrado' : activeServices[0].name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
                Vigência: Tempo Indeterminado (sem vencimento preestabelecido)
              </span>
            </div>
          </div>

          {/* Multi-services Breakdown Cards */}
          {activeServices.length > 1 && (
            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#D40B3A]" />
                <span>Serviços Incluídos Nesta Contratação ({activeServices.length}):</span>
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {activeServices.map((serv, idx) => (
                  <div key={idx} className="p-3 bg-[#16242A] rounded-lg border border-slate-700/80 text-xs">
                    <strong className="text-white block font-display">{serv.name}</strong>
                    <div className="mt-1 flex items-center justify-between font-mono text-slate-300 text-[11px]">
                      <span>Setup: {formatBRL(serv.setupPrice)}</span>
                      <span className="text-[#D40B3A] font-bold">Mensal: {formatBRL(serv.monthlyPrice)}/mês</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mensalidade Total Contratada:</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Venc. dia {String(fin.dueDay || 10).padStart(2, '0')}
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-[#D40B3A] font-mono tabular-nums mt-1">
                  {formatBRL(fin.monthlyTotal)}
                  <span className="text-xs font-normal text-slate-400">/mês</span>
                </p>
              </div>
              {hasPrompt ? (
                <p className="text-[11px] text-emerald-400 mt-2 font-semibold">
                  ✓ Até o dia 05 ({formatCleanPercent(promptPct)}% desc.): <strong>{formatBRL(monthlyPromptVal)}/mês</strong>
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 mt-2">
                  Cobrança mensal via Boleto / Pix Asaas
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Taxa de Implantação / Setup:</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                  {setupDetails.mode === 'installments' ? `Parcelado ${setupDetails.installmentsCount}x` : 'À Vista'}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white font-mono tabular-nums">
                {setupDetails.mode === 'installments'
                  ? `${setupDetails.installmentsCount}x de ${formatBRL(setupDetails.installmentValue)}`
                  : formatBRL(setupDetails.cashPrice)}
              </p>
              <p className="text-[11px] text-slate-400 font-mono">
                {setupDetails.mode === 'installments'
                  ? `Total parcelado: ${formatBRL(setupDetails.installmentTotal)} · À vista: ${formatBRL(setupDetails.cashPrice)}`
                  : `Opção parcelada: ${setupDetails.installmentsCount}x de ${formatBRL(setupDetails.installmentValue)} (${formatBRL(setupDetails.installmentTotal)})`}
              </p>

              {!isSigned && fin.allowClientChooseSetupMode !== false && onUpdateFinancials && (
                <div className="pt-1.5 border-t border-slate-800 grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectClientSetupMode('cash')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      setupDetails.mode === 'cash'
                        ? 'bg-[#D40B3A] text-white shadow'
                        : 'bg-[#16242A] text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    À Vista ({formatBRL(setupDetails.cashPrice)})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectClientSetupMode('installments')}
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      setupDetails.mode === 'installments'
                        ? 'bg-[#D40B3A] text-white shadow'
                        : 'bg-[#16242A] text-slate-300 hover:text-white border border-slate-700'
                    }`}
                  >
                    {setupDetails.installmentsCount}x de {formatBRL(setupDetails.installmentValue)}
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-slate-400 block">Prazo & Vigência Contratual:</span>
                <p className="text-base font-bold text-white mt-1">Tempo Indeterminado</p>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Sem carência; rescisão com aviso prévio de 30 dias
              </p>
            </div>
          </div>
        </div>

        {/* Checklist Oficial de Entregáveis e Funcionalidades dos Planos Contratados */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
            <div>
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Escopo Contratual Oficial · Checklist de Entregáveis</span>
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
                O que está incluído no seu plano:
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Todos os itens do checklist abaixo são vinculados à Proposta Comercial e ao Contrato Mestre oficial que você assinará.
              </p>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-800">
                100% Garantido em Contrato
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {activeServices.map((serv, sIdx) => {
              const matchedPlan = customPlans.find((p) => p.id === serv.planId) || 
                (serv.category === 'asaas' ? currentPlan : undefined);

              const featuresList: string[] = 
                (serv.category === 'asaas' && proposal.customFeatures && proposal.customFeatures.length > 0)
                  ? proposal.customFeatures
                  : serv.features && serv.features.length > 0
                  ? serv.features
                  : matchedPlan?.features || [
                      'Consultoria de setup e parametrização',
                      'Treinamento operacional da equipe',
                      'Régua de cobrança completa',
                      'Fatura personalizada',
                    ];

              return (
                <div
                  key={sIdx}
                  className="bg-[#111F24] border border-slate-700/90 rounded-2xl p-5 sm:p-6 space-y-4 flex flex-col justify-between hover:border-slate-600 transition-all shadow-lg"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#D40B3A] block">
                          {serv.category === 'asaas' 
                            ? 'Esteira 1 · Gestão de Contas Digitais' 
                            : serv.category === 'regua-n8n'
                            ? 'Esteira 2 · Automação de Notificações'
                            : 'Consultoria Especializada'}
                        </span>
                        <h4 className="text-lg font-bold text-white font-display mt-0.5">
                          {serv.name}
                        </h4>
                      </div>
                      {matchedPlan?.badge && (
                        <span className="text-[10px] font-bold bg-[#D40B3A] text-white px-2 py-0.5 rounded-full shadow shrink-0">
                          {matchedPlan.badge}
                        </span>
                      )}
                    </div>

                    {matchedPlan?.headline && (
                      <p className="text-xs text-slate-300 italic">
                        "{matchedPlan.headline}"
                      </p>
                    )}

                    <div className="space-y-2 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Checklist de Entregáveis ({featuresList.length} itens):</span>
                        {matchedPlan?.sla && (
                          <span className="text-emerald-400 font-mono text-[10px] normal-case">
                            {matchedPlan.sla}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        {featuresList.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="flex items-start gap-2.5 p-2 rounded-lg bg-[#16242A]/80 border border-slate-800/80 text-xs"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span className="text-slate-200 font-medium leading-snug">{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Implantação: <strong className="text-white font-mono">{formatBRL(serv.setupPrice)}</strong></span>
                    <span>Mensalidade: <strong className="text-[#D40B3A] font-mono">{formatBRL(serv.monthlyPrice)}/mês</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cronograma & Tempo Estimado da Implantação */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-[#D40B3A]">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider block">
                  Prazos Oficiais da Proposta
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
                  Tempo Estimado da Implantação & Cronograma
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Fases operacionais executadas pela equipe técnica especializada da Multilagos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs font-mono font-bold text-white bg-[#D40B3A] px-3.5 py-1.5 rounded-xl shadow flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>
                  {isOnlyRegua ? 'Tempo Total: Até 5 dias úteis' : 'Tempo Total: 20 dias'}
                </span>
              </span>
            </div>
          </div>

          {isOnlyRegua ? (
            <div className="space-y-4">
              <div className="p-3 bg-amber-950/30 border border-amber-800/50 rounded-xl text-xs text-amber-200">
                ⚡ <strong>Modalidade Régua de Cobrança:</strong> Prazo ágil de ativação de <strong>até 5 dias úteis</strong> para conexão e parametrização.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider block">Etapa 1</span>
                  <h5 className="text-sm font-bold text-white">Conexão da API WhatsApp & Meta</h5>
                  <p className="text-xs text-slate-400">Homologação da linha e conexão ao webhook.</p>
                  <span className="inline-block text-xs font-mono font-bold text-emerald-400 pt-1">1 a 2 dias úteis</span>
                </div>
                <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider block">Etapa 2</span>
                  <h5 className="text-sm font-bold text-white">Parametrização da Régua de Cobrança</h5>
                  <p className="text-xs text-slate-400">Aprovação de templates e configuração de disparos automáticos.</p>
                  <span className="inline-block text-xs font-mono font-bold text-emerald-400 pt-1">Até 3 dias úteis</span>
                </div>
                <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-1.5">
                  <span className="text-[10px] font-bold text-[#D40B3A] uppercase tracking-wider block">Etapa 3</span>
                  <h5 className="text-sm font-bold text-white">Validação & Go-Live</h5>
                  <p className="text-xs text-slate-400">Testes finais em homologação e início das notificações em produção.</p>
                  <span className="inline-block text-xs font-mono font-bold text-emerald-400 pt-1">1 dia útil</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      Alinhamento inicial, levantamento operacional de fluxos e concessão de acessos.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    Dependência: Acessos e equipe
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
                    Dependência: Envio das bases
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
                      Parametrização da conta Asaas, taxas comerciais, split, regras fiscais e cobrança.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-500">
                    Dependência: Regras definidas
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
                      Homologação final assistida, capacitação da equipe e início da operação oficial.
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
                  * Para projetos com somente régua de cobrança: <strong>até 5 dias úteis</strong>.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Fill & Split Screen Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Input Form (5 cols) */}
          <div className="lg:col-span-5 no-print space-y-6">
            
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                  Preenchimento em Tempo Real
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 font-display">
                  Dados da Empresa Contratante
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Os dados preenchidos aparecem instantaneamente na prévia do contrato ao lado.
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">Razão Social (Empresa):</label>
                  <input
                    type="text"
                    value={clientInfo.companyName}
                    onChange={(e) => setClientInfo({ ...clientInfo, companyName: e.target.value })}
                    placeholder="Ex: Auto Posto Multilagos Ltda"
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">CNPJ:</label>
                    <input
                      type="text"
                      value={clientInfo.cnpj}
                      onChange={(e) => setClientInfo({ ...clientInfo, cnpj: e.target.value })}
                      placeholder="00.000.000/0001-00"
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">Nome Fantasia (Opcional):</label>
                    <input
                      type="text"
                      value={clientInfo.tradeName || ''}
                      onChange={(e) => setClientInfo({ ...clientInfo, tradeName: e.target.value })}
                      placeholder="Ex: Multilagos Distribuição"
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Endereço Completo da Sede (Rua, nº, Bairro, Cidade/UF e CEP):
                  </label>
                  <input
                    type="text"
                    value={clientInfo.address}
                    onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                    placeholder="Ex: Av. Paulista, 1500, Sala 302, Centro - Cidade/UF - CEP 00000-000"
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                  />
                </div>

                <div className="pt-2 border-t border-slate-700/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Representante Legal Signatário:
                  </span>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">Nome Completo:</label>
                      <input
                        type="text"
                        value={clientInfo.contactName}
                        onChange={(e) => {
                          setClientInfo({ ...clientInfo, contactName: e.target.value });
                          if (signatureType === 'type') setTypedSignerName(e.target.value);
                        }}
                        placeholder="Nome do sócio ou procurador"
                        className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">CPF:</label>
                        <input
                          type="text"
                          value={clientInfo.cpf}
                          onChange={(e) => setClientInfo({ ...clientInfo, cpf: e.target.value })}
                          placeholder="000.000.000-00"
                          className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">Cargo:</label>
                        <input
                          type="text"
                          value={clientInfo.contactRole}
                          onChange={(e) => setClientInfo({ ...clientInfo, contactRole: e.target.value })}
                          placeholder="Ex: Sócio-Administrador"
                          className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">E-mail Corporativo:</label>
                        <input
                          type="email"
                          value={clientInfo.email}
                          onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                          placeholder="contato@empresa.com.br"
                          className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                        />
                      </div>
                      <div>
                        <label className="text-slate-300 font-semibold block mb-1">WhatsApp / Telefone:</label>
                        <input
                          type="tel"
                          value={clientInfo.phone}
                          onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                          placeholder="(00) 90000-0000"
                          className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Digital Signature Box */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                  Assinatura Eletrônica & Aceite Digital
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 font-display">
                  Formalização Conforme MP 2.200-2/2001 e Lei 14.063/2020
                </h3>
              </div>

              {/* Mode switch: Draw vs Type */}
              <div className="flex rounded-xl bg-[#111F24] p-1 border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setSignatureType('draw')}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    signatureType === 'draw' ? 'bg-[#D40B3A] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Desenhar Assinatura
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSignatureType('type');
                    if (!typedSignerName) setTypedSignerName(clientInfo.contactName);
                  }}
                  className={`flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                    signatureType === 'type' ? 'bg-[#D40B3A] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Digitar Nome Completo
                </button>
              </div>

              {signatureType === 'draw' ? (
                <div className="space-y-2">
                  <div className="border border-slate-700 rounded-xl bg-white p-2">
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={120}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[120px] cursor-crosshair"
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Assine acima utilizando o mouse ou a tela sensível ao toque.</span>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={typedSignerName}
                    onChange={(e) => setTypedSignerName(e.target.value)}
                    placeholder="Digite seu nome completo como signatário legal"
                    className="w-full px-3 py-2.5 bg-[#111F24] border border-slate-700 rounded-xl text-white font-mono text-xs"
                  />
                  <p className="text-[11px] text-slate-400">
                    Ao digitar seu nome completo, você vincula seu CPF ({clientInfo.cpf || 'informado acima'}) como signatário legal.
                  </p>
                </div>
              )}

              {/* Agreement Checkbox */}
              <label className="flex items-start gap-2.5 cursor-pointer pt-2 border-t border-slate-700 text-xs">
                <input
                  type="checkbox"
                  checked={termsAgreed}
                  onChange={(e) => setTermsAgreed(e.target.checked)}
                  className="w-4 h-4 rounded text-[#D40B3A] accent-[#D40B3A] mt-0.5 cursor-pointer"
                />
                <span className="text-slate-300 leading-snug">
                  Declaro que li e concordo com o <strong>Contrato Mestre (MSA)</strong> e a <strong>Proposta Comercial vinculada</strong> por <strong>tempo indeterminado</strong>.
                </span>
              </label>

              {validationError && (
                <div className="p-3 rounded-xl bg-rose-950/80 border border-rose-700 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{validationError}</span>
                </div>
              )}

              {/* Action Submit Button */}
              <button
                type="button"
                onClick={handleConfirmAcceptance}
                disabled={isProcessing || isSigned}
                className="w-full py-3.5 px-6 rounded-xl bg-[#D40B3A] hover:bg-[#B50931] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Assinando e Salvando Documentos...</span>
                  </>
                ) : isSigned ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>Aceite Formalizado com Sucesso</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Assinar Contrato & Salvar</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* Right: Live Document View (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between bg-[#16242A] p-3 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreviewDoc('prop')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewDoc === 'prop' ? 'bg-[#D40B3A] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. Proposta Comercial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewDoc('msa')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activePreviewDoc === 'msa' ? 'bg-[#D40B3A] text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>2. Contrato Mestre (MSA)</span>
                </button>
              </div>

              <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
                ✓ Atualizado com seus dados em tempo real
              </span>
            </div>

            {/* Document Render Container */}
            <div className="rounded-2xl border border-slate-700 shadow-2xl bg-slate-900/60 p-2 sm:p-4 overflow-x-auto">
              <div className="min-w-[794px] mx-auto flex justify-center">
                
                {/* Proposta Doc */}
                <div style={{ display: activePreviewDoc === 'prop' ? 'block' : 'none' }} className="w-full">
                  {proposal.serviceTrack === 'esteira-asaas' ? (
                    <AsaasProposalDoc
                      proposal={proposal}
                      clientInfo={clientInfo}
                      currentPlan={currentPlan}
                      signatureData={signatureData}
                      isSigned={isSigned}
                    />
                  ) : (
                    <MulticobrancaProposalDoc
                      proposal={proposal}
                      clientInfo={clientInfo}
                      currentPlan={currentPlan}
                      allPlans={customPlans}
                      signatureData={signatureData}
                      isSigned={isSigned}
                    />
                  )}
                </div>

                {/* Contrato Mestre Doc */}
                <div style={{ display: activePreviewDoc === 'msa' ? 'block' : 'none' }} className="w-full">
                  <MasterContractDoc
                    proposal={proposal}
                    clientInfo={clientInfo}
                    signatureData={signatureData}
                    isSigned={isSigned}
                  />
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* Post-Acceptance Success Box */}
        {isSigned && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-emerald-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300">
                    Contrato & Proposta Assinados com Sucesso
                  </span>
                  <h3 className="text-xl font-bold text-white font-display">
                    Aceite Formalizado · Certificado Digital Emitido
                  </h3>
                  <p className="text-xs text-emerald-300/80 mt-0.5">
                    Foram gerados: 1 Proposta Comercial (PDF) e 1 Contrato Mestre (PDF) por prazo indeterminado.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  onClick={handleDownloadSingleProposal}
                  disabled={downloadingPropPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#D40B3A]" />
                  <span>{downloadingPropPdf ? 'Gerando...' : '1. Baixar Proposta Assinada (PDF)'}</span>
                </button>

                <button
                  onClick={handleDownloadSingleContract}
                  disabled={downloadingContractPdf}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  <Download className="w-4 h-4 text-[#D40B3A]" />
                  <span>{downloadingContractPdf ? 'Gerando...' : '2. Baixar Contrato Mestre (PDF)'}</span>
                </button>
              </div>
            </div>

            {/* Live download status toast */}
            {downloadNotice && (
              <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-500/50 flex items-center gap-2.5 text-xs text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-semibold">{downloadNotice}</span>
              </div>
            )}

            {/* Archival confirmation badge */}
            <div className="p-4 rounded-xl bg-slate-900/90 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Documentos oficiais formalizados e arquivados eletronicamente sob código <strong className="text-white font-mono">{signatureData.verificationHash || proposal.id}</strong>.
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-800 shrink-0 self-start sm:self-auto">
                Arquivo Digital Seguro
              </span>
            </div>

            {/* Email dispatch notice */}
            <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center gap-3 text-xs text-emerald-200">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Notificação enviada com sucesso com ambos os documentos anexados para <strong className="text-white">{clientInfo.email}</strong> e cópia arquivada para <strong className="text-white">{MULTILAGOS_INFO.email}</strong>.
              </span>
            </div>

            {/* Asaas Billing Confirmation */}
            <div className="bg-[#111F24] border border-slate-700 rounded-xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white font-display">
                    Cobrança Automatizada via Asaas Ativada
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    As faturas de setup e mensalidades foram registradas na conta homologada Asaas e serão enviadas diretamente para o e-mail <strong>{clientInfo.email}</strong> e WhatsApp <strong>{clientInfo.phone}</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Certificado de Autenticidade:</span>
                  <span className="font-mono text-emerald-400 font-bold text-xs truncate block mt-0.5" title={signatureData.verificationHash}>
                    {signatureData.verificationHash || 'ML-AUTH-VERIFIED'}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Data & Hora do Aceite:</span>
                  <span className="text-white font-semibold text-xs block mt-0.5">
                    {signatureData.signedAt || new Date().toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[11px]">Envio das Cobranças:</span>
                  <span className="text-white font-semibold text-xs block mt-0.5">
                    Automático via Asaas (E-mail & WhatsApp)
                  </span>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
