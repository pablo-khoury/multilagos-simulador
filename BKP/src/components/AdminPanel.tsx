import React, { useState } from 'react';
import JSZip from 'jszip';
import { Plan, AsaasConfig, DiagnosticSheetData, BillingModel } from '../types';
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
  Download
} from 'lucide-react';
import { MultilagosLogo } from './MultilagosLogo';
import { formatBRL } from '../utils/calculator';

interface AdminPanelProps {
  plans: Plan[];
  asaasConfig: AsaasConfig;
  diagnosticData: DiagnosticSheetData;
  onSavePlans: (plans: Plan[]) => void;
  onSaveAsaasConfig: (config: AsaasConfig) => void;
  onSaveDiagnosticData: (data: DiagnosticSheetData) => void;
  onResetDefaults: () => void;
  onCloseAdmin: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  plans,
  asaasConfig,
  diagnosticData,
  onSavePlans,
  onSaveAsaasConfig,
  onSaveDiagnosticData,
  onResetDefaults,
  onCloseAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<'planos' | 'asaas' | 'diagnostico' | 'producao'>('planos');
  
  // Local editable copies
  const [editPlans, setEditPlans] = useState<Plan[]>(plans);
  const [editAsaas, setEditAsaas] = useState<AsaasConfig>(asaasConfig);
  const [editDiag, setEditDiag] = useState<DiagnosticSheetData>(diagnosticData);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  // Direct download of the complete full-project ZIP (2.1 MB with all src/ files + dist/ + docker)
  const handleDownloadProductionZip = () => {
    setIsZipping(true);
    try {
      const a = document.createElement('a');
      a.href = '/simulador-multilagos-completo.zip';
      a.download = 'simulador-multilagos-completo.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Falha ao baixar ZIP:', err);
      window.location.href = '/simulador-multilagos-completo.zip';
    } finally {
      setTimeout(() => setIsZipping(false), 800);
    }
  };

  // Plan editing helper
  const handleUpdatePlan = (index: number, field: keyof Plan, value: any) => {
    const updated = [...editPlans];
    updated[index] = { ...updated[index], [field]: value };
    setEditPlans(updated);
  };

  const handleSaveAll = () => {
    onSavePlans(editPlans);
    onSaveAsaasConfig(editAsaas);
    onSaveDiagnosticData(editDiag);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

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
            <a
              href="/simulador-multilagos-completo.zip"
              download="simulador-multilagos-completo.zip"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              title="Baixar pacote ZIP completo com 100% dos arquivos do projeto (incluindo src/ e dist/)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar ZIP Completo (src + build)</span>
            </a>

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
            <span>Publicação & Produção (simulador.multilagos.com.br)</span>
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
                </div>
              ))}
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

              <div className="shrink-0">
                <a
                  href="/simulador-multilagos-completo.zip"
                  download="simulador-multilagos-completo.zip"
                  className="w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-extrabold flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-emerald-600/30 active:scale-98 cursor-pointer"
                >
                  <Download className="w-5 h-5" />
                  <span>Baixar ZIP Completo Agora (2.1 MB)</span>
                </a>
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

      </div>
    </div>
  );
};
