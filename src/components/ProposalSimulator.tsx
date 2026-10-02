import React, { useState } from 'react';
import { 
  Plan, 
  PlanId, 
  ServiceTrack, 
  CommercialProposal, 
  ProposalFinancials,
  DiagnosticSheetData
} from '../types';
import { formatBRL, encodeProposalToUrlParam, calculateDiagnosticMetrics } from '../utils/calculator';
import { MULTILAGOS_INFO } from '../data/mockData';
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
  Plus
} from 'lucide-react';

interface ProposalSimulatorProps {
  plans: Plan[];
  selectedServiceTrack: ServiceTrack;
  selectedPlanId: PlanId;
  activeProposal: CommercialProposal;
  diagnosticData?: DiagnosticSheetData;
  onUpdateTrack: (track: ServiceTrack) => void;
  onUpdatePlan: (planId: PlanId) => void;
  onUpdateFinancials: (fin: ProposalFinancials) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateCustomFeatures?: (features: string[]) => void;
  onUpdateDiagnostic?: (data: DiagnosticSheetData) => void;
  onProceedToClientAcceptance: () => void;
}

export const ProposalSimulator: React.FC<ProposalSimulatorProps> = ({
  plans,
  selectedServiceTrack,
  selectedPlanId,
  activeProposal,
  diagnosticData,
  onUpdateTrack,
  onUpdatePlan,
  onUpdateFinancials,
  onUpdateNotes,
  onUpdateCustomFeatures,
  onUpdateDiagnostic,
  onProceedToClientAcceptance,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [previewDocType, setPreviewDocType] = useState<'proposal' | 'contract'>('proposal');
  const [newFeatureInput, setNewFeatureInput] = useState('');

  const asaasPlans = plans.filter((p) => p.track === 'asaas');
  const reguaPlans = plans.filter((p) => p.track === 'regua-n8n');
  const visiblePlans = selectedServiceTrack === 'esteira-asaas' ? asaasPlans : reguaPlans;

  const currentPlan = plans.find((p) => p.id === selectedPlanId) || visiblePlans[0] || plans[0];
  const fin = activeProposal.financials;

  const activeDiag = diagnosticData || activeProposal.diagnosticData;
  const diagMetrics = activeDiag ? calculateDiagnosticMetrics(activeDiag) : null;
  const activeScopeList = activeProposal.customFeatures || currentPlan.features;

  // Handle plan change and reset base prices
  const handleSelectPlan = (plan: Plan) => {
    onUpdatePlan(plan.id);
    if (onUpdateCustomFeatures) {
      onUpdateCustomFeatures(plan.features);
    }
    const newBaseSetup = plan.baseSetupPrice;
    const newBaseMonthly = plan.baseMonthlyPrice;

    const setupTotal = fin.setupDiscountApplied 
      ? Math.max(0, newBaseSetup - fin.setupDiscountValue) 
      : newBaseSetup;

    const monthlyTotal = fin.monthlyDiscountApplied 
      ? Math.max(0, newBaseMonthly - fin.monthlyDiscountValue) 
      : newBaseMonthly;

    onUpdateFinancials({
      ...fin,
      setupPrice: newBaseSetup,
      setupTotal,
      monthlyPrice: newBaseMonthly,
      monthlyTotal,
      monthlyWithPromptDiscount: Math.round(monthlyTotal * 0.95),
    });
  };

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

  const handleResetScopeToDefault = () => {
    if (onUpdateCustomFeatures) {
      onUpdateCustomFeatures(currentPlan.features);
    }
  };

  // Discount toggles and inputs
  const handleToggleSetupDiscount = (applied: boolean) => {
    const discVal = applied ? (fin.setupDiscountValue || 250) : 0;
    const setupTotal = Math.max(0, fin.setupPrice - discVal);
    onUpdateFinancials({
      ...fin,
      setupDiscountApplied: applied,
      setupDiscountValue: discVal,
      setupTotal,
    });
  };

  const handleChangeSetupDiscountValue = (val: number) => {
    const setupTotal = Math.max(0, fin.setupPrice - val);
    onUpdateFinancials({
      ...fin,
      setupDiscountValue: val,
      setupTotal,
    });
  };

  const handleToggleMonthlyDiscount = (applied: boolean) => {
    const discVal = applied ? (fin.monthlyDiscountValue || 50) : 0;
    const monthlyTotal = Math.max(0, fin.monthlyPrice - discVal);
    onUpdateFinancials({
      ...fin,
      monthlyDiscountApplied: applied,
      monthlyDiscountValue: discVal,
      monthlyTotal,
      monthlyWithPromptDiscount: Math.round(monthlyTotal * 0.95),
    });
  };

  const handleChangeMonthlyDiscountValue = (val: number) => {
    const monthlyTotal = Math.max(0, fin.monthlyPrice - val);
    onUpdateFinancials({
      ...fin,
      monthlyDiscountValue: val,
      monthlyTotal,
      monthlyWithPromptDiscount: Math.round(monthlyTotal * 0.95),
    });
  };

  // Generate high-reliability client link with encoded proposal payload
  const encodedPayload = encodeProposalToUrlParam(activeProposal);
  const clientShareUrl = `${window.location.origin}${window.location.pathname}?proposta=${activeProposal.id}&p=${encodedPayload}`;

  const handleCopyClientLink = () => {
    navigator.clipboard.writeText(clientShareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleSendWhatsAppToClient = () => {
    const planName = currentPlan.name;
    const trackLabel = selectedServiceTrack === 'esteira-asaas' ? 'Implementação Asaas' : 'Multicobrança WhatsApp';
    const text = encodeURIComponent(
      `Olá! Aqui é o ${MULTILAGOS_INFO.representativeName} da Multilagos (Negócios & Tecnologia).\n\n` +
      `Conforme alinhamos em nossa reunião, elaborei sua proposta comercial personalizada (Nº ${activeProposal.id}):\n` +
      `• Serviço: ${trackLabel}\n` +
      `• Plano: ${planName}\n` +
      `• Mensalidade: ${formatBRL(fin.monthlyTotal)} (ou ${formatBRL(fin.monthlyWithPromptDiscount)} pagando até o dia 05)\n` +
      `• Taxa de Setup / Implantação: ${formatBRL(fin.setupTotal)}\n\n` +
      `Acesse o link seguro exclusivo para conferir o contrato mestre, preencher os dados da sua empresa e confirmar o aceite digital:\n` +
      `${clientShareUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSendEmailToClient = () => {
    const trackLabel = selectedServiceTrack === 'esteira-asaas' ? 'Implementação Asaas' : 'Multicobrança WhatsApp';
    const subject = encodeURIComponent(`Proposta Comercial Multilagos - ${trackLabel} [Nº ${activeProposal.id}]`);
    const body = encodeURIComponent(
      `Prezado(a),\n\n` +
      `Conforme nossa reunião, segue o link seguro da sua proposta comercial e Contrato Mestre vinculado (Nº ${activeProposal.contractMasterId}):\n\n` +
      `- Solução: ${trackLabel}\n` +
      `- Plano: ${currentPlan.name}\n` +
      `- Mensalidade: ${formatBRL(fin.monthlyTotal)}\n` +
      `- Implantação: ${formatBRL(fin.setupTotal)}\n\n` +
      `Para formalizar a contratação e fazer o download dos documentos em PDF, acesse o link:\n` +
      `${clientShareUrl}\n\n` +
      `Atenciosamente,\n` +
      `${MULTILAGOS_INFO.representativeName}\n` +
      `${MULTILAGOS_INFO.companyName}\n` +
      `${MULTILAGOS_INFO.phone}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
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

  return (
    <section id="simulador" className="py-12 bg-[#111F24] text-[#CDDADE] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
              <span>Etapa 2 · Preparação da Proposta</span>
              <span aria-hidden="true">·</span>
              <span>Painel do Consultor</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-display">
              Simulador Comercial & Condições de Fechamento
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              Proposta: <strong className="text-white">{activeProposal.id}</strong>
            </span>
          </div>
        </div>

        {/* Esteira Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              onUpdateTrack('esteira-asaas');
              handleSelectPlan(asaasPlans.find((p) => p.id === 'pro') || asaasPlans[0]);
            }}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-lg ${
              selectedServiceTrack === 'esteira-asaas'
                ? 'bg-[#192A32] border-[#D40B3A] ring-1 ring-[#D40B3A]'
                : 'bg-[#16242A] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D40B3A]">
                Esteira 1
              </span>
              {selectedServiceTrack === 'esteira-asaas' && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#D40B3A] animate-pulse" />
              )}
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              Implementação Asaas (Conta Digital & NFS-e)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Solução completa com conta digital homologada, régua no WhatsApp, emissão automática de NFS-e, split e conciliação.
            </p>
          </button>

          <button
            type="button"
            onClick={() => {
              onUpdateTrack('esteira-regua-n8n');
              handleSelectPlan(reguaPlans.find((p) => p.id === 'regua-3k') || reguaPlans[0]);
            }}
            className={`p-5 rounded-2xl border text-left transition-all cursor-pointer relative shadow-lg ${
              selectedServiceTrack === 'esteira-regua-n8n'
                ? 'bg-[#192A32] border-[#D40B3A] ring-1 ring-[#D40B3A]'
                : 'bg-[#16242A] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D40B3A]">
                Esteira 2
              </span>
              {selectedServiceTrack === 'esteira-regua-n8n' && (
                <span className="w-2.5 h-2.5 rounded-full bg-[#D40B3A] animate-pulse" />
              )}
            </div>
            <h3 className="text-lg font-bold text-white font-display">
              Multicobrança (Cobrança Automática WhatsApp)
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              Para empresas que já têm banco ou ERP próprio e buscam apenas a régua automatizada no WhatsApp sem trocar de sistema.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/60">
              <span>Custos da Meta (WhatsApp) incluídos na mensalidade</span>
            </div>
          </button>
        </div>

        {/* Plans Grid for the Active Track */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Selecione o Plano Contratado:
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Estrutura completa com escopo detalhado de cada plano
              </p>
            </div>
            <span className="text-xs text-[#D40B3A] font-semibold bg-[#D40B3A]/10 border border-[#D40B3A]/30 px-3 py-1 rounded-lg">
              Plano Ativo: <strong>{currentPlan.name}</strong>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {visiblePlans.map((plan) => {
              const isSelected = plan.id === currentPlan.id;
              return (
                <div
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between relative shadow-lg ${
                    isSelected
                      ? 'bg-[#182830] border-[#D40B3A] ring-2 ring-[#D40B3A]/80 shadow-2xl'
                      : 'bg-[#16242A] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Plano
                      </span>
                      {plan.recommended && (
                        <span className="text-[10px] font-bold text-white bg-[#D40B3A] px-2 py-0.5 rounded-full">
                          Mais Indicado
                        </span>
                      )}
                      {isSelected && !plan.recommended && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full">
                          ✓ Ativo
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xl font-bold text-white font-display">
                        {plan.name}
                      </h4>
                      <p className="text-xs text-slate-300 mt-1 leading-snug">
                        {plan.headline}
                      </p>
                    </div>

                    {/* Preços */}
                    <div className="pt-2 border-t border-slate-800 space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-slate-400">Mensalidade:</span>
                        <span className="text-base font-extrabold text-[#D40B3A] font-mono">
                          {plan.baseMonthlyPrice > 0 ? formatBRL(plan.baseMonthlyPrice) : 'Sob consulta'}
                        </span>
                      </div>
                      {plan.baseSetupPrice > 0 && (
                        <div className="flex items-baseline justify-between text-[11px] text-slate-400">
                          <span>Setup único:</span>
                          <span className="font-mono text-slate-200">{formatBRL(plan.baseSetupPrice)}</span>
                        </div>
                      )}
                    </div>

                    {/* Escopo Completo do Plano */}
                    <div className="pt-3 border-t border-slate-800 space-y-1.5 flex-1">
                      <span className="text-[10.5px] font-bold text-slate-300 uppercase tracking-wider block">
                        Escopo Incluso ({plan.features.length} itens):
                      </span>
                      <ul className="space-y-1 text-xs text-slate-300">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 leading-snug">
                            <Check className="w-3.5 h-3.5 text-[#D40B3A] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan);
                      }}
                      className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#D40B3A] text-white shadow-md'
                          : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                    >
                      {isSelected ? 'Plano Selecionado' : 'Selecionar Plano'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Customização Interativa do Escopo do Plano: Adicionar e Tirar Itens */}
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                    Personalização do Escopo Contratado
                  </span>
                  <span className="text-[11px] font-bold text-slate-200 bg-slate-800 px-2 py-0.5 rounded">
                    Plano Ativo: {currentPlan.name}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white mt-0.5 font-display">
                  Adicionar e Tirar Itens do Escopo da Proposta
                </h3>
                <p className="text-xs text-slate-400">
                  Adicione novos itens customizados ou remova itens que não façam parte da negociação deste cliente. As alterações refletem diretamente na proposta e no contrato.
                </p>
              </div>

              <button
                type="button"
                onClick={handleResetScopeToDefault}
                className="text-xs font-semibold text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/80 transition-colors cursor-pointer self-start sm:self-auto"
              >
                Restaurar Padrão do Plano
              </button>
            </div>

            {/* Input para Adicionar Novo Item ao Escopo */}
            <form onSubmit={handleAddCustomFeature} className="flex gap-2">
              <input
                type="text"
                value={newFeatureInput}
                onChange={(e) => setNewFeatureInput(e.target.value)}
                placeholder="Adicionar novo item ao escopo (ex: Integração customizada com ERP SAP, Treinamento presencial extra...)"
                className="flex-1 bg-[#111F24] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#D40B3A]"
              />
              <button
                type="submit"
                disabled={!newFeatureInput.trim()}
                className="px-4 py-2 bg-[#D40B3A] hover:bg-[#B50931] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar ao Escopo</span>
              </button>
            </form>

            {/* Lista dos Itens do Escopo com Botão de Tirar/Remover */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {activeScopeList.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#111F24] border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden pr-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="text-xs text-slate-200 truncate" title={item}>
                      {item}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(idx)}
                    className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer shrink-0"
                    title="Remover este item do escopo da proposta"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Delinquency Reduction Target & Financial Simulation in Meeting */}
        {activeDiag && diagMetrics && (
          <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-700 gap-4">
              <div>
                <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                  Simulação de Impacto Financeiro na Reunião
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                  Meta de Redução da Inadimplência & Projeção de Recuperação
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Ajuste a meta percentual durante a conversa para demonstrar o retorno financeiro real no caixa do cliente.
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
              {/* Slider & Input */}
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

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Inadimplentes atuais: <strong className="text-white">{activeDiag.delinquentClientCount} empresas</strong></span>
                  <span className="text-emerald-400 font-semibold">↳ Cai para: <strong className="text-white">{diagMetrics.targetDelinquentClients} empresas</strong></span>
                </div>
              </div>

              {/* Metrics Cards */}
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
                      <span className="text-slate-400 block">Mensalidade da Solução:</span>
                      <span className="text-white font-mono font-bold">{formatBRL(fin.monthlyTotal)}/mês</span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10.5px] text-emerald-200 bg-emerald-900/40 px-2.5 py-1 rounded border border-emerald-700/50">
                    ✓ O retorno gerado pela recuperação de recebíveis supera em múltiplas vezes a mensalidade do serviço.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Adjuster & Discounts Section */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="border-b border-slate-700 pb-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Resumo Financeiro & Descontos em Reunião
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5 font-display">
                Condições Comerciais da Proposta
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              Reflete exatamente no PDF da Proposta
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Setup Controls */}
            <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  1. Taxa de Implantação (Setup)
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Tabela: {formatBRL(fin.setupPrice)}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fin.setupDiscountApplied}
                    onChange={(e) => handleToggleSetupDiscount(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D40B3A] border-slate-700 accent-[#D40B3A]"
                  />
                  <span className="text-slate-200 font-semibold">
                    Aplicar desconto sobre o setup
                  </span>
                </label>

                {fin.setupDiscountApplied && (
                  <div className="space-y-2 pt-1 pl-6">
                    <div>
                      <label className="text-slate-400 block mb-1">Valor do Desconto (R$):</label>
                      <input
                        type="number"
                        value={fin.setupDiscountValue}
                        onChange={(e) => handleChangeSetupDiscountValue(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#16242A] border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Motivo do Desconto no Contrato:</label>
                      <input
                        type="text"
                        placeholder="Ex: Condição especial de reunião"
                        value={fin.setupDiscountReason || ''}
                        onChange={(e) => onUpdateFinancials({ ...fin, setupDiscountReason: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#16242A] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">Setup Final Contratado:</span>
                  <span className="text-xl font-bold text-white font-mono">
                    {formatBRL(fin.setupTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Monthly Controls */}
            <div className="p-5 rounded-xl bg-[#111F24] border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  2. Mensalidade de Gestão & Suporte
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Tabela: {formatBRL(fin.monthlyPrice)}/mês
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fin.monthlyDiscountApplied}
                    onChange={(e) => handleToggleMonthlyDiscount(e.target.checked)}
                    className="w-4 h-4 rounded text-[#D40B3A] border-slate-700 accent-[#D40B3A]"
                  />
                  <span className="text-slate-200 font-semibold">
                    Aplicar desconto sobre a mensalidade
                  </span>
                </label>

                {fin.monthlyDiscountApplied && (
                  <div className="space-y-2 pt-1 pl-6">
                    <div>
                      <label className="text-slate-400 block mb-1">Valor do Desconto Mensal (R$):</label>
                      <input
                        type="number"
                        value={fin.monthlyDiscountValue}
                        onChange={(e) => handleChangeMonthlyDiscountValue(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#16242A] border border-slate-700 rounded-lg text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Motivo do Desconto no Contrato:</label>
                      <input
                        type="text"
                        placeholder="Ex: Parceria estratégica anual"
                        value={fin.monthlyDiscountReason || ''}
                        onChange={(e) => onUpdateFinancials({ ...fin, monthlyDiscountReason: e.target.value })}
                        className="w-full px-3 py-1.5 bg-[#16242A] border border-slate-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Mensalidade Contratada:</span>
                    <span className="text-xl font-bold text-[#D40B3A] font-mono">
                      {formatBRL(fin.monthlyTotal)}/mês
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 pt-1">
                    <span>Com pontualidade (5% até dia 05):</span>
                    <span className="font-mono font-bold">
                      {formatBRL(fin.monthlyWithPromptDiscount)}/mês
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Anotações ou Obs. (Espaço livre para anotações do consultor) */}
          <div className="p-4 rounded-xl bg-[#111F24] border border-slate-800 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200">
                <FileText className="w-3.5 h-3.5 text-[#D40B3A]" />
                <span>Anotações ou Obs.</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Livre para anotações do consultor sobre a negociação, prazos ou particularidades
              </span>
            </div>
            <textarea
              rows={3}
              value={activeProposal.notes || ''}
              onChange={(e) => onUpdateNotes && onUpdateNotes(e.target.value)}
              placeholder="Digite aqui anotações livres sobre a reunião comercial, particularidades da operação do cliente, observações para o contrato ou lembretes de fechamento..."
              className="w-full px-3.5 py-2.5 bg-[#16242A] border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-[#D40B3A] resize-y leading-relaxed"
            />
          </div>

          {/* Action Row for the Consultant: Send, Copy, PDF */}
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
                <span>Prévia: Proposta Oficial ({selectedServiceTrack === 'esteira-asaas' ? 'Asaas' : 'Multicobrança'})</span>
              </button>

              <button
                onClick={() => setPreviewDocType('contract')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  previewDocType === 'contract' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>Prévia: Contrato Mestre (MSA 12 Cláusulas)</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Layout 100% idêntico ao modelo original
            </span>
          </div>

          <div className="rounded-2xl overflow-x-auto border border-slate-700 shadow-2xl bg-slate-900/60 p-2 sm:p-4">
            <div className="min-w-[794px] mx-auto flex justify-center">
              <div style={{ display: previewDocType === 'proposal' ? 'block' : 'none' }} className="w-full">
                {selectedServiceTrack === 'esteira-asaas' ? (
                  <AsaasProposalDoc
                    proposal={activeProposal}
                    clientInfo={activeProposal.clientInfo}
                    currentPlan={currentPlan}
                    signatureData={activeProposal.signature}
                    isSigned={false}
                  />
                ) : (
                  <MulticobrancaProposalDoc
                    proposal={activeProposal}
                    clientInfo={activeProposal.clientInfo}
                    currentPlan={currentPlan}
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
