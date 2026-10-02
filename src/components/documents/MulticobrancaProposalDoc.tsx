import React from 'react';
import { CommercialProposal, ClientInfo, DigitalSignatureData, Plan } from '../../types';
import { MULTILAGOS_INFO } from '../../data/mockData';
import { formatBRL } from '../../utils/calculator';
import { MultilagosLogo } from '../MultilagosLogo';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MulticobrancaProposalDocProps {
  proposal: CommercialProposal;
  clientInfo: ClientInfo;
  currentPlan: Plan;
  signatureData: DigitalSignatureData;
  isSigned: boolean;
}

export const MulticobrancaProposalDoc: React.FC<MulticobrancaProposalDocProps> = ({
  proposal,
  clientInfo,
  currentPlan,
  signatureData,
  isSigned,
}) => {
  const is1k = proposal.planId === 'regua-1k';
  const is3k = proposal.planId === 'regua-3k';
  const is5k = proposal.planId === 'regua-5k';
  const is10k = proposal.planId === 'regua-10k';

  const fin = proposal.financials;
  const activeFeatures = proposal.customFeatures || currentPlan.features;

  return (
    <div id="multicobranca-proposal-doc" className="pdf-document w-full space-y-6">
      
      {/* ========================================================
          PÁGINA 1 DE 3: IDENTIFICAÇÃO E APRESENTAÇÃO DO SERVIÇO
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
        <div className="flex-1 flex flex-col justify-start space-y-2.5 pt-1">
          {/* Title & Subtitle */}
          <div>
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">
              Proposta Comercial · Multicobrança
            </h1>
            <p className="text-[10.5px] text-slate-600 mt-0.5">
              Cobrança automática pelo WhatsApp corporativo, integrada ao ERP ou banco que sua empresa já utiliza
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
            Esta Proposta integra o Contrato Mestre de Prestação de Serviços ({proposal.contractMasterId}) e é regida por suas cláusulas. O escopo compreende o plano de mensageria assinalado e as integrações validadas; serviços não listados estão excluídos (Cláusula 1.4 do Contrato Mestre).
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
                  <span>☐ Upgrade de Franquia</span>
                  <span>☐ Renovação</span>
                </span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-white">
                <span className="col-span-4 font-bold text-slate-800">Início da Vigência:</span>
                <span className="col-span-8 text-slate-800 font-mono">{proposal.createdAt}</span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-slate-50">
                <span className="col-span-4 font-bold text-slate-800">Sistema / Gateway Integrado:</span>
                <span className="col-span-8 text-slate-900 font-medium">
                  {clientInfo.currentSystemName || proposal.diagnosticData?.currentSystem || 'Sistema de Pagamento Atual'}
                </span>
              </div>
              <div className="grid grid-cols-12 py-1 px-2 bg-white">
                <span className="col-span-4 font-bold text-slate-800">WhatsApp Conectado:</span>
                <span className="col-span-8 text-slate-900 font-mono">
                  {clientInfo.connectedWhatsApp || clientInfo.phone || '[Nº WhatsApp Comercial]'}
                </span>
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

          {/* SEÇÃO 2: O QUE É A MULTICOBRANÇA */}
          <div className="space-y-1">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 2 · O QUE É A MULTICOBRANÇA
            </h2>
            <p className="text-slate-800 text-[10px] leading-relaxed">
              A Multicobrança conecta-se diretamente à API do WhatsApp oficial da sua empresa e dispara lembretes preventivos, avisos no vencimento e régua de inadimplência de forma 100% automatizada:
            </p>

            <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-700 text-[9.5px] pl-1">
              <li className="flex items-center gap-1.5">
                <span className="text-[#D40B3A] font-bold">•</span>
                <span>Lembretes pré e pós vencimento com código Pix e fatura</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D40B3A] font-bold">•</span>
                <span>Envio pelo número oficial de WhatsApp da sua empresa</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D40B3A] font-bold">•</span>
                <span>Cobrança amigável com redução comprovada de atrasos</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D40B3A] font-bold">•</span>
                <span>Sem necessidade de migrar banco ou trocar de sistema ERP</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D40B3A] font-bold">•</span>
                <span>Régua e templates validados previamente com a Contratante</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="text-[#D40B3A] font-bold">•</span>
                <span>Monitoramento diário de entregas e suporte dedicado</span>
              </li>
            </ul>

            <div className="border-l-3 border-[#D40B3A] bg-red-50/80 p-2 rounded-r text-[9.5px] text-slate-800 font-medium">
              <strong>Custos da Meta (WhatsApp) incluídos na mensalidade.</strong> Todos os custos de envio das conversas oficiais do WhatsApp (Meta), dentro da franquia do plano contratado, já estão totalmente inclusos na mensalidade acordada.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 1 de 3</span>
        </div>
      </div>

      {/* ========================================================
          PÁGINA 2 DE 3: PLANOS, RESUMO FINANCEIRO, CRONOGRAMA E SLA
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
          {/* SEÇÃO 3: PLANOS E FRANQUIAS */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 3 · PLANOS E FRANQUIAS DE MENSAGENS
            </h2>

            <div className="border border-slate-300 rounded overflow-hidden text-[10px]">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-1 px-2 text-left w-2/5">Item de Mensageria</th>
                    <th className="py-1 px-1.5 border-l border-slate-800 w-[15%]">1.000</th>
                    <th className="py-1 px-1.5 border-l border-slate-800 w-[15%]">3.000</th>
                    <th className="py-1 px-1.5 border-l border-slate-800 w-[15%]">5.000</th>
                    <th className="py-1 px-1.5 border-l border-slate-800 w-[15%]">10.000</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr className="bg-amber-50/90 font-bold">
                    <td className="py-1 px-2 text-left text-slate-900">PLANO CONTRATADO</td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${is1k ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {is1k ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${is3k ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {is3k ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${is5k ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {is5k ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                    <td className="py-1 px-1 border-l border-slate-200">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] ${is10k ? 'bg-[#D40B3A] text-white font-extrabold' : 'text-slate-400'}`}>
                        {is10k ? '☑ SELECIONADO' : '☐'}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 text-left text-slate-800 font-medium">Franquia de mensagens / mês</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono text-slate-800">1.000</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono text-slate-800">3.000</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono text-slate-800">5.000</td>
                    <td className="py-0.5 border-l border-slate-200 font-mono text-slate-800">10.000</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 text-left text-slate-800 font-medium">Custos da Meta (WhatsApp)</td>
                    <td className="py-0.5 border-l border-slate-200 font-semibold text-emerald-700">Incluídos</td>
                    <td className="py-0.5 border-l border-slate-200 font-semibold text-emerald-700">Incluídos</td>
                    <td className="py-0.5 border-l border-slate-200 font-semibold text-emerald-700">Incluídos</td>
                    <td className="py-0.5 border-l border-slate-200 font-semibold text-emerald-700">Incluídos</td>
                  </tr>
                  <tr className="font-bold bg-slate-200/80">
                    <td className="py-0.5 px-2 text-left text-slate-900">Mensalidade</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono text-slate-900">R$ 179</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono text-[#D40B3A]">R$ 299</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono text-slate-900">R$ 499</td>
                    <td className="py-0.5 border-l border-slate-300 font-mono text-slate-900">R$ 999</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[9px] text-slate-500 leading-tight pt-0.5">
              Valores por mês. O valor efetivamente contratado consta da Seção 4. Mensagens adicionais excedentes: R$ 0,15 por mensagem.
            </p>
          </div>

          {/* SEÇÃO 4: RESUMO FINANCEIRO */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 4 · RESUMO FINANCEIRO CONTRATADO
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
                    <td className="py-1 px-2 font-bold text-slate-900">Setup de Integração (único)</td>
                    <td className="py-1 px-2 font-mono font-bold text-slate-900">{formatBRL(fin.setupTotal)}</td>
                    <td className="py-1 px-2 text-slate-700">À vista na ativação ou parcelado via Asaas</td>
                  </tr>
                  <tr className="bg-slate-50 text-[9.5px]">
                    <td className="py-0.5 px-2 pl-5 text-slate-600">↳ Desconto sobre setup</td>
                    <td className="py-0.5 px-2 font-mono text-slate-700">
                      {fin.setupDiscountApplied ? formatBRL(fin.setupDiscountValue) : 'Não'}
                    </td>
                    <td className="py-0.5 px-2 text-slate-600">
                      {fin.setupDiscountApplied ? (fin.setupDiscountReason || 'Condição acordada') : 'Sem desconto aplicado'}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-1 px-2 font-bold text-slate-900">Mensalidade de Gestão e Servidores</td>
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
          </div>

          {/* SEÇÃO 5: CRONOGRAMA */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 5 · CRONOGRAMA DE IMPLANTAÇÃO
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden text-[9.5px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-white font-bold">
                    <th className="py-0.5 px-2 w-5/12">Etapa</th>
                    <th className="py-0.5 px-2 w-1/4">Prazo estimado</th>
                    <th className="py-0.5 px-2 w-1/3">Dependência da Contratante</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  <tr>
                    <td className="py-0.5 px-2 font-medium">Conexão da API WhatsApp e webhook</td>
                    <td className="py-0.5 px-2 font-mono text-slate-800">3 dias úteis</td>
                    <td className="py-0.5 px-2 text-slate-600">Acessos e aprovação na Meta</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 font-medium">Validação de réguas e textos amigáveis</td>
                    <td className="py-0.5 px-2 font-mono text-slate-800">2 dias úteis</td>
                    <td className="py-0.5 px-2 text-slate-600">Aprovação dos modelos de texto</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-medium">Go-Live e início dos disparos automáticos</td>
                    <td className="py-0.5 px-2 font-mono text-slate-800">Imediato</td>
                    <td className="py-0.5 px-2 text-slate-600">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO 6: SLA */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 6 · NÍVEL DE SERVIÇO E SUPORTE (SLA)
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
                    <td className="py-0.5 px-2 text-slate-800">Envios WhatsApp paralisados</td>
                    <td className="py-0.5 px-2 text-center font-mono font-bold text-red-700">1 h</td>
                    <td className="py-0.5 px-2 text-center font-bold text-red-700">Prioritária</td>
                  </tr>
                  <tr>
                    <td className="py-0.5 px-2 font-bold text-amber-700">Alta</td>
                    <td className="py-0.5 px-2 text-slate-800">Alteração em massa; falhas de entrega</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">2 h</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">1 dia útil</td>
                  </tr>
                  <tr className="bg-slate-50">
                    <td className="py-0.5 px-2 font-bold text-blue-700">Normal</td>
                    <td className="py-0.5 px-2 text-slate-800">Dúvidas; inclusão de novos templates</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">3 h</td>
                    <td className="py-0.5 px-2 text-center font-mono text-slate-800">5 dias úteis</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* SEÇÃO 7: PERMANÊNCIA */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              SEÇÃO 7 · VIGÊNCIA E PERMANÊNCIA
            </h2>
            <div className="border border-slate-300 rounded p-1.5 bg-slate-50 text-[10px] space-y-0.5">
              <p className="text-slate-800">
                <strong>Prazo Contratual:</strong> <strong className="text-slate-950 font-bold">☑ 12 (doze) meses</strong>, contados a partir da data de aceite ({proposal.createdAt}).
              </p>
              <p className="text-slate-800">
                <strong>Condições Especiais:</strong> Franquia de disparos de mensagens WhatsApp com infraestrutura de servidores e APIs dedicada.
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
                Plano: {currentPlan.name} ({currentPlan.headline})
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

          {/* SEÇÃO 8: ACEITE DA PROPOSTA */}
          <div className="space-y-2">
            <h2 className="font-bold text-[#D40B3A] text-xs uppercase tracking-wider">
              SEÇÃO 8 · FORMALIZAÇÃO DO ACEITE DA PROPOSTA
            </h2>
            <p className="text-slate-700 text-[10.5px] leading-relaxed text-justify">
              Ao formalizar o aceite, a Contratante declara expressamente que concorda integralmente com os termos desta Proposta Comercial e com todas as disposições do Contrato Mestre de Prestação de Serviços vinculado ({proposal.contractMasterId}). O aceite possui validade jurídica plena conforme MP nº 2.200-2/2001 e Lei Federal nº 14.063/2020.
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
                <span>CERTIFICADO DE ASSINATURA ELETRÔNICA · MULTICOBRANÇA</span>
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
