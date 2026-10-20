import React, { useState } from 'react';
import { DiagnosticSheetData, PlanId, ServiceTrack, BillingModel } from '../types';
import { calculateDiagnosticMetrics, formatBRL, formatPercent } from '../utils/calculator';
import { MultilagosLogo } from './MultilagosLogo';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  ChevronDown,
  Users,
  Repeat,
  FileText
} from 'lucide-react';

interface DiagnosticToolProps {
  diagnosticData: DiagnosticSheetData;
  onUpdateDiagnostic: (data: DiagnosticSheetData) => void;
  onApplyRecommendation: (track: ServiceTrack, planId: PlanId, companyName: string) => void;
}

export const DiagnosticTool: React.FC<DiagnosticToolProps> = ({
  diagnosticData,
  onUpdateDiagnostic,
  onApplyRecommendation,
}) => {
  const [showFullProjectionTable, setShowFullProjectionTable] = useState(false);

  const metrics = calculateDiagnosticMetrics(diagnosticData);

  const handleFieldChange = <K extends keyof DiagnosticSheetData>(
    field: K,
    value: DiagnosticSheetData[K]
  ) => {
    onUpdateDiagnostic({
      ...diagnosticData,
      [field]: value,
    });
  };

  const handleResetDefaults = () => {
    onUpdateDiagnostic({
      companyName: '',
      segment: 'Serviços em Geral',
      monthlyRevenue: 30000,
      clientCount: 130,
      delinquentClientCount: 10,
      newClientsPerMonth: 5,
      churnClientsPerMonth: 3,
      issuesNfse: 'sim',
      hasCommissionOrSplit: 'nao',
      billingModel: 'recorrente',
      financialTeamSize: 3,
      paymentMethods: {
        pix: true,
        pixFee: 0,
        boleto: true,
        boletoFee: 0,
        creditCard: true,
        debitCard: false,
      },
      currentSystem: '',
      collectionMethodNotes: 'Cobrança manual e envio avulso',
      hoursSpentPerWeek: 8,
      reductionGoalPercent: 80,
    });
  };

  const teamSizes = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  return (
    <section id="diagnostico" className="py-10 bg-[#111F24] text-[#CDDADE] border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header - Spreadsheet style */}
        <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <MultilagosLogo variant="dark" height={38} />
            <div className="pl-4 border-l border-slate-700">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#D40B3A]">
                Ferramenta de Reunião Comercial
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
                Diagnóstico Inicial & Matriz de Inadimplência
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetDefaults}
              className="text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Limpar e restaurar valores padrão"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Dados</span>
            </button>
          </div>
        </div>

        {/* Main Workstation: Inputs Grid (Left) + Calculated Metrics (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Input Form (5 cols) */}
          <div className="lg:col-span-5 bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4 shadow-lg">
            <div className="border-b border-slate-700 pb-3">
              <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                Mapeamento Operacional
              </span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Perguntas & Parâmetros do Negócio
              </h3>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Nome da Empresa & Segmento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Nome da Empresa:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Minha Empresa"
                    value={diagnosticData.companyName}
                    onChange={(e) => handleFieldChange('companyName', e.target.value)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Segmento de Atuação:
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Serviços, Saúde, TI"
                    value={diagnosticData.segment}
                    onChange={(e) => handleFieldChange('segment', e.target.value)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Faturamento e Clientes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Faturamento (R$):
                  </label>
                  <input
                    type="number"
                    value={diagnosticData.monthlyRevenue || ''}
                    onChange={(e) => handleFieldChange('monthlyRevenue', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Qnt. Clientes:
                  </label>
                  <input
                    type="number"
                    value={diagnosticData.clientCount || ''}
                    onChange={(e) => handleFieldChange('clientCount', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Inadimplentes:
                  </label>
                  <input
                    type="number"
                    value={diagnosticData.delinquentClientCount || ''}
                    onChange={(e) => handleFieldChange('delinquentClientCount', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Inadimplência calculada em tempo real */}
              <div className="p-3 rounded-xl bg-[#111F24] border border-red-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">% de Inadimplência Calculada:</span>
                  <span className="text-base font-extrabold text-[#D40B3A] font-mono">
                    {formatPercent(metrics.delinquencyRate)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Atrasado / Mês:</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    {formatBRL(metrics.delinquencyAmount)}
                  </span>
                </div>
              </div>

              {/* Pergunta Nova: Modelo Principal de Cobrança */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#D40B3A]" />
                  <span>Modelo Principal de Cobrança:</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'recorrente', label: 'Recorrente / Assinatura' },
                    { id: 'parcelamento', label: 'Parcelado / Carnê' },
                    { id: 'avulso', label: 'Venda Avulsa / Faturado' },
                    { id: 'misto', label: 'Modelo Misto' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleFieldChange('billingModel', m.id as BillingModel)}
                      className={`py-2 px-2 rounded-lg border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        diagnosticData.billingModel === m.id
                          ? 'bg-[#D40B3A] border-[#D40B3A] text-white shadow-md'
                          : 'bg-[#111F24] border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pergunta Nova: Quantas pessoas trabalham no financeiro/faturamento */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1.5 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#D40B3A]" />
                  <span>Quantas pessoas trabalham no financeiro / faturamento e compras hoje?</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {teamSizes.map((n) => {
                    const isSelected = diagnosticData.financialTeamSize === n;
                    const label = n === 11 ? '+10 pessoas' : `${n}`;
                    return (
                      <button
                        key={n}
                        type="button"
                        onClick={() => handleFieldChange('financialTeamSize', n)}
                        className={`min-w-[34px] px-2.5 py-1.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D40B3A] border-[#D40B3A] text-white shadow-md'
                            : 'bg-[#111F24] border-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Crescimento: Novos clientes vs Saídas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Novos clientes / mês:
                  </label>
                  <input
                    type="number"
                    value={diagnosticData.newClientsPerMonth || ''}
                    onChange={(e) => handleFieldChange('newClientsPerMonth', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Saída de clientes / mês:
                  </label>
                  <input
                    type="number"
                    value={diagnosticData.churnClientsPerMonth || ''}
                    onChange={(e) => handleFieldChange('churnClientsPerMonth', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>
              </div>

              {/* Emite Nota Fiscal & Faz Split */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Emite Nota Fiscal (NFS-e)?
                  </label>
                  <select
                    value={diagnosticData.issuesNfse}
                    onChange={(e) => handleFieldChange('issuesNfse', e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  >
                    <option value="sim">Sim (deseja automatizar)</option>
                    <option value="manual">Manual na prefeitura</option>
                    <option value="nao">Não emite / Isento</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-semibold block mb-1">
                    Comissão / Split de Repasse?
                  </label>
                  <select
                    value={diagnosticData.hasCommissionOrSplit}
                    onChange={(e) => handleFieldChange('hasCommissionOrSplit', e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  >
                    <option value="sim">Sim (tem parceiros/comissão)</option>
                    <option value="nao">Não (recebe 100% integral)</option>
                  </select>
                </div>
              </div>

              {/* Sistema Atual & Rotina de Cobrança */}
              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Utiliza algum sistema de gestão ou ERP? Qual?
                </label>
                <input
                  type="text"
                  placeholder="Ex: Omie, Conta Azul, Bling, Planilha Excel, Nenhum"
                  value={diagnosticData.currentSystem}
                  onChange={(e) => handleFieldChange('currentSystem', e.target.value)}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Como faz a cobrança e recebimento hoje?
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Envia boleto avulso por WhatsApp, confere extrato no fim do mês manualmente..."
                  value={diagnosticData.collectionMethodNotes}
                  onChange={(e) => handleFieldChange('collectionMethodNotes', e.target.value)}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">
                  Horas gastas pela equipe com cobrança por semana:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={diagnosticData.hoursSpentPerWeek}
                    onChange={(e) => handleFieldChange('hoursSpentPerWeek', Number(e.target.value))}
                    className="flex-1 accent-[#D40B3A]"
                  />
                  <span className="font-mono font-bold text-white text-sm shrink-0">
                    {diagnosticData.hoursSpentPerWeek}h/sem
                  </span>
                </div>
              </div>

              {/* Anotações ou Obs. (Livre para anotações do consultor) */}
              <div className="pt-2 border-t border-slate-700/80">
                <label className="text-slate-200 font-semibold block mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-[#D40B3A] font-bold uppercase tracking-wider">
                    <FileText className="w-3.5 h-3.5" />
                    Anotações ou Obs.
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Livre para anotações da reunião</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Escreva livremente observações da conversa, prazos solicitados pelo cliente, particularidades operacionais, pontos de atenção ou notas para fechamento..."
                  value={diagnosticData.generalNotes || ''}
                  onChange={(e) => handleFieldChange('generalNotes', e.target.value)}
                  className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-xl text-white font-medium focus:ring-1 focus:ring-[#D40B3A] focus:outline-none resize-y text-xs placeholder:text-slate-500 leading-relaxed"
                />
              </div>

            </div>
          </div>

          {/* Right: Metrics, Projections & Recommendation (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            
            {/* Top Stat Cards matching the spreadsheet */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-[#16242A] border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Ticket Médio:</span>
                <p className="text-lg font-extrabold text-white font-mono mt-1">
                  {formatBRL(metrics.averageTicket)}
                </p>
                <span className="text-[10px] text-slate-500">por cliente</span>
              </div>

              <div className="p-4 rounded-xl bg-[#16242A] border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Inadimplência Atual:</span>
                <p className="text-lg font-extrabold text-[#D40B3A] font-mono mt-1">
                  {formatBRL(metrics.delinquencyAmount)}
                </p>
                <span className="text-[10px] text-slate-500">{formatPercent(metrics.delinquencyRate)} da base</span>
              </div>

              {/* Editable Reduction Target Card as requested! */}
              <div className="p-4 rounded-xl bg-[#16242A] border border-emerald-900/60">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 block text-[11px]">Meta de Redução:</span>
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-emerald-400">
                    <span>-</span>
                    <input
                      type="number"
                      min="30"
                      max="95"
                      value={diagnosticData.reductionGoalPercent || 80}
                      onChange={(e) => handleFieldChange('reductionGoalPercent', Math.min(95, Math.max(30, Number(e.target.value))))}
                      className="w-12 px-1 py-0.5 bg-[#111F24] border border-slate-700 rounded text-center text-emerald-400 font-bold"
                    />
                    <span>%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="30"
                  max="95"
                  step="5"
                  value={diagnosticData.reductionGoalPercent || 80}
                  onChange={(e) => handleFieldChange('reductionGoalPercent', Number(e.target.value))}
                  className="w-full mt-2 accent-emerald-500 cursor-pointer"
                />
                <span className="text-[10px] text-emerald-400 block mt-1">
                  Cai para {metrics.targetDelinquentClients} inadimplentes
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#16242A] border border-slate-700">
                <span className="text-slate-400 block text-[11px]">Recuperação Mensal:</span>
                <p className="text-lg font-extrabold text-emerald-400 font-mono mt-1">
                  {formatBRL(metrics.monthlyRecoveredCash)}
                </p>
                <span className="text-[10px] text-slate-400">direto no caixa</span>
              </div>
            </div>

            {/* Projeção Comparativa Mês a Mês */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700">
                <div>
                  <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider">
                    Simulação Financeira Anual
                  </span>
                  <h3 className="text-base font-bold text-white font-display">
                    Projeção com Redução de Inadimplência
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/80">
                  +{formatBRL(metrics.totalDelinquencyDifference)} recuperados/ano
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#111F24] text-slate-300 font-semibold border-b border-slate-700">
                      <th className="py-2.5 px-3">Mês</th>
                      <th className="py-2.5 px-2 text-center">Clientes</th>
                      <th className="py-2.5 px-2 text-right">Faturamento</th>
                      <th className="py-2.5 px-2 text-right text-red-400">Inadimpl. Sem Solução</th>
                      <th className="py-2.5 px-2 text-right text-emerald-400">Inadimpl. Reduzida (-{diagnosticData.reductionGoalPercent || 80}%)</th>
                      <th className="py-2.5 px-3 text-right text-white">Ganho Líquido</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {metrics.solutionProjections.slice(0, showFullProjectionTable ? 12 : 6).map((sol, idx) => {
                      const sq = metrics.statusQuoProjections[idx];
                      const monthlyGain = sq.delinquencyAmount - sol.delinquencyAmount;
                      return (
                        <tr key={sol.monthName} className={idx % 2 === 0 ? 'bg-[#142026]' : 'bg-[#111F24]'}>
                          <td className="py-2 px-3 font-sans font-medium text-slate-200">{sol.monthName}</td>
                          <td className="py-2 px-2 text-center text-slate-400">{sol.totalClients}</td>
                          <td className="py-2 px-2 text-right text-slate-300">{formatBRL(sol.revenue)}</td>
                          <td className="py-2 px-2 text-right text-red-400">{formatBRL(sq.delinquencyAmount)}</td>
                          <td className="py-2 px-2 text-right text-emerald-400 font-bold">{formatBRL(sol.delinquencyAmount)}</td>
                          <td className="py-2 px-3 text-right text-emerald-300 font-bold">+{formatBRL(monthlyGain)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setShowFullProjectionTable(!showFullProjectionTable)}
                  className="text-xs text-[#D40B3A] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFullProjectionTable ? 'rotate-180' : ''}`} />
                  <span>{showFullProjectionTable ? 'Mostrar apenas 6 meses' : 'Ver projeção completa de 12 meses'}</span>
                </button>

                <div className="text-right text-xs">
                  <span className="text-slate-400">Diferença Anual no Caixa: </span>
                  <strong className="text-emerald-400 font-mono text-sm">+{formatBRL(metrics.totalDelinquencyDifference)}</strong>
                </div>
              </div>
            </div>

            {/* Recommendation Banner */}
            <div className="bg-gradient-to-br from-[#16242A] to-[#1D2F37] border-2 border-[#D40B3A]/80 rounded-2xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#D40B3A]">
                  <Sparkles className="w-4 h-4 text-[#D40B3A]" />
                  <span>Solução Comercial Recomendada para Esta Empresa</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#D40B3A]/20 text-[#D40B3A] font-bold border border-[#D40B3A]/40">
                  {metrics.recommendedTrack === 'esteira-asaas' ? 'Esteira 1 · Asaas' : 'Esteira 2 · Multicobrança'}
                </span>
              </div>

              <div className="space-y-1">
                <h4 className="text-2xl font-extrabold text-white font-display">
                  {metrics.recommendedTrack === 'esteira-asaas' ? 'Implementação Asaas' : 'Multicobrança WhatsApp'} · Plano {metrics.recommendedPlanId.toUpperCase()}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {metrics.recommendationReason}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400">
                  Economia estimada de tempo: <strong className="text-white">~{Math.round(diagnosticData.hoursSpentPerWeek * 3.5)}h/mês</strong> da equipe financeira.
                </div>

                <button
                  type="button"
                  onClick={() => onApplyRecommendation(
                    metrics.recommendedTrack,
                    metrics.recommendedPlanId,
                    diagnosticData.companyName || 'Empresa Cliente'
                  )}
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#D40B3A] hover:bg-[#B50931] text-white font-bold text-xs rounded-xl shadow-lg transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Carregar na Proposta Comercial</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
