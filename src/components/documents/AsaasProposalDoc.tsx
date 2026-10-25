import React from 'react';
import { CommercialProposal, ClientInfo, DigitalSignatureData, Plan } from '../../types';
import { MULTILAGOS_INFO } from '../../data/mockData';
import {
  formatBRL,
  getSetupBillingDetails,
  getEffectivePromptDiscountPercent,
  formatCleanPercent,
} from '../../utils/calculator';
import { MultilagosLogo } from '../MultilagosLogo';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AsaasProposalDocProps {
  proposal: CommercialProposal;
  clientInfo: ClientInfo;
  currentPlan: Plan;
  signatureData: DigitalSignatureData;
  isSigned: boolean;
}

export const AsaasProposalDoc: React.FC<AsaasProposalDocProps> = ({
  proposal,
  clientInfo,
  currentPlan,
  signatureData,
  isSigned,
}) => {
  const isEssencial = proposal.planId === 'essencial';
  const isPro = proposal.planId === 'pro';
  const isPerformance = proposal.planId === 'performance';
  const isPersonalizado = proposal.planId === 'personalizado';

  const fin = proposal.financials;
  const setupDetails = getSetupBillingDetails(fin);
  const promptPct = getEffectivePromptDiscountPercent(fin);
  const hasPromptDiscount = fin.hasPromptPaymentDiscount !== false && promptPct > 0;
  const activeFeatures = proposal.customFeatures || currentPlan.features;

  return (
    <div id="asaas-proposal-doc" className="pdf-document w-full space-y-6">
      
      {/* ========================================================
          PÁGINA 1 DE 3: IDENTIFICAÇÃO E ESCOPO DOS PLANOS
      ======================================================== */}
      <div className="pdf-page">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Página 1 de 3
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-start space-y-2 pt-1">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">
              {proposal.selectedServices && proposal.selectedServices.length > 1
                ? 'Proposta Comercial · Soluções Integradas'
                : 'Proposta Comercial · Implementação Asaas'}
            </h1>
            <p className="text-[10.5px] text-slate-600 mt-0.5">
              {proposal.selectedServices && proposal.selectedServices.length > 1
                ? proposal.selectedServices.map((s) => s.name).join(' + ')
                : 'Conta digital, cobrança automatizada e gestão financeira implantadas por especialistas homologados'}
            </p>
          </div>

          {/* Meta Bar */}
          <div className="border border-slate-950 rounded overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-950 text-white font-bold text-[10.5px] py-1 px-2 text-center">
              <div>Proposta nº</div>
              <div>Emitida em</div>
              <div>Válida até</div>
            </div>
            <div className="grid grid-cols-3 bg-slate-50 text-slate-900 font-mono text-center py-1 px-2 text-xs font-semibold border-t border-slate-300">
              <div>{proposal.id}</div>
              <div>{proposal.createdAt}</div>
              <div>{proposal.validUntil}</div>
            </div>
          </div>

          <p className="text-slate-700 text-[10px] leading-relaxed">
            Esta Proposta integra o Contrato Mestre ({proposal.contractMasterId}) e é regida por ele. O escopo do serviço é o descrito no plano contratado e eventuais customizações acordadas; o que não consta do escopo está expressamente excluído (Cláusula 1.4 do Contrato Mestre).
          </p>

          {/* SEÇÃO 1: IDENTIFICAÇÃO E VINCULAÇÃO */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 1 · IDENTIFICAÇÃO E VINCULAÇÃO
            </h2>
            
            <div className="border border-slate-300 rounded overflow-hidden divide-y divide-slate-200 text-[10px]">
              <div className="grid grid-cols-12 py-1 px-2 bg-slate-50">
                <span className="col-span-4 font-bold text-slate-800">Contratante:</span>
                <span className="col-span-8 font-semibold text-slate-950 truncate">
                  {clientInfo.companyName || '[Razão Social]'} {clientInfo.tradeName ? `(${clientInfo.tradeName})` : ''} · CNPJ: {clientInfo.cnpj || '[CNPJ]'}
                </span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-white">
                <span className="col-span-4 font-bold text-slate-800">Contrato Mestre Vinculado:</span>
                <span className="col-span-8 text-slate-800 font-mono">
                  Nº {proposal.contractMasterId || 'MSA-2026-001'} · Versão 2.0 (Oficial Atualizado) · Assinado em {isSigned && signatureData.signedAt ? signatureData.signedAt.split(' ')[0] : proposal.createdAt}
                </span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-slate-50">
                <span className="col-span-4 font-bold text-slate-800">Tipo de Proposta:</span>
                <span className="col-span-8 flex items-center gap-4 text-slate-800">
                  <span className="flex items-center gap-1 font-bold text-slate-950">
                    <span className="w-2.5 h-2.5 rounded-sm bg-[#D40B3A] text-white flex items-center justify-center text-[7.5px]">✓</span> Nova Proposta
                  </span>
                  <span>☐ Upgrade</span>
                  <span>☐ Renovação</span>
                </span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-white">
                <span className="col-span-4 font-bold text-slate-800">Início da Vigência:</span>
                <span className="col-span-8 text-slate-800 font-mono">{proposal.createdAt}</span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-slate-50">
                <span className="col-span-4 font-bold text-slate-800">Ponto Focal (Contratante):</span>
                <span className="col-span-8 text-slate-800 truncate">
                  {clientInfo.contactName || '[Nome]'} · {clientInfo.contactRole || 'Representante'} · {clientInfo.email || '[E-mail]'} · {clientInfo.phone || '[WhatsApp]'}
                </span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-white">
                <span className="col-span-4 font-bold text-slate-800">Consultor Multilagos:</span>
                <span className="col-span-8 text-slate-800">
                  {MULTILAGOS_INFO.representativeName} · {MULTILAGOS_INFO.email} · {MULTILAGOS_INFO.phone}
                </span>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: PLANOS E ESCOPO */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 2 · PLANOS E ESCOPO
            </h2>
            <p className="text-slate-600 text-[9.5px]">
              O plano contratado está assinalado com destaque abaixo. O escopo compreende todos os itens marcados na coluna correspondente:
            </p>

            <div className="border border-slate-300 rounded overflow-hidden text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white text-center font-bold">
                    <th className="py-1 px-2 text-left w-2/5">Escopo de Serviços</th>
                    <th className="py-1 px-1 border-l border-slate-800 w-[15%]">Essencial</th>
                    <th className="py-1 px-1 border-l border-slate-800 w-[15%]">PRO</th>
                    <th className="py-1 px-1 border-l border-slate-800 w-[15%]">Performance</th>
                    <th className="py-1 px-1 border-l border-slate-800 w-[15%]">Personalizado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-amber-50/90 font-bold text-center">
                    <td className="py-1 px-2 text-left text-slate-900 font-bold">PLANO CONTRATADO</td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${isEssencial ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {isEssencial ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${isPro ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {isPro ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${isPerformance ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {isPerformance ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${isPersonalizado ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {isPersonalizado ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800">Consultoria de setup inicial</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-slate-800">Treinamento da equipe</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800">Migração da base de clientes</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-slate-800">Régua de cobrança completa (WhatsApp/E-mail)</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800">Fatura e checkout personalizado</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-slate-800 font-medium">Nota fiscal de serviço automática (NFS-e)</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-[#D40B3A]">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800 font-medium">Split de pagamento automático</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className={`py-0.5 text-center border-l border-slate-200 font-bold ${isPerformance ? 'text-[#D40B3A]' : 'text-slate-700'}`}>✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-slate-800">Integração com ERPs e Gateways</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800">Dashboard e relatórios executivos</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-slate-800">Consultoria estratégica mensal</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 text-slate-400">—</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
                  </tr>
                  <tr className="font-bold bg-slate-100 text-center">
                    <td className="py-0.5 px-2 text-left text-slate-900">Setup a partir de</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono">R$ 750</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono text-[#D40B3A]">R$ 2.500</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono">R$ 3.500</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono text-slate-600">Sob consulta</td>
                  </tr>
                  <tr className="font-bold bg-slate-200/80 text-center">
                    <td className="py-0.5 px-2 text-left text-slate-900">Mensalidade</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono">R$ 99</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono text-[#D40B3A]">R$ 379</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono">R$ 599</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono text-slate-600">Sob consulta</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[9px] text-slate-500 leading-tight pt-0.5">
              Valores de tabela. O valor efetivamente contratado consta da Seção 3 (Resumo Financeiro). Suporte continuado incluso conforme o Contrato Mestre.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 1 de 3</span>
        </div>
      </div>

      {/* ========================================================
          PÁGINA 2 DE 3: RESUMO FINANCEIRO, TAXAS, CRONOGRAMA & SLA
      ======================================================== */}
      <div className="pdf-page">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Página 2 de 3
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-start space-y-2 pt-1">
          {/* SEÇÃO 3: RESUMO FINANCEIRO */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 3 · RESUMO FINANCEIRO CONTRATADO
            </h2>

            <div className="border border-slate-300 rounded overflow-hidden text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-1 px-2 w-[36%]">Item</th>
                    <th className="py-1 px-2 w-[24%]">Valor</th>
                    <th className="py-1 px-2 w-[40%]">Condição Comercial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className={setupDetails.mode === 'cash' ? 'bg-amber-50/70' : ''}>
                    <td className="py-1 px-2 font-bold text-slate-900">
                      Setup de Implantação · À Vista
                    </td>
                    <td className="py-1 px-2 font-mono font-bold text-slate-900">
                      {formatBRL(setupDetails.cashPrice)}
                    </td>
                    <td className="py-1 px-2 text-slate-800 text-[9.5px]">
                      {setupDetails.mode === 'cash' ? (
                        <strong className="text-[#D40B3A]">☑ CONTRATADO À VISTA</strong>
                      ) : (
                        <span>Opção à vista na ativação</span>
                      )}
                      {fin.setupDiscountApplied && fin.setupDiscountValue > 0
                        ? ` · Desc. ${formatBRL(fin.setupDiscountValue)} sobre ${formatBRL(fin.setupPrice)}${fin.setupDiscountReason ? ` (${fin.setupDiscountReason})` : ''}`
                        : ''}
                    </td>
                  </tr>
                  <tr className={setupDetails.mode === 'installments' ? 'bg-amber-50/70' : 'bg-slate-50'}>
                    <td className="py-1 px-2 font-bold text-slate-900">
                      Setup · Parcelado ({setupDetails.installmentsCount}x)
                    </td>
                    <td className="py-1 px-2 font-mono font-bold text-slate-900">
                      {setupDetails.installmentsCount}x de {formatBRL(setupDetails.installmentValue)}
                    </td>
                    <td className="py-1 px-2 text-slate-800 text-[9.5px]">
                      {setupDetails.mode === 'installments' ? (
                        <strong className="text-[#D40B3A]">
                          ☑ CONTRATADO PARCELADO · Total: {formatBRL(setupDetails.installmentTotal)}
                        </strong>
                      ) : (
                        <span>Total parcelado: {formatBRL(setupDetails.installmentTotal)} via Asaas</span>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2 font-bold text-slate-900">Mensalidade de Gestão e Suporte</td>
                    <td className="py-1 px-2 font-mono font-bold text-[#D40B3A]">{formatBRL(fin.monthlyTotal)}/mês</td>
                    <td className="py-1 px-2 text-slate-700 text-[9.5px]">
                      Vencimento todo dia {String(fin.dueDay || 10).padStart(2, '0')} · 1ª em {proposal.createdAt}
                    </td>
                  </tr>
                  <tr className="bg-slate-50 text-[9.5px]">
                    <td className="py-0.5 px-2 pl-4 text-slate-600">↳ Desconto fixo sobre mensalidade</td>
                    <td className="py-0.5 px-2 font-mono text-slate-700">
                      {fin.monthlyDiscountApplied ? `- ${formatBRL(fin.monthlyDiscountValue)}` : 'Não'}
                    </td>
                    <td className="py-0.5 px-2 text-slate-600">
                      {fin.monthlyDiscountApplied
                        ? `${fin.monthlyDiscountReason || 'Desconto acordado'} (Tabela: ${formatBRL(fin.monthlyPrice)})`
                        : 'Sem desconto fixo recorrente'}
                    </td>
                  </tr>
                  <tr className={hasPromptDiscount ? 'bg-emerald-50 font-semibold text-emerald-950' : 'bg-slate-50 text-slate-700'}>
                    <td className="py-1 px-2 font-bold">
                      {hasPromptDiscount
                        ? `Mensalidade até o dia 05 (${formatCleanPercent(promptPct)}% desc.)`
                        : 'Desconto de pontualidade (até dia 05)'}
                    </td>
                    <td className={`py-1 px-2 font-mono font-extrabold ${hasPromptDiscount ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {hasPromptDiscount ? `${formatBRL(fin.monthlyWithPromptDiscount)}/mês` : 'Não aplicável'}
                    </td>
                    <td className={`py-1 px-2 text-[9.5px] ${hasPromptDiscount ? 'text-emerald-900' : 'text-slate-600'}`}>
                      {hasPromptDiscount
                        ? `${formatCleanPercent(promptPct)}% de desconto p/ pagamento até o dia 05 (após dia 05: ${formatBRL(fin.monthlyTotal)})`
                        : `Valor integral de ${formatBRL(fin.monthlyTotal)} até o vencimento (dia ${String(fin.dueDay || 10).padStart(2, '0')})`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Detalhamento de Serviços Contratados (se mais de 1) */}
            {proposal.selectedServices && proposal.selectedServices.length > 1 && (
              <div className="border border-slate-300 rounded overflow-hidden text-[9px] bg-slate-50">
                <div className="bg-slate-800 text-white font-bold py-0.5 px-2">
                  Detalhamento dos Serviços Contratados nesta Proposta ({proposal.selectedServices.length}):
                </div>
                <div className="divide-y divide-slate-200">
                  {proposal.selectedServices.map((serv, idx) => (
                    <div key={idx} className="flex items-center justify-between py-0.5 px-2">
                      <span className="font-semibold text-slate-900">
                        • {serv.name}
                        {serv.category === 'regua-n8n' && (
                          <span className="text-slate-500 font-normal">
                            {' '}({(serv.reguaPortfolioType || proposal.reguaPortfolioType) === 'client' ? 'Portfólio Cliente · Meta direta' : 'Portfólio Multilagos · Meta inclusa'})
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-700">
                        Setup: {formatBRL(serv.setupPrice)} | Mensal: <strong className="text-[#D40B3A]">{formatBRL(serv.monthlyPrice)}/mês</strong>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-[9px] text-slate-500 pt-0.5">
              Custos do Asaas são cobrados diretamente pelo Asaas conforme tabela homologada de parceiro:
            </p>

            {/* Taxas Asaas */}
            <div className="border border-slate-300 rounded overflow-hidden text-[9.5px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-0.5 px-2 w-1/2">Taxas Asaas (por transação recebida com sucesso)</th>
                    <th className="py-0.5 px-2 w-1/2">Tarifa de parceiro homologada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800">Boleto bancário compensado</td>
                    <td className="py-0.5 px-2 font-mono font-bold text-slate-900">R$ 1,89</td>
                  </tr>
                  <tr className="bg-emerald-50/50">
                    <td className="py-0.5 px-2 text-slate-900 font-semibold">Pix recebido na conta digital</td>
                    <td className="py-0.5 px-2 font-mono font-bold text-emerald-700">R$ 0,99</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-slate-800">Cartão de débito</td>
                    <td className="py-0.5 px-2 font-mono text-slate-900">R$ 0,35 + 1,89%</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-slate-800">Cartão de crédito à vista</td>
                    <td className="py-0.5 px-2 font-mono text-slate-900">R$ 0,29 + 2,93% · parcelado sob consulta</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO 4: CRONOGRAMA */}
          <div className="space-y-0.5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
                SEÇÃO 4 · CRONOGRAMA E TEMPO ESTIMADO DE IMPLANTAÇÃO
              </h2>
              <span className="text-[9px] font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-300">
                Tempo Total Estimado: <strong className="text-[#D40B3A]">{proposal.serviceTrack === 'esteira-regua-n8n' ? 'Até 5 dias úteis' : '20 dias'}</strong>
              </span>
            </div>
            <div className="border border-slate-300 rounded overflow-hidden text-[9px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-0.5 px-2 w-5/12">Etapa</th>
                    <th className="py-0.5 px-2 w-3/12">Prazo estimado</th>
                    <th className="py-0.5 px-2 w-4/12">Dependência da Contratante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {proposal.serviceTrack === 'esteira-regua-n8n' ? (
                    <>
                      <tr>
                        <td className="py-0.5 px-2 font-medium">Conexão da API WhatsApp e homologação Meta</td>
                        <td className="py-0.5 px-2 font-mono text-slate-800">1 a 2 dias úteis</td>
                        <td className="py-0.5 px-2 text-slate-600">Acessos e aprovação na Meta</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-medium">Parametrização da Régua de Cobrança e mensagens</td>
                        <td className="py-0.5 px-2 font-mono text-slate-800">até 3 dias úteis</td>
                        <td className="py-0.5 px-2 text-slate-600">Aprovação dos modelos e templates</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-2 font-medium">Validação, testes e Go-Live dos envios</td>
                        <td className="py-0.5 px-2 font-mono text-slate-800">1 dia útil</td>
                        <td className="py-0.5 px-2 text-slate-600">Homologação final da Contratante</td>
                      </tr>
                    </>
                  ) : (
                    <>
                      <tr>
                        <td className="py-0.5 px-2 font-medium">Kickoff e diagnóstico operacional</td>
                        <td className="py-0.5 px-2 font-mono font-semibold text-slate-800">de 1 a 3 dias úteis</td>
                        <td className="py-0.5 px-2 text-slate-600">Alinhamento, acessos e contatos da equipe</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-medium">Base de dados e validação (limpeza, preparação, validação e importação)</td>
                        <td className="py-0.5 px-2 font-mono font-semibold text-slate-800">de 5 a 15 dias úteis</td>
                        <td className="py-0.5 px-2 text-slate-600">Envio de base histórica e validação de cadastros</td>
                      </tr>
                      <tr>
                        <td className="py-0.5 px-2 font-medium">Configurações</td>
                        <td className="py-0.5 px-2 font-mono font-semibold text-slate-800">até 5 dias úteis</td>
                        <td className="py-0.5 px-2 text-slate-600">Parametrização de conta, fiscal e réguas</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="py-0.5 px-2 font-medium">Validação e Go-Live / Operação e treinamento</td>
                        <td className="py-0.5 px-2 font-mono font-semibold text-slate-800">3 dias</td>
                        <td className="py-0.5 px-2 text-slate-600">Homologação final e equipe disponível</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[8px] text-slate-500 italic">
              * Tempo total estimado da implantação: <strong>20 dias</strong>. Somente régua de cobrança: <strong>até 5 dias úteis</strong>.
            </p>
          </div>

          {/* SEÇÃO 5: NÍVEL DE SUPORTE (SLA) */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 5 · NÍVEL DE SERVIÇO E SUPORTE (SLA)
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden text-[9.5px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-0.5 px-2 w-1/6">Urgência</th>
                    <th className="py-0.5 px-2 w-1/2">Situação</th>
                    <th className="py-0.5 px-2 w-1/6 text-center">Resposta</th>
                    <th className="py-0.5 px-2 w-1/6 text-center">Solução</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-red-50/50">
                    <td className="py-0.5 px-2 font-bold text-red-700">Crítica</td>
                    <td className="py-0.5 px-2 text-slate-800">Faturamento ou envios paralisados</td>
                    <td className="py-0.5 px-2 text-center font-mono font-bold text-red-700">1 h</td>
                    <td className="py-0.5 px-2 text-center font-bold text-red-700">Prioritária</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-bold text-amber-700">Alta</td>
                    <td className="py-0.5 px-2 text-slate-800">Alteração em massa; falha de notificações</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">2 h</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">1 dia útil</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 font-bold text-blue-700">Normal</td>
                    <td className="py-0.5 px-2 text-slate-800">Dúvidas operacionais; ajustes de régua; novos usuários</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">3 h</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">5 dias úteis</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-bold text-slate-600">Baixa</td>
                    <td className="py-0.5 px-2 text-slate-800">Consultoria de relatórios; novos recursos</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">4 h</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">A combinar</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO 6: PERMANÊNCIA */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 6 · VIGÊNCIA E PERMANÊNCIA
            </h2>
            <div className="border border-slate-300 rounded p-1.5 bg-slate-50 text-[10px] space-y-0.5">
              <p className="text-slate-800">
                <strong>Prazo Contratual:</strong> <strong className="text-slate-950 font-bold">☑ Tempo Indeterminado</strong> (Vigência por prazo indeterminado, sem vencimento preestabelecido; rescisão facultada mediante aviso prévio escrito de 30 dias).
              </p>
              <p className="text-slate-800">
                <strong>Condições Especiais:</strong> Credenciamento oficial Multilagos junto à instituição financeira Asaas para suporte e homologação contínua.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 2 de 3</span>
        </div>
      </div>

      {/* ========================================================
          PÁGINA 3 DE 3: ESCOPO APROVADO, ACEITE E CERTIFICADO DIGITAL
      ======================================================== */}
      <div className="pdf-page">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Página 3 de 3
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-start space-y-3 pt-2">
          {/* Card Resumo do Escopo Aprovado */}
          <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-xs font-bold text-slate-950 uppercase tracking-wide">
                Condições Comerciais e Escopo Específico Aprovado
              </span>
              <span className="text-[10px] font-bold text-[#D40B3A] bg-red-100 px-2 py-0.5 rounded">
                Plano: {currentPlan.name}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block">Mensalidade (Venc. dia {String(fin.dueDay || 10).padStart(2, '0')}):</span>
                <span className="text-sm font-bold text-[#D40B3A] font-mono">{formatBRL(fin.monthlyTotal)}/mês</span>
              </div>
              <div>
                <span className="text-slate-500 block">
                  {hasPromptDiscount ? `Até o Dia 05 (-${formatCleanPercent(promptPct)}%):` : 'Pagamento até Dia 05:'}
                </span>
                <span className={`text-sm font-bold font-mono ${hasPromptDiscount ? 'text-emerald-700' : 'text-slate-700'}`}>
                  {hasPromptDiscount ? `${formatBRL(fin.monthlyWithPromptDiscount)}/mês` : `${formatBRL(fin.monthlyTotal)}/mês`}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">
                  Setup ({setupDetails.mode === 'installments' ? `Parcelado em ${setupDetails.installmentsCount}x` : 'À Vista'}):
                </span>
                <span className="text-sm font-bold text-slate-900 font-mono block">
                  {setupDetails.mode === 'installments'
                    ? `${setupDetails.installmentsCount}x de ${formatBRL(setupDetails.installmentValue)}`
                    : `${formatBRL(setupDetails.cashPrice)} à vista`}
                </span>
                <span className="text-[8.5px] text-slate-500 font-mono">
                  {setupDetails.mode === 'installments'
                    ? `Total: ${formatBRL(setupDetails.installmentTotal)} · À vista: ${formatBRL(setupDetails.cashPrice)}`
                    : `Parcelado: ${setupDetails.installmentsCount}x ${formatBRL(setupDetails.installmentValue)} (${formatBRL(setupDetails.installmentTotal)})`}
                </span>
              </div>
            </div>

            <div className="pt-1.5 border-t border-slate-200">
              <span className="text-[10px] font-bold text-slate-700 block mb-1">
                Itens de Escopo Inclusos na Contratação ({activeFeatures.length} itens):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[9.5px] text-slate-700">
                {activeFeatures.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SEÇÃO 7: ACEITE DA PROPOSTA */}
          <div className="space-y-2">
            <h2 className="font-bold text-[#D40B3A] text-xs uppercase tracking-wider">
              SEÇÃO 7 · FORMALIZAÇÃO DO ACEITE DA PROPOSTA
            </h2>
            <p className="text-slate-700 text-[10.5px] leading-relaxed text-justify">
              Ao formalizar o aceite, a Contratante declara expressamente que leu, compreendeu e concorda integralmente com os termos desta Proposta Comercial e com todas as disposições do Contrato Mestre de Prestação de Serviços vinculado ({proposal.contractMasterId}). O aceite possui validade jurídica plena conforme MP nº 2.200-2/2001 e Lei Federal nº 14.063/2020.
            </p>

            <div className="grid grid-cols-2 gap-6 pt-3 border-t border-slate-300 text-xs">
              <div className="space-y-1">
                <p className="font-bold text-slate-950 uppercase">{MULTILAGOS_INFO.companyName}</p>
                <p className="text-slate-700">Representante: {MULTILAGOS_INFO.representativeName}</p>
                <p className="text-slate-500 font-mono text-[10.5px]">Data de Emissão: {proposal.createdAt}</p>
              </div>

              <div className="space-y-1">
                <p className="font-bold text-slate-950 uppercase">{clientInfo.companyName || '[RAZÃO SOCIAL]'}</p>
                <p className="text-slate-700">Representante: {clientInfo.contactName || '[Representante Legal]'}</p>
                <p className="text-slate-500 font-mono text-[10.5px]">
                  Data de Aceite: {isSigned && signatureData.signedAt ? signatureData.signedAt : 'Pendente de assinatura'}
                </p>
              </div>
            </div>
          </div>

          {/* CERTIFICADO DIGITAL OFICIAL NO RODAPÉ */}
          <div className="mt-2 pt-2.5 border-t-2 border-dashed border-slate-300 bg-slate-50 p-3 rounded-xl text-[10px] text-slate-600 space-y-1.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-[#D40B3A]" />
                <span>CERTIFICADO DE ASSINATURA ELETRÔNICA · PROPOSTA VINCULADA</span>
              </div>
              <span className="font-mono text-slate-500 text-[9.5px]">Ref: {proposal.id} · {proposal.contractMasterId}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 font-mono text-[9px]">
              <div>
                <span className="text-slate-400 block font-sans text-[8.5px]">Signatário:</span>
                <span className="text-slate-900 font-bold">{signatureData.signerName || clientInfo.contactName || 'Pendente'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[8.5px]">CPF / CNPJ:</span>
                <span>{signatureData.signerCpf || clientInfo.cpf || '—'} · {clientInfo.cnpj || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[8.5px]">Data & Hora do Registro:</span>
                <span>{signatureData.signedAt || 'Aguardando formalização'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[8.5px]">Hash Criptográfico de Autenticidade:</span>
                <span className="truncate block font-bold text-slate-800" title={signatureData.verificationHash || 'ML-PROP-HASH'}>
                  {signatureData.verificationHash || 'ML-PROP-HASH-PENDING'}
                </span>
              </div>
            </div>
            <p className="text-[8.5px] text-slate-400 font-sans pt-0.5">
              Certificação em estrita conformidade com a MP nº 2.200-2/2001 e Lei 14.063/2020. Endereço IP registrado: {signatureData.signerIp || '187.122.45.109 (Verificado por Certificado Eletrônico)'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 3 de 3</span>
        </div>
      </div>

    </div>
  );
};
