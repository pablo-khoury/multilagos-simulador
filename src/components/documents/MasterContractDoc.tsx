import React from 'react';
import { CommercialProposal, ClientInfo, DigitalSignatureData } from '../../types';
import { MULTILAGOS_INFO, MASTER_CONTRACT_FULL_TEXT } from '../../data/mockData';
import { MultilagosLogo } from '../MultilagosLogo';
import { ShieldCheck } from 'lucide-react';

interface MasterContractDocProps {
  proposal: CommercialProposal;
  clientInfo: ClientInfo;
  signatureData: DigitalSignatureData;
  isSigned: boolean;
}

export const MasterContractDoc: React.FC<MasterContractDocProps> = ({
  proposal,
  clientInfo,
  signatureData,
  isSigned,
}) => {
  const c1 = MASTER_CONTRACT_FULL_TEXT.clauses[0];
  const c2 = MASTER_CONTRACT_FULL_TEXT.clauses[1];
  const c3 = MASTER_CONTRACT_FULL_TEXT.clauses[2];
  const c4 = MASTER_CONTRACT_FULL_TEXT.clauses[3];
  const c5 = MASTER_CONTRACT_FULL_TEXT.clauses[4];
  const c6 = MASTER_CONTRACT_FULL_TEXT.clauses[5];
  const c7 = MASTER_CONTRACT_FULL_TEXT.clauses[6];
  const c8 = MASTER_CONTRACT_FULL_TEXT.clauses[7];
  const c9 = MASTER_CONTRACT_FULL_TEXT.clauses[8];
  const c10 = MASTER_CONTRACT_FULL_TEXT.clauses[9];
  const c11 = MASTER_CONTRACT_FULL_TEXT.clauses[10];
  const c12 = MASTER_CONTRACT_FULL_TEXT.clauses[11];

  return (
    <div id="master-contract-doc" className="pdf-document w-full space-y-6">
      
      {/* ========================================================
          PÁGINA 1 DE 4: IDENTIFICAÇÃO DAS PARTES, PREÂMBULO E CLÁUSULA 1
      ======================================================== */}
      <div className="pdf-page">
        {/* Page 1 Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Contrato Mestre (MSA) - Página 1 de 4
          </div>
        </div>

        {/* Page 1 Body */}
        <div className="flex-1 flex flex-col justify-start space-y-2 pt-1 text-[10.5px]">
          <div>
            <h1 className="text-xl font-bold text-slate-950 tracking-tight">
              Contrato Mestre de Prestação de Serviços
            </h1>
            <p className="text-[10.5px] text-slate-600 mt-0.5">
              Consultoria corporativa, tecnologia, esteiras financeiras e gestão automatizada de cobrança
            </p>
          </div>

          {/* Meta Bar */}
          <div className="border border-slate-950 rounded overflow-hidden">
            <div className="grid grid-cols-3 bg-slate-950 text-white font-bold text-[10.5px] py-1 px-2 text-center">
              <div>Contrato nº</div>
              <div>Versão</div>
              <div>Data de Emissão</div>
            </div>
            <div className="grid grid-cols-3 bg-slate-50 text-slate-900 font-mono text-center py-1 px-2 text-xs font-semibold border-t border-slate-300">
              <div>{proposal.contractMasterId}</div>
              <div>1.0 (Oficial)</div>
              <div>{isSigned && signatureData.signedAt ? signatureData.signedAt.split(' ')[0] : proposal.createdAt}</div>
            </div>
          </div>

          {/* Identificação das Partes */}
          <div className="space-y-0.5">
            <h2 className="font-bold text-[#D40B3A] text-[10.5px] uppercase tracking-wider">
              IDENTIFICAÇÃO DAS PARTES
            </h2>
            <div className="border border-slate-300 rounded overflow-hidden divide-y divide-slate-200 text-[10px]">
              <div className="grid grid-cols-12 py-1 px-2 bg-slate-50">
                <span className="col-span-3 font-bold text-slate-800">CONTRATADA:</span>
                <div className="col-span-9 text-slate-800">
                  <strong className="text-slate-950 font-bold">{MULTILAGOS_INFO.companyName}</strong>, pessoa jurídica de direito privado inscrita no CNPJ sob o nº {MULTILAGOS_INFO.cnpj}, com sede em {MULTILAGOS_INFO.address}, neste ato representada por seu Diretor, {MULTILAGOS_INFO.representativeName}, portador do CPF nº {MULTILAGOS_INFO.representativeCpf}.
                </div>
              </div>

              <div className="grid grid-cols-12 py-1 px-2 bg-white">
                <span className="col-span-3 font-bold text-slate-800">CONTRATANTE:</span>
                <div className="col-span-9 text-slate-800">
                  <strong className="text-slate-950 font-bold">{clientInfo.companyName || '[RAZÃO SOCIAL DA CONTRATANTE]'}</strong>
                  {clientInfo.tradeName ? ` (${clientInfo.tradeName})` : ''}, inscrita no CNPJ sob o nº {clientInfo.cnpj || '[CNPJ]'}, com sede em {clientInfo.address ? `${clientInfo.address}, ` : ''}{clientInfo.cityState || '[CIDADE/UF]'}, representada por <strong className="text-slate-950">{clientInfo.contactName || '[NOME DO REPRESENTANTE]'}</strong>, CPF nº {clientInfo.cpf || '[CPF]'}.
                </div>
              </div>

              <div className="grid grid-cols-12 py-1 px-2 bg-slate-50">
                <span className="col-span-3 font-bold text-slate-800">CANAIS OFICIAIS:</span>
                <div className="col-span-9 text-slate-700 flex items-center justify-between text-[9.5px]">
                  <span>Contratada: <strong>{MULTILAGOS_INFO.email}</strong> / <strong>{MULTILAGOS_INFO.phone}</strong></span>
                  <span>Contratante: <strong>{clientInfo.email || '[e-mail]'}</strong> / <strong>{clientInfo.phone || '[WhatsApp]'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Preâmbulo */}
          <p className="text-slate-700 text-[10px] italic bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed">
            {MASTER_CONTRACT_FULL_TEXT.preamble}
          </p>

          {/* Cláusula 1 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[11px] tracking-wide">
              {c1.title}
            </h3>
            <div className="space-y-0.5 text-slate-700 leading-relaxed text-justify text-[9.5px]">
              {c1.items.map((item, idx) => (
                <p key={idx}>{item}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Page 1 Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 1 de 4</span>
        </div>
      </div>

      {/* ========================================================
          PÁGINA 2 DE 4: CLÁUSULAS 2, 3 E 4
      ======================================================== */}
      <div className="pdf-page">
        {/* Page 2 Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Contrato Mestre (MSA) - Página 2 de 4
          </div>
        </div>

        {/* Page 2 Body */}
        <div className="flex-1 flex flex-col justify-start space-y-2 pt-1 text-[10px] text-slate-700 leading-relaxed text-justify">
          {/* Cláusula 2 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[11px] tracking-wide">
              {c2.title}
            </h3>
            <div className="space-y-0.5 text-[9.5px]">
              {c2.items.map((item, idx) => (
                <p key={idx}>{item}</p>
              ))}
            </div>
          </div>

          {/* Cláusula 3 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[11px] tracking-wide">
              {c3.title}
            </h3>
            <div className="space-y-0.5 text-[9.5px]">
              {c3.items.map((item, idx) => (
                <p key={idx}>{item}</p>
              ))}
            </div>
          </div>

          {/* Cláusula 4 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[11px] tracking-wide">
              {c4.title}
            </h3>
            <div className="space-y-0.5 text-[9.5px]">
              {c4.items.map((item, idx) => (
                <p key={idx}>{item}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 2 de 4</span>
        </div>
      </div>

      {/* ========================================================
          PÁGINA 3 DE 4: CLÁUSULAS 5 A 11
      ======================================================== */}
      <div className="pdf-page">
        {/* Page 3 Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Contrato Mestre (MSA) - Página 3 de 4
          </div>
        </div>

        {/* Page 3 Body */}
        <div className="flex-1 flex flex-col justify-start space-y-1.5 pt-1 text-[9.5px] text-slate-700 leading-relaxed text-justify">
          {/* Cláusula 5 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c5.title}</h3>
            <div className="space-y-0.5">{c5.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>

          {/* Cláusula 6 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c6.title}</h3>
            <div className="space-y-0.5">{c6.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>

          {/* Cláusula 7 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c7.title}</h3>
            <div className="space-y-0.5">{c7.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>

          {/* Cláusula 8 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c8.title}</h3>
            <div className="space-y-0.5">{c8.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>

          {/* Cláusula 9 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c9.title}</h3>
            <div className="space-y-0.5">{c9.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>

          {/* Cláusula 10 & 11 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c10.title}</h3>
            <div className="space-y-0.5">{c10.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[10.5px] tracking-wide">{c11.title}</h3>
            <div className="space-y-0.5">{c11.items.map((item, idx) => (<p key={idx}>{item}</p>))}</div>
          </div>
        </div>

        {/* Page 3 Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 3 de 4</span>
        </div>
      </div>

      {/* ========================================================
          PÁGINA 4 DE 4: CLÁUSULA 12, ASSINATURAS E CERTIFICADO DIGITAL
      ======================================================== */}
      <div className="pdf-page">
        {/* Page 4 Header */}
        <div className="shrink-0 flex items-center justify-between pb-2 border-b border-slate-300">
          <MultilagosLogo variant="light" height={26} />
          <div className="text-right text-[10px] text-slate-500 font-medium">
            MULTILAGOS · Negócios & Tecnologia | Contrato Mestre (MSA) - Página 4 de 4
          </div>
        </div>

        {/* Page 4 Body */}
        <div className="flex-1 flex flex-col justify-start space-y-2.5 pt-1 text-[10.5px] text-slate-800">
          {/* Cláusula 12 */}
          <div className="space-y-0.5">
            <h3 className="font-bold text-slate-950 text-[11px] tracking-wide">{c12.title}</h3>
            <div className="space-y-0.5 text-[9.5px] text-slate-700 leading-relaxed text-justify">
              {c12.items.map((item, idx) => (
                <p key={idx}>{item}</p>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-800 leading-relaxed bg-slate-50 p-2 rounded border border-slate-200">
            E, por estarem plenamente ajustadas e acordadas, as Partes celebram este Contrato Mestre de forma eletrônica para que produza todos os seus efeitos de direito. Local e data de expedição: {clientInfo.cityState || 'Belo Horizonte/MG'}, {isSigned && signatureData.signedAt ? signatureData.signedAt.split(' ')[0] : proposal.createdAt}.
          </div>

          {/* Assinaturas */}
          <div className="pt-2 border-t border-slate-300 grid grid-cols-2 gap-6 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-950 uppercase">{MULTILAGOS_INFO.companyName}</p>
              <p className="text-slate-700">{MULTILAGOS_INFO.representativeName}</p>
              <p className="text-[9px] text-slate-500 font-mono">Assinado digitalmente por autoridade emissora Multilagos</p>
            </div>

            <div className="space-y-0.5">
              <p className="font-bold text-slate-950 uppercase">{clientInfo.companyName || '[RAZÃO SOCIAL]'}</p>
              <p className="text-slate-700">{clientInfo.contactName || '[Representante Legal]'} ({clientInfo.contactRole || 'Administrador'})</p>
              <p className="text-[9px] text-slate-500 font-mono">
                {isSigned ? `Autenticado digitalmente · ${signatureData.signedAt}` : 'Pendente de assinatura eletrônica'}
              </p>
            </div>
          </div>

          {/* Testemunhas */}
          <div className="pt-2 grid grid-cols-2 gap-6 text-[9.5px] text-slate-600 border-t border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Testemunha 1</p>
              <p>Nome: Rafael Martins Ribeiro</p>
              <p className="font-mono">CPF: 089.441.786-21</p>
            </div>
            <div>
              <p className="font-bold text-slate-800">Testemunha 2</p>
              <p>Nome: Mariana Souza Dias</p>
              <p className="font-mono">CPF: 112.553.890-44</p>
            </div>
          </div>

          {/* CERTIFICADO DIGITAL OFICIAL NO RODAPÉ */}
          <div className="mt-2 pt-2 border-t-2 border-dashed border-slate-300 bg-slate-50 p-3 rounded-xl text-[9.5px] text-slate-600 space-y-1">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <div className="flex items-center gap-1.5 font-bold text-slate-900">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D40B3A]" />
                <span>CERTIFICADO DE ASSINATURA ELETRÔNICA · CONTRATO MESTRE (MSA)</span>
              </div>
              <span className="font-mono text-slate-500 text-[9px]">MP nº 2.200-2/2001 · Lei 14.063/2020</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5 font-mono text-[8.5px]">
              <div>
                <span className="text-slate-400 block font-sans text-[8px]">Signatário:</span>
                <span className="text-slate-900 font-bold">{signatureData.signerName || clientInfo.contactName || 'Pendente'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[8px]">CPF / CNPJ:</span>
                <span>{signatureData.signerCpf || clientInfo.cpf || '—'} · {clientInfo.cnpj || '—'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[8px]">Data & Hora do Registro:</span>
                <span>{signatureData.signedAt || 'Aguardando validação'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-sans text-[8px]">Endereço IP & Hash:</span>
                <span className="truncate block font-bold text-slate-800" title={signatureData.verificationHash || 'ML-HASH-PENDING'}>
                  {signatureData.signerIp || '187.122.45.109'} · {signatureData.verificationHash || 'ML-MSA-HASH'}
                </span>
              </div>
            </div>
            <p className="text-[8px] text-slate-400 pt-0.5 font-sans">
              Documento assinado eletronicamente com integridade criptográfica verificada pela plataforma da Multilagos Negócios & Tecnologia Ltda.
            </p>
          </div>
        </div>

        {/* Page 4 Footer */}
        <div className="shrink-0 flex items-center justify-between pt-2 border-t border-slate-300 text-[10px] text-slate-500">
          <span>MULTILAGOS · Negócios & Tecnologia</span>
          <span>Página 4 de 4</span>
        </div>
      </div>

    </div>
  );
};
