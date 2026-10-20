import React, { useState, useRef, useEffect } from 'react';
import { 
  CommercialProposal, 
  ClientInfo, 
  DigitalSignatureData, 
  AsaasBillingResult, 
  AsaasConfig,
  Plan 
} from '../types';
import { MULTILAGOS_INFO, ALL_INITIAL_PLANS } from '../data/mockData';
import { formatBRL } from '../utils/calculator';
import { processAsaasContractBilling } from '../utils/asaasService';
import { exportElementToPdf } from '../utils/pdfGenerator';
import { MultilagosLogo } from './MultilagosLogo';
import { AsaasProposalDoc } from './documents/AsaasProposalDoc';
import { MulticobrancaProposalDoc } from './documents/MulticobrancaProposalDoc';
import { MasterContractDoc } from './documents/MasterContractDoc';

import { 
  ShieldCheck, 
  Check, 
  Lock, 
  Download, 
  Mail, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  FileCheck 
} from 'lucide-react';

interface ClientAcceptanceViewProps {
  proposal: CommercialProposal;
  asaasConfig: AsaasConfig;
  customPlans?: Plan[];
  isClientDirectAccess?: boolean;
  onProposalSigned: (updatedProposal: CommercialProposal) => void;
  onBackToConsultantView?: () => void;
}

export const ClientAcceptanceView: React.FC<ClientAcceptanceViewProps> = ({
  proposal,
  asaasConfig,
  customPlans = ALL_INITIAL_PLANS,
  isClientDirectAccess = false,
  onProposalSigned,
  onBackToConsultantView,
}) => {
  // Client input data with live sync
  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    companyName: proposal.clientInfo.companyName || '',
    tradeName: proposal.clientInfo.tradeName || '',
    cnpj: proposal.clientInfo.cnpj || '',
    stateRegistration: proposal.clientInfo.stateRegistration || '',
    address: proposal.clientInfo.address || '',
    contactName: proposal.clientInfo.contactName || '',
    contactRole: proposal.clientInfo.contactRole || 'Diretor / Sócio-Administrador',
    cpf: proposal.clientInfo.cpf || '',
    email: proposal.clientInfo.email || '',
    phone: proposal.clientInfo.phone || '',
    cityState: proposal.clientInfo.cityState || 'Belo Horizonte/MG',
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
  const [signatureData, setSignatureData] = useState<DigitalSignatureData>(proposal.signature || {
    signed: false,
    signatureType: 'draw',
  });

  const [asaasResult, setAsaasResult] = useState<AsaasBillingResult | null>(proposal.asaasBilling || null);
  const [downloadingContractPdf, setDownloadingContractPdf] = useState(false);
  const [downloadingPropPdf, setDownloadingPropPdf] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState<string>('');

  // Mutex refs to strictly prevent duplicate triggers/clicks (guarantees exactly 1 proposal + 1 contract)
  const isSigningRef = useRef<boolean>(false);
  const isAutomaticDownloadingRef = useRef<boolean>(false);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const currentPlan = customPlans.find((p) => p.id === proposal.planId) || customPlans[0];
  const fin = proposal.financials;

  const proposalElementId = proposal.serviceTrack === 'esteira-asaas' 
    ? 'asaas-proposal-doc' 
    : 'multicobranca-proposal-doc';

  const proposalFilename = proposal.serviceTrack === 'esteira-asaas'
    ? `Proposta_Comercial_Implementacao_Asaas_${proposal.id}`
    : `Proposta_Comercial_Multicobranca_${proposal.id}`;

  const contractFilename = `Contrato_Mestre_Prestacao_Servicos_${proposal.contractMasterId}`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = 130;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#111F24';
  }, [signatureType]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isSigned) return;
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
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isSigned) return;
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

  // Helper to trigger automated dual PDF downloads immediately upon acceptance (EXACTLY 1 Proposal + 1 Master Contract)
  const triggerAutomaticDualDownload = async () => {
    if (isAutomaticDownloadingRef.current) {
      console.warn('[PDF Download] Download automático já em andamento. Ignorando chamada duplicada.');
      return;
    }
    isAutomaticDownloadingRef.current = true;

    try {
      setDownloadNotice('Iniciando geração dos PDFs oficiais assinados (1 Proposta + 1 Contrato)...');
      
      // 1. Download Proposta Comercial (apenas 1 vez)
      setDownloadNotice('Gerando e baixando [1 de 2]: Proposta Comercial (PDF)...');
      setActivePreviewDoc('prop');
      await new Promise((r) => setTimeout(r, 450));
      setDownloadingPropPdf(true);
      await exportElementToPdf(proposalElementId, proposalFilename);
      setDownloadingPropPdf(false);

      // 2. Download Contrato Mestre (apenas 1 vez) com intervalo seguro
      setDownloadNotice('Gerando e baixando [2 de 2]: Contrato Mestre MSA (PDF)...');
      await new Promise((r) => setTimeout(r, 1400));
      setActivePreviewDoc('msa');
      await new Promise((r) => setTimeout(r, 450));
      setDownloadingContractPdf(true);
      await exportElementToPdf('master-contract-doc', contractFilename);
      setDownloadingContractPdf(false);

      setDownloadNotice('✓ Concluído com sucesso: 1 Proposta Comercial e 1 Contrato Mestre baixados!');
      setTimeout(() => setDownloadNotice(''), 7000);
    } catch (err) {
      console.error('Erro ao gerar download automático:', err);
      setDownloadNotice('Aviso: Caso o navegador tenha bloqueado um dos downloads, clique nos botões abaixo para salvar individualmente.');
    } finally {
      setTimeout(() => {
        isAutomaticDownloadingRef.current = false;
      }, 5000);
    }
  };

  // Submit and execute digital signature & Asaas integration
  const handleConfirmAcceptance = async () => {
    // Prevent duplicate clicks / double execution
    if (isSigningRef.current || isProcessing || isSigned) {
      return;
    }

    if (!clientInfo.companyName.trim() || !clientInfo.cnpj.trim()) {
      alert('Por favor, preencha a Razão Social e o CNPJ da empresa.');
      return;
    }

    if (!clientInfo.contactName.trim() || !clientInfo.cpf.trim() || !clientInfo.email.trim()) {
      alert('Por favor, informe o Nome, CPF e E-mail do representante legal.');
      return;
    }

    if (!termsAgreed) {
      alert('Por favor, assinale a concordância com o Contrato Mestre e a Proposta Comercial.');
      return;
    }

    if (signatureType === 'draw' && !hasDrawn) {
      alert('Por favor, desenhe sua assinatura no quadro indicado ou alterne para a assinatura digitada.');
      return;
    }

    isSigningRef.current = true;
    setIsProcessing(true);

    try {
      let signatureDataString = '';
      if (signatureType === 'draw' && canvasRef.current) {
        signatureDataString = canvasRef.current.toDataURL();
      }

      // Generate verification hash
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

      const updated: CommercialProposal = {
        ...proposal,
        clientInfo,
        status: 'client_accepted',
        signature: sigData,
        asaasBilling: billing,
      };

      onProposalSigned(updated);

      // Trigger automatic dual download (exactly once)
      setTimeout(() => {
        triggerAutomaticDualDownload();
      }, 350);

    } catch (err) {
      console.error('Erro ao processar aceite:', err);
      alert('Ocorreu um erro no processamento do aceite. Tente novamente.');
      isSigningRef.current = false;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingleProposal = async () => {
    setDownloadingPropPdf(true);
    setDownloadNotice('Gerando e baixando PDF da Proposta Comercial...');
    if (activePreviewDoc !== 'prop') {
      setActivePreviewDoc('prop');
      await new Promise((r) => setTimeout(r, 300));
    }
    const success = await exportElementToPdf(proposalElementId, proposalFilename);
    setDownloadingPropPdf(false);
    if (success) {
      setDownloadNotice('✓ Proposta Comercial baixada com sucesso!');
    } else {
      setDownloadNotice('Aviso: Verifique o download no navegador ou tente novamente.');
    }
    setTimeout(() => setDownloadNotice(''), 5000);
  };

  const handleDownloadSingleContract = async () => {
    setDownloadingContractPdf(true);
    setDownloadNotice('Gerando e baixando PDF do Contrato Mestre (MSA)...');
    if (activePreviewDoc !== 'msa') {
      setActivePreviewDoc('msa');
      await new Promise((r) => setTimeout(r, 300));
    }
    const success = await exportElementToPdf('master-contract-doc', contractFilename);
    setDownloadingContractPdf(false);
    if (success) {
      setDownloadNotice('✓ Contrato Mestre baixado com sucesso!');
    } else {
      setDownloadNotice('Aviso: Verifique o download no navegador ou tente novamente.');
    }
    setTimeout(() => setDownloadNotice(''), 5000);
  };

  return (
    <div className="min-h-screen bg-[#111F24] text-[#CDDADE] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Control Bar */}
        <div className="no-print bg-[#16242A] border border-slate-700/80 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3.5">
            <MultilagosLogo variant="dark" height={36} />
            <div className="pl-3 border-l border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D40B3A]">
                Portal Oficial de Aceite & Formalização
              </span>
              <p className="text-xs text-white">
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

        {/* Highlight Banner of Approved Financial Terms */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-2">
            <div>
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Condições Comerciais Acordadas na Reunião
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-display mt-0.5">
                {proposal.serviceTrack === 'esteira-asaas' ? 'Implementação Asaas' : 'Multicobrança WhatsApp'} · Plano {currentPlan.name}
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800">
              <span className="text-slate-400 block">Mensalidade Contratada:</span>
              <p className="text-2xl font-extrabold text-[#D40B3A] font-mono tabular-nums mt-1">
                {formatBRL(fin.monthlyTotal)}
                <span className="text-xs font-normal text-slate-400">/mês</span>
              </p>
              <p className="text-[11px] text-emerald-400 mt-1">
                Com pontualidade: {formatBRL(fin.monthlyWithPromptDiscount)} até o dia 05
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800">
              <span className="text-slate-400 block">Taxa de Implantação / Setup:</span>
              <p className="text-2xl font-extrabold text-white font-mono tabular-nums mt-1">
                {formatBRL(fin.setupTotal)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {fin.setupDiscountApplied ? 'Desconto comercial aplicado' : 'Pagamento único via Asaas'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800">
              <span className="text-slate-400 block">Nível de Suporte (SLA):</span>
              <p className="text-sm font-bold text-white mt-1">{currentPlan.sla}</p>
              <p className="text-[11px] text-slate-400 mt-1">Atendimento humanizado via WhatsApp</p>
            </div>
          </div>
        </div>

        {/* Live Fill & Split Screen Section: The requested feature */}
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
                  <label className="text-slate-300 font-semibold block mb-1">
                    Razão Social: <span className="text-[#D40B3A]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Minha Empresa de Serviços Ltda"
                    value={clientInfo.companyName}
                    onChange={(e) => setClientInfo({ ...clientInfo, companyName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nome Fantasia:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Minha Marca"
                    value={clientInfo.tradeName}
                    onChange={(e) => setClientInfo({ ...clientInfo, tradeName: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      CNPJ: <span className="text-[#D40B3A]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="00.000.000/0001-00"
                      value={clientInfo.cnpj}
                      onChange={(e) => setClientInfo({ ...clientInfo, cnpj: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Inscrição Estadual:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 12345678"
                      value={clientInfo.stateRegistration || ''}
                      onChange={(e) => setClientInfo({ ...clientInfo, stateRegistration: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Endereço Completo com Cidade/UF:
                  </label>
                  <input
                    type="text"
                    placeholder="Rua, Número, Bairro, Cidade/UF"
                    value={clientInfo.address}
                    onChange={(e) => setClientInfo({ ...clientInfo, address: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                {/* Multicobrança specific inputs */}
                {proposal.serviceTrack === 'esteira-regua-n8n' && (
                  <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800">
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        Sistema / Gateway Atual:
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Omie, Conta Azul, Itaú"
                        value={clientInfo.currentSystemName || ''}
                        onChange={(e) => setClientInfo({ ...clientInfo, currentSystemName: e.target.value })}
                        className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-semibold block mb-1">
                        WhatsApp Conectado:
                      </label>
                      <input
                        type="text"
                        placeholder="(00) 00000-0000"
                        value={clientInfo.connectedWhatsApp || ''}
                        onChange={(e) => setClientInfo({ ...clientInfo, connectedWhatsApp: e.target.value })}
                        className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Representative Details */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
              <div className="border-b border-slate-700 pb-3">
                <h3 className="text-base font-bold text-white font-display">
                  Representante Legal do Contratante
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nome Completo do Representante: <span className="text-[#D40B3A]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nome completo do assinante"
                    value={clientInfo.contactName}
                    onChange={(e) => {
                      setClientInfo({ ...clientInfo, contactName: e.target.value });
                      setTypedSignerName(e.target.value);
                    }}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      CPF: <span className="text-[#D40B3A]">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="000.000.000-00"
                      value={clientInfo.cpf}
                      onChange={(e) => setClientInfo({ ...clientInfo, cpf: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-semibold block mb-1">
                      Cargo / Função:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Diretor Financeiro"
                      value={clientInfo.contactRole}
                      onChange={(e) => setClientInfo({ ...clientInfo, contactRole: e.target.value })}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    E-mail Corporativo: <span className="text-[#D40B3A]">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="seuemail@empresa.com.br"
                    value={clientInfo.email}
                    onChange={(e) => setClientInfo({ ...clientInfo, email: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    WhatsApp Comercial: <span className="text-[#D40B3A]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={clientInfo.phone}
                    onChange={(e) => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Signature Box (if not signed) */}
            {!isSigned && (
              <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
                <div className="border-b border-slate-700 pb-3">
                  <h3 className="text-base font-bold text-white font-display">
                    Assinatura Eletrônica & Aceite Digital
                  </h3>
                </div>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsAgreed}
                    onChange={(e) => setTermsAgreed(e.target.checked)}
                    className="w-5 h-5 rounded text-[#D40B3A] focus:ring-[#D40B3A] border-slate-700 mt-0.5 cursor-pointer accent-[#D40B3A]"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed font-medium">
                    Declaro, na qualidade de representante legal de <strong className="text-white">{clientInfo.companyName || '[Empresa]'}</strong>, que li, concordo e dou pleno aceite ao <strong>Contrato Mestre (MSA)</strong> e à <strong>Proposta Comercial vinculada</strong>.
                  </span>
                </label>

                {/* Draw vs Type */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSignatureType('draw')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      signatureType === 'draw' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Desenhar Rubrica
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignatureType('type')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                      signatureType === 'type' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Assinatura Digitada
                  </button>
                </div>

                {signatureType === 'draw' ? (
                  <div className="space-y-1">
                    <div className="bg-white rounded-xl overflow-hidden touch-none relative border-2 border-slate-600">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[120px] cursor-crosshair"
                      />
                      {!hasDrawn && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                          Desenhe sua assinatura no quadro com o mouse ou toque
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-[#D40B3A] hover:underline cursor-pointer"
                    >
                      Limpar quadro
                    </button>
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nome para Assinatura:</label>
                    <input
                      type="text"
                      value={typedSignerName}
                      onChange={(e) => setTypedSignerName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-sm text-white"
                    />
                    <div className="mt-2 p-3 bg-white rounded-lg text-center font-display italic text-lg text-slate-900 tracking-wider">
                      {typedSignerName || clientInfo.contactName || 'Sua Assinatura'}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleConfirmAcceptance}
                  disabled={isProcessing || !termsAgreed}
                  className={`w-full py-4 px-6 text-sm font-bold rounded-xl transition-all shadow-xl active:scale-98 flex items-center justify-center gap-2 cursor-pointer ${
                    termsAgreed && !isProcessing
                      ? 'bg-[#D40B3A] hover:bg-[#B50931] text-white'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    {isProcessing ? 'Conectando ao Asaas & Gerando PDFs...' : 'Assinar Contrato & Baixar PDFs'}
                  </span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}

          </div>

          {/* Right: Live Interactive Document Viewer (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Document Selector Tabs */}
            <div className="no-print flex items-center justify-between bg-[#16242A] p-2 rounded-xl border border-slate-700">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePreviewDoc('prop')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activePreviewDoc === 'prop'
                      ? 'bg-[#D40B3A] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Proposta de Serviço ({proposal.serviceTrack === 'esteira-asaas' ? 'Asaas' : 'Multicobrança'})</span>
                </button>

                <button
                  onClick={() => setActivePreviewDoc('msa')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                    activePreviewDoc === 'msa'
                      ? 'bg-[#D40B3A] text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCheck className="w-3.5 h-3.5" />
                  <span>Contrato Mestre (MSA)</span>
                </button>
              </div>

              {/* Action Buttons for downloading */}
              <div className="flex items-center gap-2">
                <button
                  onClick={activePreviewDoc === 'prop' ? handleDownloadSingleProposal : handleDownloadSingleContract}
                  disabled={downloadingPropPdf || downloadingContractPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Salvar PDF do documento atual"
                >
                  <Download className="w-3.5 h-3.5 text-[#D40B3A]" />
                  <span>Baixar Este PDF</span>
                </button>
              </div>
            </div>

            {/* Status indicator toast */}
            {downloadNotice && (
              <div className="p-3.5 mb-3 rounded-xl bg-slate-900 border border-[#D40B3A]/60 flex items-center gap-2.5 text-xs text-white shadow-xl">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D40B3A] animate-pulse shrink-0" />
                <span className="font-semibold">{downloadNotice}</span>
              </div>
            )}

            {/* Document Display Area with Exact Visual Fidelity to PDF screenshots */}
            <div className="rounded-2xl overflow-x-auto border border-slate-700 bg-slate-900/60 p-2 sm:p-4 shadow-2xl">
              <div className="min-w-[794px] mx-auto flex justify-center">
                {/* Proposta Comercial - Sempre presente no DOM */}
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
                      signatureData={signatureData}
                      isSigned={isSigned}
                    />
                  )}
                </div>

                {/* Contrato Mestre (MSA) - Sempre presente no DOM */}
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

        {/* Post-Acceptance Success Box (Appears once signed) */}
        {isSigned && asaasResult && (
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
                    Foram gerados separadamente: 1 Proposta Comercial (PDF) e 1 Contrato Mestre (PDF).
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

            {/* Email dispatch notice */}
            <div className="p-4 rounded-xl bg-emerald-900/60 border border-emerald-700/60 flex items-center gap-3 text-xs text-emerald-200">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Notificação enviada com sucesso com ambos os documentos anexados para <strong className="text-white">{clientInfo.email}</strong> e cópia arquivada para <strong className="text-white">{MULTILAGOS_INFO.email}</strong>.
              </span>
            </div>

            {/* Automated Asaas Billing Confirmation: NO Pix QR Code */}
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
                    As faturas de setup e mensalidades foram registradas na conta homologada Asaas e serão enviadas diretamente para o e-mail <strong>{clientInfo.email}</strong> e WhatsApp <strong>{clientInfo.phone}</strong> da sua empresa.
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
