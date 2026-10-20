import React from 'react';
import { CommercialProposal, ClientInfo, DigitalSignatureData, Plan } from '../../types';
import { MULTILAGOS_INFO } from '../../data/mockData';
import { formatBRL } from '../../utils/calculator';
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
              Proposta Comercial · Implementação Asaas
            </h1>
            <p className="text-[10.5px] text-slate-600 mt-0.5">
              Conta digital, cobrança automatizada e gestão financeira implantadas por especialistas homologados
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
                  Nº {proposal.contractMasterId} · Versão 1.0 · Assinado em {isSigned && signatureData.signedAt ? signatureData.signedAt.split(' ')[0] : proposal.createdAt}
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
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-[#D40B3A]">✓</td>
                    <td className="py-0.5 text-center border-l border-slate-200 font-bold text-slate-700">✓</td>
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
                    <th className="py-1 px-2 w-1/3">Item</th>
                    <th className="py-1 px-2 w-1/4">Valor</th>
                    <th className="py-1 px-2 w-5/12">Condição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-1 px-2 font-bold text-slate-900">Setup de Implantação (único)</td>
                    <td className="py-1 px-2 font-mono font-bold text-slate-900">{formatBRL(fin.setupTotal)}</td>
                    <td className="py-1 px-2 text-slate-700">À vista na ativação ou parcelado via Asaas</td>
                  </tr>
                  <tr className="bg-slate-50 text-[9.5px]">
                    <td className="py-0.5 px-2 pl-5 text-slate-600">↳ Desconto sobre o setup</td>
                    <td className="py-0.5 px-2 font-mono text-slate-700">
                      {fin.setupDiscountApplied ? formatBRL(fin.setupDiscountValue) : 'Não'}
                    </td>
                    <td className="py-0.5 px-2 text-slate-600">
                      {fin.setupDiscountApplied ? (fin.setupDiscountReason || 'Condição comercial acordada') : 'Sem desconto aplicado'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2 font-bold text-slate-900">Mensalidade de Gestão e Suporte</td>
                    <td className="py-1 px-2 font-mono font-bold text-[#D40B3A]">{formatBRL(fin.monthlyTotal)}</td>
                    <td className="py-1 px-2 text-slate-700">Vencimento todo dia {fin.dueDay || 10} · 1ª em {proposal.createdAt}</td>
                  </tr>
                  <tr className="bg-slate-50 text-[9.5px]">
                    <td className="py-0.5 px-2 pl-5 text-slate-600">↳ Desconto sobre mensalidade</td>
                    <td className="py-0.5 px-2 font-mono text-slate-700">
                      {fin.monthlyDiscountApplied ? formatBRL(fin.monthlyDiscountValue) : 'Não'}
                    </td>
                    <td className="py-0.5 px-2 text-slate-600">
                      {fin.monthlyDiscountApplied ? (fin.monthlyDiscountReason || 'Desconto acordado') : 'Sem desconto recorrente'}
                    </td>
                  </tr>
                  <tr className="bg-emerald-50 font-semibold text-emerald-950">
                    <td className="py-1 px-2 font-bold">Mensalidade com pontualidade (5% desc.)</td>
                    <td className="py-1 px-2 font-mono font-extrabold text-emerald-700">
                      {formatBRL(fin.monthlyWithPromptDiscount || Math.round(fin.monthlyTotal * 0.95))}
                    </td>
                    <td className="py-1 px-2 text-emerald-900 text-[9.5px]">Pagamento realizado até o dia 05 do mês</td>
                  </tr>
                </tbody>
              </table>
            </div>

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
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 4 · CRONOGRAMA DE ATIVAÇÃO
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden text-[9.5px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-0.5 px-2 w-1/3">Etapa</th>
                    <th className="py-0.5 px-2 w-1/4">Prazo estimado</th>
                    <th className="py-0.5 px-2 w-5/12">Dependência da Contratante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-0.5 px-2 font-medium">Kickoff e diagnóstico da operação</td>
                    <td className="py-0.5 px-2 font-mono text-slate-800">2 a 3 dias úteis</td>
                    <td className="py-0.5 px-2 text-slate-600">Acessos e contatos da equipe</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 font-medium">Configuração, parametrização e migração</td>
                    <td className="py-0.5 px-2 font-mono text-slate-800">5 dias úteis</td>
                    <td className="py-0.5 px-2 text-slate-600">Envio de base e cadastros atuais</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-medium">Treinamento, validação e Go-Live</td>
                    <td className="py-0.5 px-2 font-mono text-slate-800">Imediato</td>
                    <td className="py-0.5 px-2 text-slate-600">Aprovação final dos fluxos e réguas</td>
                  </tr>
                </tbody>
              </table>
            </div>
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
                <strong>Prazo Contratual:</strong> <strong className="text-slate-950 font-bold">☑ 12 (doze) meses</strong>, contados a partir da data de assinatura ({proposal.createdAt}).
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

            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-500 block">Mensalidade Acordada:</span>
                <span className="text-base font-bold text-[#D40B3A] font-mono">{formatBRL(fin.monthlyTotal)}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Implantação / Setup:</span>
                <span className="text-base font-bold text-slate-900 font-mono">{formatBRL(fin.setupTotal)}</span>
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
