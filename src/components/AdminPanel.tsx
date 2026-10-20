import React, { useState, useEffect } from 'react';
import JSZip from 'jszip';
import { Plan, AsaasConfig, DiagnosticSheetData, BillingModel, ClientPricingTier, CommercialProposal, ClientInfo, DigitalSignatureData } from '../types';
import { DEFAULT_CLIENT_PRICING_TIERS, MULTILAGOS_INFO } from '../data/mockData';
import { 
  Save, 
  RotateCcw, 
  Check, 
  CreditCard, 
  Layers, 
  ArrowLeft,
  Sliders,
  Users,
  Repeat,
  Globe,
  Server,
  FileCode,
  CheckCircle2,
  HelpCircle,
  Download,
  FolderOpen,
  Table,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Trash2,
  Plus,
  FileText,
  Copy,
  Printer,
  Eye,
  FileCheck2,
  FileDown
} from 'lucide-react';
import { MultilagosLogo } from './MultilagosLogo';
import { formatBRL } from '../utils/calculator';
import { initAuth, googleSignIn, logoutGoogle, getAccessToken, getSavedGoogleUser, SavedGoogleUser } from '../services/googleAuth';
import { getOrCreateDriveFolder, getOrCreateSpreadsheet } from '../services/googleWorkspace';
import { User } from 'firebase/auth';
import { MasterContractDoc } from './documents/MasterContractDoc';
import { AsaasProposalDoc } from './documents/AsaasProposalDoc';
import { MulticobrancaProposalDoc } from './documents/MulticobrancaProposalDoc';
import {
  OFFICIAL_MASTER_CONTRACT_V2,
  getMasterContractMarkdown,
  getAsaasProposalMarkdown,
  getMulticobrancaProposalMarkdown,
  getFullPackageProposalMarkdown,
  generateDocumentsZipBlob
} from '../utils/documentTemplates';
import { generateFullProjectZipBlob } from '../utils/projectZipGenerator';

interface AdminPanelProps {
  plans: Plan[];
  pricingTiers: ClientPricingTier[];
  asaasConfig: AsaasConfig;
  diagnosticData: DiagnosticSheetData;
  onSavePlans: (plans: Plan[]) => void;
  onSavePricingTiers: (tiers: ClientPricingTier[]) => void;
  onSaveAsaasConfig: (config: AsaasConfig) => void;
  onSaveDiagnosticData: (data: DiagnosticSheetData) => void;
  onResetDefaults: () => void;
  onCloseAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  plans,
  pricingTiers,
  asaasConfig,
  diagnosticData,
  onSavePlans,
  onSavePricingTiers,
  onSaveAsaasConfig,
  onSaveDiagnosticData,
  onResetDefaults,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'planos' | 'faixas' | 'documentos' | 'asaas' | 'diagnostico' | 'producao' | 'google'>('planos');
  const [activeDocSubTab, setActiveDocSubTab] = useState<'contrato' | 'proposta-asaas' | 'proposta-regua' | 'proposta-integrada'>('contrato');
  const [docCopiedToast, setDocCopiedToast] = useState(false);
  const [isZippingDocs, setIsZippingDocs] = useState(false);
  const [contractVersion, setContractVersion] = useState<string>(() => {
    return localStorage.getItem('multilagos_contract_version') || '2.0 (Oficial Atualizado)';
  });
  const [contractForo, setContractForo] = useState<string>(() => {
    return localStorage.getItem('multilagos_contract_foro') || 'Comarca de Belo Horizonte/MG';
  });
  
  // Local editable copies
  const [editPlans, setEditPlans] = useState<Plan[]>(plans);
  const [editTiers, setEditTiers] = useState<ClientPricingTier[]>(pricingTiers || DEFAULT_CLIENT_PRICING_TIERS);
  const [editAsaas, setEditAsaas] = useState<AsaasConfig>(asaasConfig);
  const [editDiag, setEditDiag] = useState<DiagnosticSheetData>(diagnosticData);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Google Workspace Integration State
  const [googleUser, setGoogleUser] = useState<User | SavedGoogleUser | null>(() => getSavedGoogleUser());
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleFolderUrl, setGoogleFolderUrl] = useState<string | null>(null);
  const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(null);
  const [googleStatusMsg, setGoogleStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = initAuth(
      (user) => setGoogleUser(user),
      () => {
        if (!getSavedGoogleUser()) {
          setGoogleUser(null);
        }
      }
    );
    return () => {
      if (unsub) unsub();
    };
  }, []);

  useEffect(() => {
    if (pricingTiers && pricingTiers.length > 0) {
      setEditTiers(pricingTiers);
    }
  }, [pricingTiers]);

  const handleConnectGoogle = async () => {
    setIsGoogleLoading(true);
    setGoogleStatusMsg(null);
    try {
      const res = await googleSignIn();
      if (res?.user) {
        setGoogleUser(res.user);
        setGoogleStatusMsg('Conta conectada com sucesso ao Google Workspace!');
      }
    } catch (err: any) {
      setGoogleStatusMsg('Erro ao conectar ao Google: ' + (err.message || 'Falha no login'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setGoogleFolderUrl(null);
    setGoogleSheetUrl(null);
    setGoogleStatusMsg('Conta desconectada.');
  };

  const handleTestWorkspace = async () => {
    setIsGoogleLoading(true);
    setGoogleStatusMsg(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Não há token de acesso válido. Conecte sua conta Google.');
      const folder = await getOrCreateDriveFolder(token, 'Multilagos - Contratos Assinados');
      setGoogleFolderUrl(folder.webViewLink || null);
      const sheet = await getOrCreateSpreadsheet(token, 'Multilagos - Registro de Contratos e Aceites');
      setGoogleSheetUrl(sheet.spreadsheetUrl);
      setGoogleStatusMsg('✓ Conexão com Google Drive e Google Sheets verificada com sucesso!');
    } catch (err: any) {
      setGoogleStatusMsg('Erro ao testar: ' + (err.message || 'Falha'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Download do ZIP completo com 100% dos arquivos do sistema para o Git
  const handleDownloadProductionZip = async () => {
    setIsZipping(true);
    try {
      // 1. Tentar baixar via Blob do endpoint estático
      let downloadedViaServer = false;
      try {
        const res = await fetch('/simulador-multilagos-completo.zip');
        const contentType = res.headers.get('content-type') || '';
        
        // Se retornou um arquivo zip válido (e não o index.html da rota fallback do Vite)
        if (res.ok && !contentType.includes('text/html')) {
          const blob = await res.blob();
          if (blob.size > 500000) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'simulador-multilagos-completo.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            downloadedViaServer = true;
            return;
          }
        }
      } catch (fetchErr) {
        console.warn('Download do arquivo estático falhou ou retornou incompleto. Gerando ZIP completo no navegador...', fetchErr);
      }

      // 2. Geração local no navegador garantida com 100% dos arquivos de código-fonte do sistema
      if (!downloadedViaServer) {
        const blob = await generateFullProjectZipBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'simulador-multilagos-completo.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Falha ao baixar/gerar ZIP:', err);
      alert('Não foi possível gerar o ZIP automaticamente. Verifique se o bloqueador de pop-ups está ativo.');
    } finally {
      setIsZipping(false);
    }
  };

  // Download dedicado do pacote de modelos de documentos em ZIP limpo
  const handleDownloadDocumentsZip = async () => {
    setIsZippingDocs(true);
    try {
      const blob = await generateDocumentsZipBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'modelos-documentos-multilagos-v2.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Falha ao gerar ZIP de documentos:', err);
    } finally {
      setIsZippingDocs(false);
    }
  };

  // Copiar markdown do documento ativo
  const handleCopyActiveDocument = async () => {
    let text = '';
    if (activeDocSubTab === 'contrato') text = getMasterContractMarkdown();
    else if (activeDocSubTab === 'proposta-asaas') text = getAsaasProposalMarkdown();
    else if (activeDocSubTab === 'proposta-regua') text = getMulticobrancaProposalMarkdown();
    else text = getFullPackageProposalMarkdown();

    try {
      await navigator.clipboard.writeText(text);
      setDocCopiedToast(true);
      setTimeout(() => setDocCopiedToast(false), 3000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Imprimir ou salvar PDF do documento ativo
  const handlePrintDocument = () => {
    window.print();
  };

  // Plan editing helper
  const handleUpdatePlan = (index: number, field: keyof Plan, value: any) => {
    const updated = [...editPlans];
    updated[index] = { ...updated[index], [field]: value };
    setEditPlans(updated);
  };

  const handleAddPlanFeature = (planIndex: number, newFeature: string) => {
    if (!newFeature.trim()) return;
    const updated = [...editPlans];
    const currentFeats = updated[planIndex].features || [];
    updated[planIndex] = { ...updated[planIndex], features: [...currentFeats, newFeature.trim()] };
    setEditPlans(updated);
  };

  const handleRemovePlanFeature = (planIndex: number, featureIndex: number) => {
    const updated = [...editPlans];
    const currentFeats = updated[planIndex].features || [];
    updated[planIndex] = { ...updated[planIndex], features: currentFeats.filter((_, i) => i !== featureIndex) };
    setEditPlans(updated);
  };

  const handleUpdateTierField = (tierIndex: number, field: 'label' | 'minClients' | 'maxClients', value: any) => {
    const updated = [...editTiers];
    updated[tierIndex] = {
      ...updated[tierIndex],
      [field]: field === 'label' ? value : Number(value)
    };
    setEditTiers(updated);
  };

  const handleUpdateTierPlanPrice = (
    tierIndex: number,
    planKey: 'essencial' | 'pro' | 'performance' | 'personalizado',
    priceKey: 'monthlyPrice' | 'setupPrice',
    value: number
  ) => {
    const updated = [...editTiers];
    const tier = updated[tierIndex];
    updated[tierIndex] = {
      ...tier,
      plans: {
        ...tier.plans,
        [planKey]: {
          ...tier.plans[planKey],
          [priceKey]: Number(value) || 0
        }
      }
    };
    setEditTiers(updated);
  };

  const handleAddTier = () => {
    const lastTier = editTiers[editTiers.length - 1];
    const newMin = lastTier ? lastTier.maxClients + 1 : 100;
    const newTier: ClientPricingTier = {
      id: `tier-${Date.now()}`,
      minClients: newMin,
      maxClients: newMin + 250,
      label: `${newMin} a ${newMin + 250} clientes`,
      plans: {
        essencial: { monthlyPrice: 249, setupPrice: 1500 },
        pro: { monthlyPrice: 599, setupPrice: 3500 },
        performance: { monthlyPrice: 999, setupPrice: 4800 },
        personalizado: { monthlyPrice: 1500, setupPrice: 6500 },
      }
    };
    setEditTiers([...editTiers, newTier]);
  };

  const handleRemoveTier = (tierIndex: number) => {
    if (editTiers.length <= 1) {
      alert('É necessário manter pelo menos uma faixa de clientes.');
      return;
    }
    setEditTiers(editTiers.filter((_, idx) => idx !== tierIndex));
  };

  const handleResetTiers = () => {
    if (confirm('Deseja restaurar as faixas de precificação padrão da Multilagos?')) {
      setEditTiers(DEFAULT_CLIENT_PRICING_TIERS);
      onSavePricingTiers(DEFAULT_CLIENT_PRICING_TIERS);
    }
  };

  const handleSaveAll = () => {
    localStorage.setItem('multilagos_contract_version', contractVersion);
    localStorage.setItem('multilagos_contract_foro', contractForo);
    onSavePlans(editPlans);
    onSavePricingTiers(editTiers);
    onSaveAsaasConfig(editAsaas);
    onSaveDiagnosticData(editDiag);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const sampleClient: ClientInfo = {
    companyName: editDiag.companyName || 'Empresa Exemplo Ltda',
    tradeName: 'Exemplo Soluções',
    cnpj: '43.153.053/0001-55',
    address: 'Rua Rio de Janeiro, nº 243, sala 802, Centro',
    cityState: contractForo.replace('Comarca de ', '') || 'Belo Horizonte/MG',
    contactName: 'Carlos Eduardo Oliveira',
    contactRole: 'Diretor Financeiro',
    cpf: '133.863.187-03',
    email: 'financeiro@exemplo.com.br',
    phone: '(22) 99902-0466',
  };

  const sampleProposal: CommercialProposal = {
    id: 'PROP-2026-001',
    contractMasterId: 'MSA-2026-001',
    clientInfo: sampleClient,
    serviceTrack: 'esteira-asaas',
    planId: 'pro',
    consultantName: MULTILAGOS_INFO.representativeName,
    consultantEmail: MULTILAGOS_INFO.email,
    consultantPhone: MULTILAGOS_INFO.phone,
    diagnosticData: editDiag,
    financials: {
      setupPrice: 1500,
      setupDiscountApplied: false,
      setupDiscountValue: 0,
      setupTotal: 1500,
      monthlyPrice: 249,
      monthlyDiscountApplied: false,
      monthlyDiscountValue: 0,
      monthlyTotal: 249,
      hasPromptPaymentDiscount: false,
      monthlyWithPromptDiscount: 249,
      dueDay: 10,
    },
    selectedServices: [
      {
        id: 'asaas',
        category: 'asaas',
        planId: 'pro',
        name: 'Implantação Asaas PRO (Mais Indicado)',
        setupPrice: 1500,
        monthlyPrice: 249,
      },
    ],
    customFeatures: editPlans.find((p) => p.id === 'pro')?.features,
    createdAt: new Date().toLocaleDateString('pt-BR'),
    validUntil: new Date(Date.now() + 15 * 86400000).toLocaleDateString('pt-BR'),
    status: 'draft',
    minimumContractMonths: 12,
    startDate: new Date().toLocaleDateString('pt-BR'),
    signature: {
      signed: false,
      signatureType: 'type',
      signerName: 'Carlos Eduardo Oliveira',
      signerCpf: '133.863.187-03',
      signerIp: '187.122.45.109',
      signedAt: new Date().toLocaleString('pt-BR'),
      verificationHash: 'ML-MSA-2026-OFICIAL-A8F932',
    },
  };

  const sampleAsaasPlan = editPlans.find((p) => p.id === 'pro') || editPlans[0];
  const sampleReguaPlan = editPlans.find((p) => p.id === 'regua-3k') || editPlans[editPlans.length - 1];

  const teamSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <div className="min-h-screen bg-[#111F24] text-[#CDDADE] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <MultilagosLogo variant="dark" height={36} />
            <div className="pl-4 border-l border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D40B3A]">
                Painel do Consultor · Gestão de Parâmetros
              </span>
              <h2 className="text-xl font-bold text-white font-display">
                Configurações da Ferramenta Comercial
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownloadProductionZip}
              disabled={isZipping}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-600/30 active:scale-98 cursor-pointer ring-2 ring-emerald-400/40"
              title="Baixar 100% dos arquivos do projeto (código-fonte React, componentes, TypeScript, configs e Docker) pronto para subir ao Git"
            >
              {isZipping ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{isZipping ? 'Empacotando Sistema Completo...' : 'Baixar Código do Sistema (ZIP para Git)'}</span>
            </button>

            <button
              onClick={onCloseAdmin}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao Simulador</span>
            </button>

            <button
              onClick={handleSaveAll}
              className="px-5 py-2 bg-[#D40B3A] hover:bg-[#B50931] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md active:scale-98 cursor-pointer"
            >
              {saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saveSuccess ? 'Salvo com Sucesso!' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('planos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'planos' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Tabela de Planos</span>
          </button>

          <button
            onClick={() => setActiveTab('faixas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'faixas' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Tabela de Precificação por Clientes</span>
          </button>

          <button
            onClick={() => setActiveTab('documentos')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'documentos' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Modelos de Documentos</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
              v2.0 Oficial
            </span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostico')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'diagnostico' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Perguntas & Metas do Diagnóstico</span>
          </button>

          <button
            onClick={() => setActiveTab('asaas')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'asaas' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Configurações & Taxas Asaas</span>
          </button>

          <button
            onClick={() => setActiveTab('producao')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'producao' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Publicação & Produção</span>
          </button>

          <button
            onClick={() => setActiveTab('google')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              activeTab === 'google' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span>Google Drive & Planilhas</span>
          </button>

          <button
            onClick={onResetDefaults}
            className="ml-auto text-xs text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Valores Padrão</span>
          </button>
        </div>

        {/* TAB 1: Planos */}
        {activeTab === 'planos' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {editPlans.map((plan, pIdx) => (
                <div key={plan.id} className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D40B3A]">
                        {plan.track === 'asaas' ? 'Esteira 1 · Asaas' : 'Esteira 2 · Multicobrança'}
                      </span>
                      <h3 className="text-lg font-bold text-white font-display">
                        {plan.name}
                      </h3>
                    </div>
                    {plan.recommended && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                        Padrão Recomendado
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="text-slate-400 block mb-1">Mensalidade Base (R$):</label>
                      <input
                        type="number"
                        value={plan.baseMonthlyPrice}
                        onChange={(e) => handleUpdatePlan(pIdx, 'baseMonthlyPrice', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Setup Base (R$):</label>
                      <input
                        type="number"
                        value={plan.baseSetupPrice}
                        onChange={(e) => handleUpdatePlan(pIdx, 'baseSetupPrice', Number(e.target.value))}
                        className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="text-xs">
                    <label className="text-slate-400 block mb-1">Headline do Plano:</label>
                    <input
                      type="text"
                      value={plan.headline}
                      onChange={(e) => handleUpdatePlan(pIdx, 'headline', e.target.value)}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  <div className="text-xs">
                    <label className="text-slate-400 block mb-1">SLA e Nível de Atendimento:</label>
                    <input
                      type="text"
                      value={plan.sla}
                      onChange={(e) => handleUpdatePlan(pIdx, 'sla', e.target.value)}
                      className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                    />
                  </div>

                  {/* Checklist Oficial de Entregáveis do Plano */}
                  <div className="pt-3 border-t border-slate-700/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">
                        Checklist do Plano ({plan.features?.length || 0} itens inclusos):
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {plan.features?.map((feat, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-[#111F24] border border-slate-800 text-[11px]"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="text-slate-200 truncate">{feat}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePlanFeature(pIdx, fIdx)}
                            className="text-slate-500 hover:text-rose-400 p-0.5 rounded cursor-pointer transition-colors"
                            title="Remover item do checklist"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Adicionar novo entregável ao checklist..."
                        id={`new-feat-${plan.id}`}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = (e.currentTarget as HTMLInputElement).value;
                            if (val) {
                              handleAddPlanFeature(pIdx, val);
                              (e.currentTarget as HTMLInputElement).value = '';
                            }
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-[#111F24] border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D40B3A]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`new-feat-${plan.id}`) as HTMLInputElement;
                          if (el && el.value) {
                            handleAddPlanFeature(pIdx, el.value);
                            el.value = '';
                          }
                        }}
                        className="px-3 py-1.5 bg-[#D40B3A] hover:bg-[#B50931] text-white rounded-lg text-xs font-bold cursor-pointer shrink-0 transition-colors"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: Tabela de Precificação por Faixa de Clientes */}
        {activeTab === 'faixas' && (
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-3">
              <div>
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-3.5 h-3.5" />
                  <span>Matriz de Precificação Dinâmica</span>
                </span>
                <h3 className="text-xl font-bold text-white mt-0.5 font-display">
                  Tabela de Precificação por Quantidade de Clientes
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Ajuste os valores de <strong>Mensalidade</strong> e <strong>Setup</strong> para cada plano de acordo com as faixas de clientes. O simulador e a proposta atualizarão os preços automaticamente.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddTier}
                  className="px-3.5 py-2 bg-[#D40B3A] hover:bg-[#B50931] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Faixa</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetTiers}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Restaurar faixas originais"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Padrões</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#111F24] text-slate-300 font-bold border-b border-slate-700">
                    <th className="py-3 px-3 min-w-[180px]">Faixa de Clientes</th>
                    <th className="py-3 px-3 min-w-[160px] text-center border-l border-slate-700">
                      <span className="block text-slate-200">Essencial</span>
                      <span className="text-[10px] text-slate-400 font-normal">Mensal / Setup</span>
                    </th>
                    <th className="py-3 px-3 min-w-[160px] text-center border-l border-slate-700 bg-[#D40B3A]/10">
                      <span className="block text-[#D40B3A]">PRO (Mais Indicado)</span>
                      <span className="text-[10px] text-slate-400 font-normal">Mensal / Setup</span>
                    </th>
                    <th className="py-3 px-3 min-w-[160px] text-center border-l border-slate-700">
                      <span className="block text-slate-200">Performance</span>
                      <span className="text-[10px] text-slate-400 font-normal">Mensal / Setup (Split)</span>
                    </th>
                    <th className="py-3 px-3 min-w-[160px] text-center border-l border-slate-700">
                      <span className="block text-slate-200">Personalizado</span>
                      <span className="text-[10px] text-slate-400 font-normal">Mensal / Setup</span>
                    </th>
                    <th className="py-3 px-2 text-center border-l border-slate-700 w-12">
                      Ação
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {editTiers.map((tier, tIdx) => (
                    <tr key={tier.id || tIdx} className={tIdx % 2 === 0 ? 'bg-[#142228]' : 'bg-[#111F24]'}>
                      {/* Faixa Info */}
                      <td className="py-3 px-3 font-sans">
                        <input
                          type="text"
                          value={tier.label}
                          onChange={(e) => handleUpdateTierField(tIdx, 'label', e.target.value)}
                          className="w-full px-2 py-1 bg-[#111F24] border border-slate-700 rounded text-white font-bold text-xs mb-1 focus:ring-1 focus:ring-[#D40B3A]"
                          placeholder="Ex: 1 a 100 clientes"
                        />
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                          <span>De:</span>
                          <input
                            type="number"
                            value={tier.minClients}
                            onChange={(e) => handleUpdateTierField(tIdx, 'minClients', e.target.value)}
                            className="w-16 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-slate-200 font-bold"
                          />
                          <span>a</span>
                          <input
                            type="number"
                            value={tier.maxClients}
                            onChange={(e) => handleUpdateTierField(tIdx, 'maxClients', e.target.value)}
                            className="w-18 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-slate-200 font-bold"
                          />
                        </div>
                      </td>

                      {/* Essencial */}
                      <td className="py-3 px-2.5 border-l border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Mês:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-200">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.essencial?.monthlyPrice ?? 99}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'essencial', 'monthlyPrice', Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-white focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Setup:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-300">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.essencial?.setupPrice ?? 750}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'essencial', 'setupPrice', Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-slate-300 focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* PRO */}
                      <td className="py-3 px-2.5 border-l border-slate-800 bg-[#D40B3A]/5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#D40B3A] font-sans font-bold">Mês:</span>
                            <div className="flex items-center gap-0.5 font-bold text-[#D40B3A]">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.pro?.monthlyPrice ?? 379}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'pro', 'monthlyPrice', Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-[#D40B3A] focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Setup:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-300">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.pro?.setupPrice ?? 2500}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'pro', 'setupPrice', Number(e.target.value))}
                                className="w-18 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-slate-200 focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Performance */}
                      <td className="py-3 px-2.5 border-l border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Mês:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-200">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.performance?.monthlyPrice ?? 599}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'performance', 'monthlyPrice', Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-white focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Setup:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-300">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.performance?.setupPrice ?? 3500}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'performance', 'setupPrice', Number(e.target.value))}
                                className="w-18 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-slate-200 focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Personalizado */}
                      <td className="py-3 px-2.5 border-l border-slate-800">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Mês:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-200">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.personalizado?.monthlyPrice ?? 950}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'personalizado', 'monthlyPrice', Number(e.target.value))}
                                className="w-16 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-white focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400 font-sans">Setup:</span>
                            <div className="flex items-center gap-0.5 font-bold text-slate-300">
                              <span>R$</span>
                              <input
                                type="number"
                                value={tier.plans?.personalizado?.setupPrice ?? 4800}
                                onChange={(e) => handleUpdateTierPlanPrice(tIdx, 'personalizado', 'setupPrice', Number(e.target.value))}
                                className="w-18 px-1.5 py-0.5 bg-[#111F24] border border-slate-700 rounded text-right font-bold text-slate-200 focus:ring-1 focus:ring-[#D40B3A]"
                              />
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Delete */}
                      <td className="py-3 px-2 text-center border-l border-slate-800">
                        <button
                          type="button"
                          onClick={() => handleRemoveTier(tIdx)}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Remover esta faixa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 rounded-xl bg-[#111F24] border border-slate-700/80 flex items-start gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong>Precificação Inteligente:</strong> Ao simular uma proposta comercial, o sistema consulta esta tabela e identifica automaticamente a faixa em que a empresa se enquadra (ex: 130 clientes se enquadra em <em>101 a 300 clientes</em>). Caso precise conceder uma condição especial temporária, use o campo de desconto do simulador.
              </div>
            </div>
          </div>
        )}

        {/* TAB: Modelos de Documentos Oficiais (Contrato Mestre & Propostas) */}
        {activeTab === 'documentos' && (
          <div className="space-y-6">
            {/* Header Banner */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>Modelos Oficiais de Documentos · Versão 2.0</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
                      ✓ Juridicamente Validado
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white font-display pt-1">
                    Central de Modelos de Contratos & Propostas Comerciais
                  </h3>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    Consulte, personalize e exporte as versões oficiais vigentes do <strong>Contrato Mestre (MSA)</strong> com suas 12 cláusulas jurídicas e das <strong>Propostas Comerciais</strong> (Asaas, Multicobrança e Pacote Integrado).
                  </p>
                </div>

                {/* Quick actions for documents */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleDownloadProductionZip}
                    disabled={isZipping}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                    title="Baixar pacote ZIP completo com 100% do código-fonte do sistema para o Git"
                  >
                    {isZipping ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>{isZipping ? 'Empacotando Sistema...' : 'Baixar Código do Sistema (Git)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadDocumentsZip}
                    disabled={isZippingDocs}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
                    title="Baixar apenas os arquivos de texto e markdown dos modelos jurídicos"
                  >
                    {isZippingDocs ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-4 h-4" />}
                    <span>{isZippingDocs ? 'Compactando...' : 'Apenas Modelos de Texto (ZIP)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyActiveDocument}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
                  >
                    {docCopiedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
                    <span>{docCopiedToast ? 'Texto Copiado!' : 'Copiar Texto (Markdown)'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintDocument}
                    className="px-4 py-2.5 bg-[#D40B3A] hover:bg-[#B50931] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-md"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimir / Salvar PDF</span>
                  </button>
                </div>
              </div>

              {/* Subtab selection pills */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveDocSubTab('contrato')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeDocSubTab === 'contrato'
                      ? 'bg-[#D40B3A] text-white shadow-md'
                      : 'bg-[#111F24] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>1. Contrato Mestre (MSA) - v2.0 Oficial</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDocSubTab('proposta-asaas')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeDocSubTab === 'proposta-asaas'
                      ? 'bg-[#D40B3A] text-white shadow-md'
                      : 'bg-[#111F24] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>2. Proposta Comercial Asaas (4 Planos)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDocSubTab('proposta-regua')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeDocSubTab === 'proposta-regua'
                      ? 'bg-[#D40B3A] text-white shadow-md'
                      : 'bg-[#111F24] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  <span>3. Proposta Multicobrança WhatsApp (1k-10k)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveDocSubTab('proposta-integrada')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    activeDocSubTab === 'proposta-integrada'
                      ? 'bg-[#D40B3A] text-white shadow-md'
                      : 'bg-[#111F24] text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>4. Proposta Pacote Integrado (Asaas + WhatsApp + BPO)</span>
                </button>
              </div>
            </div>

            {/* Document Parameter Editor / Customization Box */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
                  <Sliders className="w-4 h-4 text-amber-400" />
                  <span>Parâmetros Legais & Jurídicos dos Modelos de Documento</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Valores sincronizados com o Contrato Mestre e Propostas
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Versão do Contrato / Propostas:</label>
                  <input
                    type="text"
                    value={contractVersion}
                    onChange={(e) => setContractVersion(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A]"
                    placeholder="2.0 (Oficial Atualizado)"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Foro de Eleição Jurídico:</label>
                  <input
                    type="text"
                    value={contractForo}
                    onChange={(e) => setContractForo(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-bold focus:ring-1 focus:ring-[#D40B3A]"
                    placeholder="Comarca de Belo Horizonte/MG"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Representante da Contratada:</label>
                  <input
                    type="text"
                    value={MULTILAGOS_INFO.representativeName}
                    readOnly
                    className="w-full px-3 py-2 bg-[#111F24]/60 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">CNPJ da Contratada:</label>
                  <input
                    type="text"
                    value={MULTILAGOS_INFO.cnpj}
                    readOnly
                    className="w-full px-3 py-2 bg-[#111F24]/60 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  As 12 cláusulas do Contrato Mestre (MSA) e os entregáveis dos 4 planos Asaas foram atualizados para a nova versão oficial.
                </span>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="px-4 py-1.5 bg-[#D40B3A] hover:bg-[#B50931] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Salvar Parâmetros</span>
                </button>
              </div>
            </div>

            {/* Visual Live Document Preview (Real A4 document layout) */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-bold text-white">
                    Visualização em Tempo Real do Modelo Selecionado
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Renderização idêntica ao documento final do cliente</span>
                </div>
              </div>

              {/* Document Container */}
              <div className="rounded-2xl overflow-x-auto border border-slate-700 shadow-2xl bg-slate-900/60 p-2 sm:p-4">
                <div className="min-w-[794px] mx-auto flex justify-center">
                  {activeDocSubTab === 'contrato' && (
                    <div className="w-full">
                      <MasterContractDoc
                        proposal={sampleProposal}
                        clientInfo={sampleClient}
                        signatureData={sampleProposal.signature}
                        isSigned={false}
                      />
                    </div>
                  )}

                  {activeDocSubTab === 'proposta-asaas' && (
                    <div className="w-full">
                      <AsaasProposalDoc
                        proposal={sampleProposal}
                        clientInfo={sampleClient}
                        currentPlan={sampleAsaasPlan}
                        signatureData={sampleProposal.signature}
                        isSigned={false}
                      />
                    </div>
                  )}

                  {activeDocSubTab === 'proposta-regua' && (
                    <div className="w-full">
                      <MulticobrancaProposalDoc
                        proposal={{
                          ...sampleProposal,
                          serviceTrack: 'esteira-regua-n8n',
                          planId: 'regua-3k',
                          financials: {
                            ...sampleProposal.financials,
                            monthlyPrice: 299,
                            monthlyTotal: 299,
                            setupPrice: 950,
                            setupTotal: 950,
                          },
                        }}
                        clientInfo={sampleClient}
                        currentPlan={sampleReguaPlan}
                        signatureData={sampleProposal.signature}
                        isSigned={false}
                      />
                    </div>
                  )}

                  {activeDocSubTab === 'proposta-integrada' && (
                    <div className="w-full">
                      <AsaasProposalDoc
                        proposal={{
                          ...sampleProposal,
                          selectedServices: [
                            {
                              id: 'asaas',
                              category: 'asaas',
                              planId: 'pro',
                              name: 'Implantação Asaas PRO',
                              setupPrice: 1500,
                              monthlyPrice: 249,
                            },
                            {
                              id: 'regua',
                              category: 'regua-n8n',
                              planId: 'regua-3k',
                              name: 'Régua de Cobrança WhatsApp (3.000 msgs/mês)',
                              setupPrice: 950,
                              monthlyPrice: 299,
                            },
                            {
                              id: 'bpo',
                              category: 'consultoria',
                              planId: 'personalizado',
                              name: 'Consultoria e BPO Financeiro',
                              setupPrice: 1500,
                              monthlyPrice: 950,
                            },
                          ],
                          financials: {
                            ...sampleProposal.financials,
                            monthlyPrice: 1498,
                            monthlyTotal: 1498,
                            setupPrice: 3950,
                            setupTotal: 3950,
                          },
                        }}
                        clientInfo={sampleClient}
                        currentPlan={sampleAsaasPlan}
                        signatureData={sampleProposal.signature}
                        isSigned={false}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Diagnóstico & Metas da Reunião */}
        {activeTab === 'diagnostico' && (
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-700 pb-3">
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Configuração das Perguntas & Parâmetros Comerciais
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                Parâmetros Padrão Utilizados nas Reuniões de Fechamento
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              {/* Meta padrão de redução */}
              <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-3">
                <label className="text-slate-200 font-bold block">
                  Meta Padrão de Redução de Inadimplência (%):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="95"
                    step="5"
                    value={editDiag.reductionGoalPercent || 80}
                    onChange={(e) => setEditDiag({ ...editDiag, reductionGoalPercent: Number(e.target.value) })}
                    className="flex-1 accent-emerald-500 h-2 bg-slate-800 rounded-lg"
                  />
                  <span className="text-emerald-400 font-mono font-bold text-base w-16 text-right">
                    -{editDiag.reductionGoalPercent || 80}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Percentual exibido inicialmente na matriz financeira e na simulação comercial.
                </p>
              </div>

              {/* Pergunta: Pessoas no Financeiro */}
              <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-3">
                <label className="text-slate-200 font-bold block flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D40B3A]" />
                  <span>Pergunta: Quantas pessoas no financeiro/compras (Padrão inicial):</span>
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {teamSizes.map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setEditDiag({ ...editDiag, financialTeamSize: n })}
                      className={`min-w-[32px] px-2.5 py-1 rounded-md text-xs font-bold border transition-colors cursor-pointer ${
                        editDiag.financialTeamSize === n
                          ? 'bg-[#D40B3A] border-[#D40B3A] text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {n === 11 ? '+10' : n}
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-slate-400">
                  Opções de checkbox: de 1 a 10 e mais de 10 pessoas na equipe.
                </p>
              </div>

              {/* Pergunta: Modelo Principal de Cobrança */}
              <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-3">
                <label className="text-slate-200 font-bold block flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#D40B3A]" />
                  <span>Pergunta: Modelo Principal de Cobrança (Padrão inicial):</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'recorrente', label: 'Recorrente / Assinatura' },
                    { id: 'parcelamento', label: 'Parcelado / Carnê' },
                    { id: 'avulso', label: 'Venda Avulsa / Faturado' },
                    { id: 'misto', label: 'Modelo Misto' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditDiag({ ...editDiag, billingModel: m.id as BillingModel })}
                      className={`p-2 rounded-lg text-xs font-bold border text-center transition-colors cursor-pointer ${
                        editDiag.billingModel === m.id
                          ? 'bg-[#D40B3A] border-[#D40B3A] text-white'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Horas gastas por semana */}
              <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-3">
                <label className="text-slate-200 font-bold block">
                  Horas Semanais Gastas pela Equipe com Cobrança (Padrão):
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={editDiag.hoursSpentPerWeek}
                    onChange={(e) => setEditDiag({ ...editDiag, hoursSpentPerWeek: Number(e.target.value) })}
                    className="flex-1 accent-[#D40B3A]"
                  />
                  <span className="text-white font-mono font-bold text-sm w-16 text-right">
                    {editDiag.hoursSpentPerWeek}h/sem
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Utilizado para calcular o custo invisível da equipe com cobrança manual.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Configurações Asaas */}
        {activeTab === 'asaas' && (
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="border-b border-slate-700 pb-3">
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Credenciamento & Taxas Homologadas Asaas
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                Parâmetros de Integração de Conta Digital
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Ambiente Asaas:
                </label>
                <select
                  value={editAsaas.environment}
                  onChange={(e) => setEditAsaas({ ...editAsaas, environment: e.target.value as any })}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white"
                >
                  <option value="sandbox">Sandbox (Ambiente de Testes)</option>
                  <option value="production">Produção Oficial</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Taxa Homologada Pix por Liquidação (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={editAsaas.approvedRatePerLiquidation}
                  onChange={(e) => setEditAsaas({ ...editAsaas, approvedRatePerLiquidation: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold"
                />
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  Valor homologado oficial: R$ 0,99 por transação Pix recebida (exibido na proposta Asaas).
                </span>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Chave API Asaas (API Key):
                </label>
                <input
                  type="password"
                  value={editAsaas.apiKey}
                  onChange={(e) => setEditAsaas({ ...editAsaas, apiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  URL de Notificação / Webhook:
                </label>
                <input
                  type="text"
                  value={editAsaas.webhookUrl}
                  onChange={(e) => setEditAsaas({ ...editAsaas, webhookUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Publicação & Produção */}
        {activeTab === 'producao' && (
          <div className="space-y-6">
            {/* Download Imediato do ZIP Completo (100% dos Arquivos) */}
            <div className="bg-gradient-to-r from-emerald-950/80 via-[#16242A] to-[#111F24] border-2 border-emerald-500/60 rounded-2xl p-6 sm:p-7 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-bold uppercase tracking-wider border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pacote Oficial Pronto para Baixar</span>
                </div>
                <h3 className="text-xl font-bold text-white font-display">
                  Download do ZIP Completo (100% dos Arquivos do Projeto)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Geramos um pacote completo contendo o <strong>código-fonte</strong>, o <strong>Dockerfile</strong> para o Easypanel, a configuração do <strong>Nginx</strong>, o fluxo do <strong>GitHub Pages</strong> e a pasta <strong>dist</strong> com os arquivos já compilados.
                </p>
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-400 pt-1">
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">✓ Dockerfile</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">✓ nginx.conf</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">✓ dist/ (Build Pronto)</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">✓ .github/workflows</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700">✓ README-PRODUCAO.md</span>
                </div>
              </div>

              <div className="shrink-0 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadProductionZip}
                  disabled={isZipping}
                  className="w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-emerald-600/30 active:scale-98 cursor-pointer ring-2 ring-emerald-400/30"
                  title="Baixar 100% dos arquivos do projeto (código-fonte React, componentes, TypeScript, configs e Docker) pronto para subir ao Git"
                >
                  {isZipping ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                  <span>{isZipping ? 'Compactando Sistema Completo...' : 'Baixar Código Completo do Sistema (ZIP para Git)'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadDocumentsZip}
                  disabled={isZippingDocs}
                  className="w-full sm:w-auto px-5 py-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 hover:text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2.5 transition-all border border-slate-700 cursor-pointer"
                  title="Baixar apenas os arquivos de texto e markdown dos modelos jurídicos"
                >
                  {isZippingDocs ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileDown className="w-5 h-5" />}
                  <span>{isZippingDocs ? 'Compactando...' : 'Apenas Modelos de Texto (ZIP)'}</span>
                </button>
              </div>
            </div>

            {/* Banner: Entendendo o Arquivo ZIP */}
            <div className="bg-[#16242A] border border-amber-500/40 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">
                    Entendendo o Arquivo ZIP (Por que não vêm todos os arquivos?)
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Quando você exporta em ZIP, você baixa o <strong>código-fonte completo</strong> da aplicação React + TypeScript.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
                <div className="p-4 rounded-xl bg-[#111F24] border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>1. Pasta `node_modules` (Padrão Mundial)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    A pasta com as bibliotecas pesa mais de 300MB e <strong>nunca vai no ZIP nem no Git</strong>. No seu computador ou servidor ela é instalada em segundos com o comando: <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">npm install</code>.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#111F24] border border-slate-700/80 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>2. Arquivos Compilados (`dist/`)</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    O código está em TypeScript/React (<code className="text-slate-200">.tsx</code>). Para virar o HTML, CSS e JavaScript que rodam no navegador, o comando <code className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">npm run build</code> gera a pasta <code className="text-emerald-400 font-mono">dist</code> pronta.
                  </p>
                </div>
              </div>
            </div>

            {/* As 2 Formas de Colocar no Ar em simulador.multilagos.com.br */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Opção A: Easypanel na VPS Hostinger */}
              <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#D40B3A]/20 text-[#D40B3A]">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#D40B3A]">
                        Recomendado · Mais Profissional
                      </span>
                      <h4 className="text-base font-bold text-white">
                        Opção A: Easypanel na VPS Hostinger
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    O projeto já possui os arquivos <code className="text-emerald-400">Dockerfile</code> e <code className="text-emerald-400">nginx.conf</code> configurados para compilar e servir o site automaticamente.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">1</span>
                      <span>Suba o projeto para um repositório no seu <strong>GitHub</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">2</span>
                      <span>No <strong>Easypanel</strong>, clique em <strong>+ Service</strong> &gt; <strong>App</strong> e conecte o repositório GitHub.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">3</span>
                      <span>Na aba <strong>Domains</strong>, adicione <strong className="text-white">simulador.multilagos.com.br</strong> e ative o SSL gratuito.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">4</span>
                      <span>Clique em <strong>Deploy</strong>. O Easypanel compila e coloca no ar sozinho!</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Configuração Docker Nginx já embutida na raiz do projeto.</span>
                </div>
              </div>

              {/* Opção B: GitHub Pages */}
              <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                        Zero Custo de Servidor
                      </span>
                      <h4 className="text-base font-bold text-white">
                        Opção B: GitHub Pages Automatizado
                      </h4>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Criamos o fluxo <code className="text-emerald-400">.github/workflows/deploy.yml</code> que compila o projeto a cada push no GitHub.
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">1</span>
                      <span>Envie os arquivos para o repositório do seu GitHub.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">2</span>
                      <span>No GitHub, vá em <strong>Settings</strong> &gt; <strong>Pages</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">3</span>
                      <span>Em <strong>Build and deployment Source</strong>, selecione <strong>GitHub Actions</strong>.</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-300">
                      <span className="font-bold text-white bg-slate-800 w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[11px]">4</span>
                      <span>Em <strong>Custom domain</strong>, digite <strong className="text-white">simulador.multilagos.com.br</strong> e salve.</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700/80 text-[11px] text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Workflow de build e deploy automático incluído no repositório.</span>
                </div>
              </div>

            </div>

            {/* Tabela de Apontamento DNS */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                <FileCode className="w-4 h-4 text-[#D40B3A]" />
                <span>Configuração de DNS na Hostinger / Registro de Domínio</span>
              </div>
              <p className="text-xs text-slate-300">
                Acesse o painel onde está registrado o domínio <code className="text-white font-semibold">multilagos.com.br</code> e adicione uma entrada:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
                  <thead className="bg-[#111F24] text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-3">Destino Escolhido</th>
                      <th className="p-3">Tipo</th>
                      <th className="p-3">Nome / Host</th>
                      <th className="p-3">Aponta para (Valor)</th>
                      <th className="p-3">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    <tr>
                      <td className="p-3 font-sans text-white font-medium">Easypanel (VPS Hostinger)</td>
                      <td className="p-3 text-emerald-400 font-bold">A</td>
                      <td className="p-3 text-white">simulador</td>
                      <td className="p-3 text-slate-300">IP_DA_SUA_VPS_HOSTINGER</td>
                      <td className="p-3 text-slate-400">3600</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-sans text-white font-medium">GitHub Pages</td>
                      <td className="p-3 text-blue-400 font-bold">CNAME</td>
                      <td className="p-3 text-white">simulador</td>
                      <td className="p-3 text-slate-300">seu-usuario.github.io</td>
                      <td className="p-3 text-slate-400">3600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: Google Drive & Planilhas */}
        {activeTab === 'google' && (
          <div className="space-y-6">
            
            {/* Account Status Card */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                    <FolderOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      Integração Oficial Google Workspace
                    </span>
                    <h3 className="text-xl font-bold text-white font-display">
                      Google Drive & Google Sheets
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Arquivamento automático dos PDFs assinados e registro em tempo real de cada aceite em planilha.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {googleUser ? (
                    <div className="flex items-center gap-3">
                      <div className="text-right text-xs">
                        <span className="text-emerald-400 font-bold block">Conectado</span>
                        <span className="text-slate-400 block">{googleUser.email}</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDisconnectGoogle}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
                      >
                        Desconectar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConnectGoogle}
                      disabled={isGoogleLoading}
                      className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
                    >
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                      <span>{isGoogleLoading ? 'Conectando...' : 'Conectar com Google'}</span>
                    </button>
                  )}
                </div>
              </div>

              {googleStatusMsg && (
                <div className="p-3.5 bg-blue-950/60 border border-blue-700/60 rounded-xl text-xs text-blue-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{googleStatusMsg}</span>
                </div>
              )}

              {/* Targets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Pasta Google Drive */}
                <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <FolderOpen className="w-4 h-4 text-blue-400" />
                      <span>Pasta no Google Drive</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      Automático
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p>
                      Nome padrão da pasta: <strong className="text-white">Multilagos - Contratos Assinados</strong>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Quando o cliente confirma o aceite e assina digitalmente, ambos os PDFs (Proposta Comercial e Contrato Mestre) são convertidos em alta definição e enviados diretamente para esta pasta no Drive.
                    </p>
                  </div>

                  {googleFolderUrl && (
                    <a
                      href={googleFolderUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-bold pt-1"
                    >
                      <span>Abrir Pasta no Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

                {/* Planilha Google Sheets */}
                <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-emerald-400" />
                      <span>Planilha Google Sheets</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                      Automático
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 text-slate-300">
                    <p>
                      Nome padrão da planilha: <strong className="text-white">Multilagos - Registro de Contratos e Aceites</strong>
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      Cada aceite insere uma nova linha completa com Razão Social, CNPJ, Representante, CPF, E-mail, Telefone, Serviços Contratados, Setup, Mensalidade, Status Asaas, Hash Digital, IP e os links diretos para os arquivos PDF no Drive.
                    </p>
                  </div>

                  {googleSheetUrl && (
                    <a
                      href={googleSheetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-bold pt-1"
                    >
                      <span>Abrir Planilha Google Sheets</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>

              </div>

              {/* Action: Test Connection & Create Folder/Sheet */}
              {googleUser && (
                <div className="pt-3 border-t border-slate-700/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Verifique se as permissões de acesso ao Drive e Sheets estão ativas:
                  </span>
                  <button
                    type="button"
                    onClick={handleTestWorkspace}
                    disabled={isGoogleLoading}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {isGoogleLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Verificando...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Verificar Pasta & Planilha no Google</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
