import JSZip from 'jszip';
import { MULTILAGOS_INFO } from '../data/mockData';

export interface DocumentClause {
  num: string;
  title: string;
  items: string[];
}

export interface MasterContractModel {
  title: string;
  subtitle: string;
  version: string;
  codePrefix: string;
  contractor: {
    companyName: string;
    cnpj: string;
    address: string;
    representative: string;
    cpf: string;
    channels: string;
  };
  preamble: string;
  clauses: DocumentClause[];
}

export const OFFICIAL_MASTER_CONTRACT_V2: MasterContractModel = {
  title: 'Contrato Mestre de Prestação de Serviços (MSA)',
  subtitle: 'Consultoria corporativa, tecnologia, esteiras financeiras e gestão automatizada de cobrança',
  version: '2.0 (Oficial Atualizado)',
  codePrefix: 'MSA-2026',
  contractor: {
    companyName: MULTILAGOS_INFO.companyName,
    cnpj: MULTILAGOS_INFO.cnpj,
    address: MULTILAGOS_INFO.address,
    representative: MULTILAGOS_INFO.representativeName,
    cpf: MULTILAGOS_INFO.representativeCpf,
    channels: `${MULTILAGOS_INFO.email} / ${MULTILAGOS_INFO.phone}`,
  },
  preamble:
    'As partes celebram este Contrato Mestre de Prestação de Serviços ("Contrato"), que reúne as regras gerais, jurídicas e operacionais permanentes da relação entre elas. Os serviços contratados, seus valores, escopos específicos, SLAs e condições financeiras são definidos nas respectivas Propostas Comerciais vinculadas, na forma da Cláusula Primeira.',
  clauses: [
    {
      num: '1',
      title: 'CLÁUSULA PRIMEIRA – OBJETO E ESTRUTURA CONTRATUAL',
      items: [
        '1.1. O objeto deste Contrato é a prestação, pela CONTRATADA, de serviços especializados de consultoria de negócios, parametrização técnica, implantação, integração e suporte contínuo de esteiras de cobrança e contas digitais corporativas, compreendendo: (i) implantação, homologação e gestão de contas digitais e gateways de pagamento Asaas; (ii) esteira de cobrança automatizada via WhatsApp Business Cloud API e e-mail; e (iii) consultoria de parametrização, integrações com ERPs e BPO financeiro especializado.',
        '1.2. Cada serviço é formalizado por meio de Proposta Comercial ("Proposta"), que define com força executiva e vinculante o plano escolhido, escopo de entregáveis, cronograma, valores de implantação/setup, mensalidades, franquias de mensagens, SLA de atendimento e eventuais prazos de permanência mínima.',
        '1.3. Toda Proposta aceita integra este Contrato para todos os fins de direito. Em caso de eventual divergência, as condições particulares da Proposta prevalecerão sobre preço, prazo e escopo, aplicando-se este Contrato Mestre a todas as demais matérias legais e operacionais.',
        '1.4. Os serviços constituem obrigação de meio. A CONTRATADA empregará a melhor técnica e diligência na configuração de réguas e esteiras, não garantindo resultados financeiros específicos ou índices fixos de adimplência, os quais dependem da solvência e comportamento dos clientes finais da CONTRATANTE.',
      ],
    },
    {
      num: '2',
      title: 'CLÁUSULA SEGUNDA – CONTRATAÇÃO, UPGRADE E ALTERAÇÃO DE SERVIÇOS',
      items: [
        '2.1. A Proposta considera-se perfeita e aceita mediante: (i) assinatura eletrônica com certificado digital em conformidade com a MP nº 2.200-2/2001 e Lei nº 14.063/2020; (ii) aceite expresso em plataforma eletrônica contratual; ou (iii) confirmação inequívoca por e-mail ou canal de WhatsApp oficial do representante legal.',
        '2.2. A CONTRATANTE poderá solicitar migração de plano (upgrade) ou inclusão de novos módulos a qualquer tempo, sendo formalizada nova Proposta substitutiva sem necessidade de novo Contrato Mestre.',
        '2.3. O cancelamento ou redução de serviços requer comunicação prévia por escrito com antecedência mínima de 30 (trinta) dias corridos, respeitado eventual prazo de vigência mínima assinalado na Proposta. Taxas de setup e implantação já executadas não são reembolsáveis.',
      ],
    },
    {
      num: '3',
      title: 'CLÁUSULA TERCEIRA – OBRIGAÇÕES DAS PARTES',
      items: [
        '3.1. A CONTRATADA obriga-se a: (a) executar os serviços com rigor técnico, equipe capacitada e boas práticas de segurança cibernética (incluindo autenticação em dois fatores e gestão de credenciais); (b) manter a CONTRATANTE tempestivamente informada sobre status de homologação e implantação; (c) fornecer suporte operacional nos termos do SLA contratado; e (d) resguardar o sigilo absoluto dos dados financeiros acessados.',
        '3.2. A CONTRATANTE obriga-se a: (a) fornecer tempestivamente os acessos, credenciais de API e documentações societárias solicitadas; (b) designar formalmente um ponto focal técnico/financeiro com autonomia de decisão; (c) validar previamente textos, fluxos e réguas de cobrança antes de sua ativação em produção; (d) abster-se de alterar parametrizações críticas sem anuência prévia da CONTRATADA; e (e) arcar pontualmente com as faturas dos serviços e tarifas bancárias das plataformas integradas.',
      ],
    },
    {
      num: '4',
      title: 'CLÁUSULA QUARTA – PLATAFORMAS DE TERCEIROS E GATEWAYS',
      items: [
        '4.1. A CONTRATADA atua como integradora e consultora de tecnologia parceira homologada do Asaas Gestão Financeira Instituição de Pagamento S.A., Meta Platforms (WhatsApp Business API) e plataformas de ERP, não sendo proprietária direta nem operadora exclusiva de referidas infraestruturas.',
        '4.2. A CONTRATANTE mantém titularidade direta sobre sua conta de pagamento digital, submetendo-se aos termos de serviço, critérios de análise de crédito, prevenção a fraudes e políticas de compliance do Asaas e das instituições financeiras reguladas pelo Banco Central do Brasil.',
        '4.3. Instabilidades momentâneas de rede pública, manutenções programadas de gateways ou bloqueios regulatórios de números de mensageria decorrentes de condutas externas não configuram inadimplemento da CONTRATADA, cabendo a esta prestar diligente suporte técnico e intermediação perante os fornecedores.',
      ],
    },
    {
      num: '5',
      title: 'CLÁUSULA QUINTA – NÍVEL DE SERVIÇO (SLA) E SUPORTE TÉCNICO',
      items: [
        '5.1. O suporte técnico é prestado em dias úteis, das 09h00 às 17h00 (horário de Brasília), através dos canais oficiais (WhatsApp Executivo e Help Desk Multilagos).',
        '5.2. Ocorrências críticas (paralisação total de esteira de faturamento) têm atendimento prioritário com tempo de primeira resposta de até 2 horas úteis nos planos PRO, Performance e Personalizado.',
        '5.3. Prazos de resolução que dependam de validações de terceiros ou envio de dados pela CONTRATANTE suspendem a contagem do SLA pelo respectivo intervalo.',
      ],
    },
    {
      num: '6',
      title: 'CLÁUSULA SEXTA – REMUNERAÇÃO, REAJUSTE E INADIMPLÊNCIA',
      items: [
        '6.1. A CONTRATANTE pagará à CONTRATADA os valores fixados na Proposta Comercial, compostos pela Taxa de Implantação/Setup (em parcela única ou parcelada) e pela Mensalidade Recorrente do plano selecionado.',
        '6.2. O atraso no pagamento de quaisquer valores acarretará incidência de multa moratória de 2% (dois por cento), juros moratórios de 1% (um por cento) ao mês e correção monetária com base no IPCA/IBGE.',
        '6.3. Em caso de inadimplência superior a 10 (dez) dias corridos, a CONTRATADA fica autorizada a suspender temporariamente os serviços de suporte, automações e manutenções até a integral regularização financeira, sem prejuízo da cobrança dos encargos.',
        '6.4. Os valores mensais serão reajustados anualmente, a contar do início da vigência, pela variação positiva acumulada do IPCA/IBGE ou índice oficial que vier a substituí-lo.',
      ],
    },
    {
      num: '7',
      title: 'CLÁUSULA SÉTIMA – PROTEÇÃO DE DADOS PESSOAIS (LGPD)',
      items: [
        '7.1. As partes declaram estrito cumprimento à Lei Federal nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD). Para os efeitos legais, a CONTRATANTE figura como CONTROLADORA dos dados cadastrais e financeiros de seus clientes e devedores, e a CONTRATADA como OPERADORA técnica.',
        '7.2. A CONTRATADA tratará os dados pessoais exclusivamente na extensão estritamente necessária ao cumprimento do escopo contratado, adotando padrões rigorosos de segurança da informação, criptografia e controle de acesso.',
        '7.3. Em caso de incidente de segurança relevante envolvendo dados pessoais sob sua custódia técnica, a CONTRATADA comunicará a CONTRATANTE em prazo razoável, cooperando na apuração dos fatos e contenção de danos.',
      ],
    },
    {
      num: '8',
      title: 'CLÁUSULA OITAVA – PROPRIEDADE INTELECTUAL',
      items: [
        '8.1. Todos os fluxos lógicos, réguas de cobrança automatizadas, prompts de IA, scripts de integração, arquiteturas de webhook e parametrizações desenvolvidos pela CONTRATADA constituem sua propriedade intelectual exclusiva e know-how comercial.',
        '8.2. A CONTRATANTE recebe licença de uso temporária, não exclusiva e intransferível durante a vigência do contrato, para utilização restrita às suas operações corporativas internas.',
      ],
    },
    {
      num: '9',
      title: 'CLÁUSULA NONA – CONFIDENCIALIDADE E NÃO-DIVULGAÇÃO',
      items: [
        '9.1. As Partes comprometem-se a resguardar em absoluto sigilo todas as informações comerciais, estratégicas, financeiras e cadastrais a que tiverem acesso em virtude deste contrato pelo prazo de vigência e por 5 (cinco) anos após o seu encerramento.',
        '9.2. A CONTRATANTE autoriza a menção de seu nome e logotipo institucional no portfólio de clientes e cases de sucesso da CONTRATADA, preservados todos os valores financeiros e dados confidenciais.',
      ],
    },
    {
      num: '10',
      title: 'CLÁUSULA DÉCIMA – LIMITAÇÃO DE RESPONSABILIDADE',
      items: [
        '10.1. A responsabilidade indenizatória total da CONTRATADA por eventuais prejuízos comprovadamente causados por culpa exclusiva na execução dos serviços fica limitada ao montante total efetivamente recebido da CONTRATANTE nos 12 (doze) meses anteriores ao fato gerador.',
        '10.2. Em nenhuma hipótese qualquer das Partes responderá perante a outra por lucros cessantes, perda de oportunidades comerciais, danos indiretos ou penalidades tributárias geradas por erros cadastrais imputáveis à contraparte.',
      ],
    },
    {
      num: '11',
      title: 'CLÁUSULA DÉCIMA PRIMEIRA – VIGÊNCIA E RESCISÃO',
      items: [
        '11.1. Este Contrato Mestre vigora por prazo de 12 (doze) meses a contar de sua assinatura, renovando-se automaticamente por períodos iguais e sucessivos caso não haja manifestação expressa em contrário de qualquer das Partes com 30 (trinta) dias de antecedência.',
        '11.2. O Contrato poderá ser rescindido motivadamente por qualquer das Partes em caso de infração contratual não sanada no prazo de 15 (quinze) dias contados de notificação específica, ou imediatamente em casos de recuperação judicial ou falência.',
      ],
    },
    {
      num: '12',
      title: 'CLÁUSULA DÉCIMA SEGUNDA – DISPOSIÇÕES GERAIS, VALIDADE JURÍDICA E FORO',
      items: [
        '12.1. As Partes expressamente pactuam e reconhecem a plena validade, higidez jurídica e eficácia executiva do presente contrato assinado em meio eletrônico, nos moldes do art. 10, § 2º da MP nº 2.200-2/2001 e do Código de Processo Civil.',
        '12.2. Eventual tolerância quanto ao descumprimento de prazos ou obrigações constituirá mera liberalidade, não implicando novação ou renúncia aos direitos avençados.',
        '12.3. Para dirimir quaisquer litígios oriundos deste Contrato ou das Propostas vinculadas, as Partes elegem com renúncia irrevogável a qualquer outro, por mais privilegiado que seja, o Foro da Comarca de Belo Horizonte, Estado de Minas Gerais.',
      ],
    },
  ],
};

export function getMasterContractMarkdown(): string {
  const c = OFFICIAL_MASTER_CONTRACT_V2;
  let md = `# ${c.title.toUpperCase()}\n`;
  md += `## ${c.subtitle}\n`;
  md += `**Versão:** ${c.version} | **Código:** ${c.codePrefix}-OFICIAL\n\n`;
  md += `---\n\n`;
  md += `### IDENTIFICAÇÃO DAS PARTES\n\n`;
  md += `**CONTRATADA:** **${c.contractor.companyName}**, pessoa jurídica de direito privado inscrita no CNPJ sob nº ${c.contractor.cnpj}, com sede em ${c.contractor.address}, neste ato representada por seu Diretor Executivo **${c.contractor.representative}**, CPF nº ${c.contractor.cpf}.\n`;
  md += `**CANAIS OFICIAIS:** ${c.contractor.channels}\n\n`;
  md += `**CONTRATANTE:** Qualificada na respectiva Proposta Comercial vinculada ao presente instrumento.\n\n`;
  md += `---\n\n`;
  md += `### PREÂMBULO\n\n`;
  md += `*${c.preamble}*\n\n`;
  md += `---\n\n`;

  for (const clause of c.clauses) {
    md += `### ${clause.title}\n\n`;
    for (const item of clause.items) {
      md += `${item}\n\n`;
    }
  }

  md += `---\n\n`;
  md += `### DECLARAÇÃO DE CIÊNCIA E ACEITE ELETRÔNICO\n\n`;
  md += `As Partes declaram ter lido, compreendido e aceito integralmente os termos deste Contrato Mestre de Prestação de Serviços, o qual se encontra autenticado eletronicamente nos termos da legislação brasileira vigente.\n\n`;
  md += `**Foro de Eleição:** Comarca de Belo Horizonte/MG.\n`;
  return md;
}

export function getAsaasProposalMarkdown(): string {
  return `# PROPOSTA COMERCIAL · IMPLANTAÇÃO E GESTÃO ASAAS
**Documento Vinculado ao Contrato Mestre (MSA)**
**Emissor:** MULTILAGOS – Negócios & Tecnologia Ltda (CNPJ: ${MULTILAGOS_INFO.cnpj})
**Consultor Homologado:** ${MULTILAGOS_INFO.representativeName} (${MULTILAGOS_INFO.phone} / ${MULTILAGOS_INFO.email})
**Versão Oficial:** 2.0 (Atualizada)

---

## 1. APRESENTAÇÃO E OBJETIVO
A Multilagos, na qualidade de parceira e consultora oficial Asaas, apresenta a presente proposta comercial técnica para homologação, implantação, parametrização e sustentação da esteira de cobrança e conta digital da sua empresa.

---

## 2. ESCOPO DOS PLANOS ASAAS DISPONÍVEIS

### PLANO 1: ESSENCIAL
- **Indicado para:** Pequenas operações que precisam padronizar recebíveis e sair do manual.
- **Investimento:** Setup: R$ 750,00 | Mensalidade: R$ 99,00/mês
- **Entregáveis Inclusos:**
  - Consultoria de setup inicial e homologação cadastral completa
  - Treinamento operacional da equipe financeira
  - Migração da base de clientes e cobranças
  - Régua de cobrança completa (e-mail, SMS e link WhatsApp)
  - Fatura personalizada com logotipo da sua empresa
  - Suporte via canal WhatsApp em horário comercial

### PLANO 2: PRO (MAIS INDICADO ⭐)
- **Indicado para:** Empresas em consolidação que demandam automação contábil e suporte próximo.
- **Investimento:** Setup: R$ 1.500,00 | Mensalidade: R$ 249,00/mês
- **Entregáveis Inclusos:**
  - Todos os itens do plano Essencial
  - Robô de cobrança e automação de lembretes avançada
  - Emissão 100% automatizada de NFS-e (Notas Fiscais de Serviço) integradas
  - Parametrização avançada de multas, juros e descontos pontualidade
  - Consultoria estratégica mensal com Pablo Khoury
  - Atendimento prioritário e SLA de 4 horas úteis

### PLANO 3: PERFORMANCE
- **Indicado para:** Empresas com múltiplos sócios, unidades ou parceiros que exigem automação total.
- **Investimento:** Setup: R$ 2.400,00 | Mensalidade: R$ 499,00/mês
- **Entregáveis Inclusos:**
  - Todos os itens do plano PRO
  - Split de pagamento automático entre contas e parceiros
  - Integrações avançadas via Webhooks e API Asaas com ERP da empresa
  - Análise executiva de fluxo de caixa e redução da inadimplência
  - Consultoria quinzenal com Pablo Khoury
  - SLA Crítico de 2 horas úteis

### PLANO 4: PERSONALIZADO
- **Indicado para:** Operações complexas, redes, franquias ou demandas sob medida.
- **Investimento:** Setup: R$ 4.800,00 (ou sob consulta) | Mensalidade: R$ 990,00/mês
- **Entregáveis Inclusos:**
  - Todos os itens dos planos anteriores com SLA de 1 hora
  - Parametrizações customizadas no ERP e esteira sob medida
  - Gestor de conta exclusivo Multilagos
  - Consultoria semanal com Pablo Khoury

---

## 3. TABELA OFICIAL DE TARIFAS ASAAS (CONDIÇÕES EXCLUSIVAS MULTILAGOS)
- **Pix Recebido:** R$ 0,99 por liquidação (Sem custo de emissão ou cancelamento).
- **Boleto Bancário:** R$ 1,89 por boleto compensado (Sem taxa de emissão, baixa ou cancelamento).
- **Cartão de Crédito à Vista:** R$ 0,29 + 2,93% por transação aprovada.
- **Cartão de Débito:** R$ 0,35 + 1,89% por transação.
- **Emissão de NFS-e:** Automatizada diretamente pelo gateway.

---

## 4. CRONOGRAMA DE ATIVAÇÃO
- Etapa 1 (Dias 1 a 3): Envio de documentos, abertura e homologação da conta no Asaas.
- Etapa 2 (Dias 4 a 7): Configuração de faturas, taxas, certificação fiscal de NFS-e e webhook.
- Etapa 3 (Dias 8 a 12): Importação e migração de carteira ativa de clientes e contratos.
- Etapa 4 (Dias 13 a 15): Treinamento da equipe, simulações em ambiente seguro e Go-Live oficial.
`;
}

export function getMulticobrancaProposalMarkdown(): string {
  return `# PROPOSTA COMERCIAL · MULTICOBRANÇA VIA WHATSAPP (N8N)
**Documento Vinculado ao Contrato Mestre (MSA)**
**Emissor:** MULTILAGOS – Negócios & Tecnologia Ltda (CNPJ: ${MULTILAGOS_INFO.cnpj})
**Consultor Homologado:** ${MULTILAGOS_INFO.representativeName} (${MULTILAGOS_INFO.phone} / ${MULTILAGOS_INFO.email})
**Versão Oficial:** 2.0 (Atualizada)

---

## 1. APRESENTAÇÃO DA SOLUÇÃO
A Multilagos Multicobrança é uma esteira inteligente de mensagens automáticas disparadas via WhatsApp Business Cloud API corporativo da própria empresa contratante, integrada ao seu sistema de faturamento, ERP ou banco atual.

---

## 2. FRANQUIAS E PLANOS DE MENSAGENS

### Plano 1.000 Mensagens/mês
- **Investimento:** Setup: R$ 650,00 | Mensalidade: R$ 149,00/mês
- **Franquia:** Até 1.000 mensagens automáticas/mês
- **Incluso:** Custos da Meta inclusos, conexão do WhatsApp próprio e régua de lembretes.

### Plano 3.000 Mensagens/mês (Mais Popular ⭐)
- **Investimento:** Setup: R$ 950,00 | Mensalidade: R$ 299,00/mês
- **Franquia:** Até 3.000 mensagens automáticas/mês
- **Incluso:** Régua completa pré e pós-vencimento, follow-up de atrasos e SLA prioritário em 4h.

### Plano 5.000 Mensagens/mês
- **Investimento:** Setup: R$ 1.400,00 | Mensalidade: R$ 499,00/mês
- **Franquia:** Até 5.000 mensagens automáticas/mês
- **Incluso:** Suporte técnico para alto volume, réguas multinível e SLA de 2h úteis.

### Plano 10.000 Mensagens/mês
- **Investimento:** Setup: R$ 1.900,00 | Mensalidade: R$ 999,00/mês
- **Franquia:** Até 10.000 mensagens automáticas/mês
- **Incluso:** Atendimento crítico com SLA de 1 hora e relatórios semanais de entrega.

---

## 3. BENEFÍCIOS COMPROVADOS
- Aumento de 40% a 70% na recuperação de mensalidades antes do vencimento.
- Eliminação total do trabalho manual de cobrança por funcionários.
- Atendimento via WhatsApp oficial verificado, transmitindo confiança e profissionalismo.
`;
}

export function getFullPackageProposalMarkdown(): string {
  return `# PROPOSTA COMERCIAL · PACOTE INTEGRADO MULTILAGOS
**Implantação Asaas + Régua WhatsApp Corporativa + BPO Consultivo**
**Versão Oficial:** 2.0 (Atualizada)
**Emissor:** MULTILAGOS – Negócios & Tecnologia Ltda (CNPJ: ${MULTILAGOS_INFO.cnpj})

---

## VISÃO INTEGRADA DA SOLUÇÃO
Ao unificar a conta digital homologada Asaas com a régua inteligente de WhatsApp e a consultoria executiva de BPO da Multilagos, a sua empresa conquista:
1. **Redução Imediata de Custos:** Tarifas bancárias de Pix a R$ 0,99 e Boletos a R$ 1,89.
2. **Automação Fiscal e Cobrança:** Emissão de NFS-e sem intervenção manual e régua via WhatsApp.
3. **Previsibilidade de Caixa:** Recuperação de até 80% das mensalidades em atraso.
4. **Governança Jurídica:** Proteção integral via Contrato Mestre (MSA) e auditoria LGPD.
`;
}

/**
 * Generates an uncorrupted, client-side ZIP file with all document templates
 * ready for instant browser download.
 */
export async function generateDocumentsZipBlob(): Promise<Blob> {
  const zip = new JSZip();

  const folder = zip.folder('DOCUMENTOS_OFICIAIS_MULTILAGOS_V2');
  if (folder) {
    folder.file('01-CONTRATO-MESTRE-MSA-V2.0.md', getMasterContractMarkdown());
    folder.file('02-PROPOSTA-COMERCIAL-ASAAS-V2.0.md', getAsaasProposalMarkdown());
    folder.file('03-PROPOSTA-MULTICOBRANCA-WHATSAPP-V2.0.md', getMulticobrancaProposalMarkdown());
    folder.file('04-PROPOSTA-PACOTE-INTEGRADO-V2.0.md', getFullPackageProposalMarkdown());
    folder.file(
      '05-ESPECIFICACOES-TECNICAS-E-TARIFAS.json',
      JSON.stringify(
        {
          emissor: MULTILAGOS_INFO,
          versaoDocumentos: '2.0',
          contratoMestre: OFFICIAL_MASTER_CONTRACT_V2,
          tarifasAsaasMultilagos: [
            { metodo: 'Pix', taxa: 'R$ 0,99', liquidacao: 'Imediata' },
            { metodo: 'Boleto Bancário', taxa: 'R$ 1,89', liquidacao: 'D+1' },
            { metodo: 'Cartão de Débito', taxa: 'R$ 0,35 + 1,89%', liquidacao: 'D+1' },
            { metodo: 'Cartão de Crédito à Vista', taxa: 'R$ 0,29 + 2,93%', liquidacao: 'D+30' },
          ],
        },
        null,
        2
      )
    );
    folder.file(
      'LEIA-ME.txt',
      `MULTILAGOS - NEGÓCIOS & TECNOLOGIA
PACOTE OFICIAL DE DOCUMENTOS JURÍDICOS E COMERCIAIS (VERSÃO 2.0)

Este pacote contém os modelos oficiais de:
1. Contrato Mestre de Prestação de Serviços (MSA) Versão 2.0 (12 Cláusulas Jurídicas)
2. Proposta Comercial Asaas (Planos Essencial, PRO, Performance e Personalizado)
3. Proposta Comercial Multicobrança (Régua de WhatsApp)
4. Proposta Pacote Integrado
5. JSON com tarifas e especificações

Para dúvidas comerciais ou técnicas:
Pablo Hans Miranda Khoury - (22) 99902-0466 | pablo.khoury@multilagos.com.br
`
    );
  }

  return await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 },
  });
}
