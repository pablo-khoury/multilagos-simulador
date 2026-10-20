import React, { useState, useEffect } from 'react';
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
  FileText,
  CreditCard,
  Percent,
  Check,
  TrendingDown,
  ShieldCheck,
  Zap,
  DollarSign
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
  const [delinquencyMode, setDelinquencyMode] = useState<'count' | 'percent'>(
    diagnosticData.delinquencyInputMode || 'count'
  );

  const metrics = calculateDiagnosticMetrics(diagnosticData);

  const formatPctToStr = (pct: number) => {
    if (pct == null || pct <= 0) return '';
    const rounded = Number(pct.toFixed(2));
    return String(rounded).replace('.', ',');
  };

  const getInitialPercentStr = () => {
    if (diagnosticData.delinquencyInputPercent != null && diagnosticData.delinquencyInputPercent > 0) {
      return formatPctToStr(diagnosticData.delinquencyInputPercent);
    }
    if (diagnosticData.clientCount > 0 && diagnosticData.delinquentClientCount > 0) {
      const pct = (diagnosticData.delinquentClientCount / diagnosticData.clientCount) * 100;
      return formatPctToStr(pct);
    }
    return '';
  };

  const [percentInputStr, setPercentInputStr] = useState<string>(getInitialPercentStr);

  // Sincronizar string percentual quando o modo é 'count' e o valor em clientes muda
  useEffect(() => {
    if (delinquencyMode === 'count') {
      if (diagnosticData.clientCount > 0 && diagnosticData.delinquentClientCount > 0) {
        const pct = (diagnosticData.delinquentClientCount / diagnosticData.clientCount) * 100;
        setPercentInputStr(formatPctToStr(pct));
      } else {
        setPercentInputStr('');
      }
    }
  }, [diagnosticData.delinquentClientCount, diagnosticData.clientCount, delinquencyMode]);

  const handleFieldChange = <K extends keyof DiagnosticSheetData>(
    field: K,
    value: DiagnosticSheetData[K]
  ) => {
    onUpdateDiagnostic({
      ...diagnosticData,
      [field]: value,
    });
  };

  const handleSwitchToCount = () => {
    setDelinquencyMode('count');
    handleFieldChange('delinquencyInputMode', 'count');
  };

  const handleSwitchToPercent = () => {
    setDelinquencyMode('percent');
    handleFieldChange('delinquencyInputMode', 'percent');
    if (diagnosticData.clientCount > 0 && diagnosticData.delinquentClientCount > 0) {
      const pct = (diagnosticData.delinquentClientCount / diagnosticData.clientCount) * 100;
      setPercentInputStr(formatPctToStr(pct));
    }
  };

  const handleDelinquentCountChange = (count: number) => {
    const safeCount = Math.max(0, count);
    const pct = diagnosticData.clientCount > 0 ? Number(((safeCount / diagnosticData.clientCount) * 100).toFixed(2)) : 0;
    onUpdateDiagnostic({
      ...diagnosticData,
      delinquentClientCount: safeCount,
      delinquencyInputMode: 'count',
      delinquencyInputPercent: pct,
    });
  };

  const handlePercentInputChange = (val: string) => {
    // Permitir apenas dígitos, vírgula e ponto
    let clean = val.replace(/[^0-9.,]/g, '');

    // Evitar múltiplas vírgulas ou múltiplos pontos
    const commaParts = clean.split(',');
    if (commaParts.length > 2) {
      clean = commaParts[0] + ',' + commaParts.slice(1).join('');
    }
    const dotParts = clean.split('.');
    if (dotParts.length > 2) {
      clean = dotParts[0] + '.' + dotParts.slice(1).join('');
    }

    setPercentInputStr(clean);

    const normalized = clean.replace(',', '.');
    const num = parseFloat(normalized);

    if (!isNaN(num) && num >= 0) {
      const clientBase = diagnosticData.clientCount || 1;
      const count = Math.round((num / 100) * clientBase);
      onUpdateDiagnostic({
        ...diagnosticData,
        delinquentClientCount: count,
        delinquencyInputMode: 'percent',
        delinquencyInputPercent: num,
      });
    } else if (clean === '') {
      onUpdateDiagnostic({
        ...diagnosticData,
        delinquentClientCount: 0,
        delinquencyInputMode: 'percent',
        delinquencyInputPercent: 0,
      });
    }
  };

  const handlePercentInputBlur = () => {
    if (percentInputStr.endsWith(',') || percentInputStr.endsWith('.')) {
      setPercentInputStr(percentInputStr.slice(0, -1));
    }
  };

  const handleClientCountChange = (newCount: number) => {
    const safeCount = Math.max(0, newCount);
    if (delinquencyMode === 'percent') {
      const normalized = percentInputStr.replace(',', '.');
      const num = parseFloat(normalized);
      const pct = !isNaN(num) && num > 0 ? num : (diagnosticData.delinquencyInputPercent || 0);
      const delinqCount = Math.round((pct / 100) * safeCount);
      onUpdateDiagnostic({
        ...diagnosticData,
        clientCount: safeCount,
        delinquentClientCount: delinqCount,
      });
    } else {
      onUpdateDiagnostic({
        ...diagnosticData,
        clientCount: safeCount,
      });
    }
  };

  const handlePaymentMethodToggle = (method: 'pix' | 'boleto' | 'creditCard' | 'debitCard', checked: boolean) => {
    onUpdateDiagnostic({
      ...diagnosticData,
      paymentMethods: {
        ...diagnosticData.paymentMethods,
        [method]: checked,
      },
    });
  };

  const handlePaymentFeeChange = (field: 'pixFee' | 'boletoFee' | 'creditCardFee' | 'debitCardFee', value: number) => {
    onUpdateDiagnostic({
      ...diagnosticData,
      paymentMethods: {
        ...diagnosticData.paymentMethods,
        [field]: value,
      },
    });
  };

  const handleResetDefaults = () => {
    onUpdateDiagnostic({
      companyName: '',
      segment: 'Serviços em Geral',
      monthlyRevenue: 30000,
      clientCount: 130,
      delinquentClientCount: 10,
      delinquencyInputMode: 'count',
      delinquencyInputPercent: 7.69,
      newClientsPerMonth: 5,
      churnClientsPerMonth: 3,
      issuesNfse: 'sim',
      hasCommissionOrSplit: 'nao',
      billingModel: 'recorrente',
      financialTeamSize: 3,
      paymentMethods: {
        pix: true,
        pixFee: 1.50,
        pixFeeType: 'fixed',
        boleto: true,
        boletoFee: 3.50,
        creditCard: true,
        creditCardFee: 3.99,
        debitCard: false,
        debitCardFee: 1.99,
      },
      currentSystem: '',
      collectionMethodNotes: 'Cobrança manual e envio avulso',
      hoursSpentPerWeek: 8,
      reductionGoalPercent: 80,
    });
    setPercentInputStr('7,7');
    setDelinquencyMode('count');
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
                    onChange={(e) => handleClientCountChange(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-300 font-semibold">
                      Inadimplência:
                    </label>
                    <div className="flex items-center bg-[#111F24] border border-slate-700 rounded-md p-0.5 text-[10px]">
                      <button
                        type="button"
                        onClick={handleSwitchToCount}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          delinquencyMode === 'count' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Informar quantidade exata de clientes em atraso"
                      >
                        Qtd
                      </button>
                      <button
                        type="button"
                        onClick={handleSwitchToPercent}
                        className={`px-2 py-0.5 rounded font-bold cursor-pointer transition-colors ${
                          delinquencyMode === 'percent' ? 'bg-[#D40B3A] text-white' : 'text-slate-400 hover:text-white'
                        }`}
                        title="Informar percentual (%) estimado de inadimplência"
                      >
                        %
                      </button>
                    </div>
                  </div>

                  {delinquencyMode === 'count' ? (
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="10"
                        value={diagnosticData.delinquentClientCount || ''}
                        onChange={(e) => handleDelinquentCountChange(Number(e.target.value))}
                        className="w-full px-3 py-2 pr-12 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                        clientes
                      </span>
                    </div>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        placeholder="Ex: 7,5 ou 15"
                        value={percentInputStr}
                        onChange={(e) => handlePercentInputChange(e.target.value)}
                        onBlur={handlePercentInputBlur}
                        className="w-full px-3 py-2 pr-8 bg-[#111F24] border border-slate-700 rounded-lg text-white font-mono font-bold focus:ring-1 focus:ring-[#D40B3A] focus:outline-none"
                      />
                      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D40B3A] font-mono">
                        %
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Inadimplência calculada em tempo real */}
              <div className="p-3 rounded-xl bg-[#111F24] border border-red-900/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-400 block">% de Inadimplência Calculada:</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-extrabold text-[#D40B3A] font-mono">
                      {formatPercent(metrics.delinquencyRate)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({diagnosticData.delinquentClientCount || 0} clientes)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Total Atrasado / Mês:</span>
                  <span className="text-base font-extrabold text-white font-mono">
                    {formatBRL(metrics.delinquencyAmount)}
                  </span>
                </div>
              </div>

              {/* Pergunta Nova: Formas de Pagamento & Custos Atuais de Recebimento */}
              <div className="p-3.5 rounded-xl bg-[#111F24] border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                  <label className="text-slate-200 font-bold flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-[#D40B3A]" />
                    <span>Formas de Pagamento & Custos Atuais</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Marque as que utiliza e o custo p/ receber</span>
                </div>

                <div className="space-y-2">
                  {/* Pix */}
                  <div className={`p-2 rounded-lg border transition-all ${
                    diagnosticData.paymentMethods?.pix ? 'bg-[#16242A] border-slate-700' : 'bg-[#111F24]/50 border-slate-800/60 opacity-60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={diagnosticData.paymentMethods?.pix ?? true}
                          onChange={(e) => handlePaymentMethodToggle('pix', e.target.checked)}
                          className="w-4 h-4 rounded text-[#D40B3A] accent-[#D40B3A] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-white">Pix</span>
                      </label>

                      {diagnosticData.paymentMethods?.pix && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[11px] text-slate-400">Custo p/ receber:</span>
                          <span className="text-slate-400 text-xs font-bold font-mono">R$</span>
                          <input
                            type="number"
                            step="0.05"
                            placeholder="1.50"
                            value={diagnosticData.paymentMethods?.pixFee ?? 1.50}
                            onChange={(e) => handlePaymentFeeChange('pixFee', Number(e.target.value))}
                            className="w-18 px-2 py-0.5 bg-[#111F24] border border-slate-700 rounded text-white font-mono font-bold text-xs focus:ring-1 focus:ring-[#D40B3A]"
                          />
                          <span className="text-[10px] text-slate-500">/tx</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Boleto Bancário */}
                  <div className={`p-2 rounded-lg border transition-all ${
                    diagnosticData.paymentMethods?.boleto ? 'bg-[#16242A] border-slate-700' : 'bg-[#111F24]/50 border-slate-800/60 opacity-60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={diagnosticData.paymentMethods?.boleto ?? true}
                          onChange={(e) => handlePaymentMethodToggle('boleto', e.target.checked)}
                          className="w-4 h-4 rounded text-[#D40B3A] accent-[#D40B3A] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-white">Boleto Bancário</span>
                      </label>

                      {diagnosticData.paymentMethods?.boleto && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[11px] text-slate-400">Custo p/ boleto:</span>
                          <span className="text-slate-400 text-xs font-bold font-mono">R$</span>
                          <input
                            type="number"
                            step="0.10"
                            placeholder="3.50"
                            value={diagnosticData.paymentMethods?.boletoFee ?? 3.50}
                            onChange={(e) => handlePaymentFeeChange('boletoFee', Number(e.target.value))}
                            className="w-18 px-2 py-0.5 bg-[#111F24] border border-slate-700 rounded text-white font-mono font-bold text-xs focus:ring-1 focus:ring-[#D40B3A]"
                          />
                          <span className="text-[10px] text-slate-500">/liquidado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cartão de Crédito */}
                  <div className={`p-2 rounded-lg border transition-all ${
                    diagnosticData.paymentMethods?.creditCard ? 'bg-[#16242A] border-slate-700' : 'bg-[#111F24]/50 border-slate-800/60 opacity-60'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={diagnosticData.paymentMethods?.creditCard ?? true}
                          onChange={(e) => handlePaymentMethodToggle('creditCard', e.target.checked)}
                          className="w-4 h-4 rounded text-[#D40B3A] accent-[#D40B3A] cursor-pointer"
                        />
                        <span className="text-xs font-bold text-white">Cartão de Crédito</span>
                      </label>

                      {diagnosticData.paymentMethods?.creditCard && (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[11px] text-slate-400">Taxa média:</span>
                          <input
                            type="number"
                            step="0.10"
                            placeholder="3.99"
                            value={diagnosticData.paymentMethods?.creditCardFee ?? 3.99}
                            onChange={(e) => handlePaymentFeeChange('creditCardFee', Number(e.target.value))}
                            className="w-16 px-2 py-0.5 bg-[#111F24] border border-slate-700 rounded text-white font-mono font-bold text-xs focus:ring-1 focus:ring-[#D40B3A]"
                          />
                          <span className="text-slate-400 text-xs font-bold font-mono">%</span>
                        </div>
                      )}
                    </div>
                  </div>
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

            {/* Comparativo de Custos de Recebimento (Tarifas Bancárias) */}
            <div className="bg-[#16242A] border border-slate-700/80 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-700 gap-2">
                <div>
                  <span className="text-xs font-bold text-[#D40B3A] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Comparativo de Custos de Recebimento (Tarifas Bancárias)</span>
                  </span>
                  <h4 className="text-base font-bold text-white font-display mt-0.5">
                    Custo Atual do Cliente vs Nossa Solução (Asaas)
                  </h4>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/80 flex items-center gap-1 self-start sm:self-auto">
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Economia de {metrics.feeComparison.savingsPercent.toFixed(0)}% nas tarifas</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#111F24] border border-red-900/50">
                  <span className="text-[11px] text-slate-400 block">Custo Médio Atual do Cliente:</span>
                  <p className="text-lg font-extrabold text-red-400 font-mono mt-0.5">
                    {formatBRL(metrics.feeComparison.currentMonthlyCost)}
                    <span className="text-xs text-slate-400 font-normal"> /mês</span>
                  </p>
                  <span className="text-[10px] text-slate-500">
                    Tarifas informadas pelo cliente
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#111F24] border border-emerald-900/60">
                  <span className="text-[11px] text-slate-400 block">Custo com a Multilagos (Asaas):</span>
                  <p className="text-lg font-extrabold text-emerald-400 font-mono mt-0.5">
                    {formatBRL(metrics.feeComparison.multilagosMonthlyCost)}
                    <span className="text-xs text-slate-400 font-normal"> /mês</span>
                  </p>
                  <span className="text-[10px] text-emerald-400">
                    Pix R$ 0,99 · Boleto R$ 1,89 · Cartão 2,93%
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1D2F37] to-[#16242A] border border-emerald-700/80">
                  <span className="text-[11px] text-emerald-300 font-bold block">Economia Direta em Tarifas:</span>
                  <p className="text-lg font-extrabold text-emerald-300 font-mono mt-0.5">
                    +{formatBRL(metrics.feeComparison.monthlySavings)}
                    <span className="text-xs text-emerald-400 font-normal"> /mês</span>
                  </p>
                  <span className="text-[10px] font-mono text-emerald-300 font-semibold block">
                    +{formatBRL(metrics.feeComparison.annualSavings)} / ano no caixa
                  </span>
                </div>
              </div>

              {/* Mini breakdown table */}
              <div className="overflow-x-auto pt-1">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-[#111F24] text-slate-300 font-semibold border-b border-slate-700">
                      <th className="py-1.5 px-2.5">Método</th>
                      <th className="py-1.5 px-2 text-center">Transações</th>
                      <th className="py-1.5 px-2 text-right">Taxa Atual Cliente</th>
                      <th className="py-1.5 px-2 text-right text-emerald-400">Nossa Taxa (Asaas)</th>
                      <th className="py-1.5 px-2.5 text-right text-emerald-300">Economia / Mês</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    {metrics.feeComparison.details.filter((d) => d.active).map((d) => (
                      <tr key={d.method} className="bg-[#142026]">
                        <td className="py-1.5 px-2.5 font-sans font-medium text-slate-200">{d.method}</td>
                        <td className="py-1.5 px-2 text-center text-slate-400">~{d.transactions}/mês</td>
                        <td className="py-1.5 px-2 text-right text-slate-300">{d.clientRateText} ({formatBRL(d.clientCost)})</td>
                        <td className="py-1.5 px-2 text-right text-emerald-400 font-bold">{d.multilagosRateText} ({formatBRL(d.multilagosCost)})</td>
                        <td className="py-1.5 px-2.5 text-right text-emerald-300 font-bold">
                          {d.difference > 0 ? `+${formatBRL(d.difference)}` : 'R$ 0,00'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
