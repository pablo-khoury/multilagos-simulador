import { Plan, AsaasConfig, DiagnosticSheetData } from '../types';

export const MULTILAGOS_INFO = {
  companyName: 'MULTILAGOS – NEGÓCIOS E TECNOLOGIA LTDA',
  brandName: 'MULTILAGOS',
  tagline: 'Negócios & Tecnologia',
  cnpj: '43.153.053/0001-55',
  address: 'Rua Rio de Janeiro, nº 243, sala 802, Centro, Belo Horizonte/MG',
  phone: '(22) 99902-0466',
  whatsapp: '5522999020466',
  email: 'pablo.khoury@multilagos.com.br',
  secondaryEmail: 'pablokhoury94@gmail.com',
  website: 'www.multilagos.com.br',
  partnerUrl: 'asaas.com/parceiros/multilagos',
  representativeName: 'Pablo Hans Miranda Khoury',
  representativeCpf: '133.863.187-03',
  representativeRole: 'Diretor / Sócio-Administrador',
};

export const ASAAS_TRANSACTION_RATES = [
  { method: 'Boleto bancário', rate: 'R$ 1,89', detail: 'Por transação recebida. Sem custo de emissão ou cancelamento.' },
  { method: 'Pix', rate: 'R$ 0,99', detail: 'Por transação recebida. Liquidação imediata na conta digital.' },
  { method: 'Cartão de débito', rate: 'R$ 0,35 + 1,89%', detail: 'Por transação recebida.' },
  { method: 'Cartão de crédito à vista', rate: 'R$ 0,29 + 2,93%', detail: 'Por transação. Parcelado (2 a 21x): sob consulta.' },
];

export const DEFAULT_ASAAS_CONFIG: AsaasConfig = {
  apiKey: '$aact_YTU5YTE0M2M2N2I4MTliNjc0OTQ1NjgzMzFiMzMzMjM6OjAwMDAwMDAwMDAwMDAwNzE0NTg6OiRhYWNoXzM0OTYwMmE3LWMxZDMtNDcxOS1iMDYzLTBmNWE5NDk0MzE4NQ==',
  environment: 'sandbox',
  approvedRatePerLiquidation: 0.99,
  webhookUrl: 'https://www.multilagos.com.br/api/webhooks/asaas',
  autoIssueNfse: true,
  erpIntegration: 'omie',
};

// ESTEIRA 1: Implementação Asaas (Tabela Oficial do Documento da Proposta)
export const ASAAS_PLANS: Plan[] = [
  {
    id: 'essencial',
    track: 'asaas',
    name: 'Essencial',
    headline: 'Conta digital, cobrança automatizada e gestão financeira',
    baseMonthlyPrice: 99,
    baseSetupPrice: 750,
    idealFor: 'Pequenas operações que precisam padronizar recebíveis e sair do manual',
    sla: 'SLA de Atendimento em até 8h úteis',
    features: [
      'Consultoria de setup inicial',
      'Treinamento da equipe',
      'Migração da base de clientes',
      'Régua de cobrança completa',
      'Fatura personalizada',
    ],
  },
  {
    id: 'pro',
    track: 'asaas',
    name: 'PRO',
    headline: 'Tudo do Essencial + Emissão de Nota Fiscal de Serviço (NFS-e) e Split',
    baseMonthlyPrice: 379,
    baseSetupPrice: 2500,
    recommended: true,
    badge: 'Mais Indicado',
    idealFor: 'A maioria dos negócios de serviços e recorrência que precisam de automação fiscal',
    sla: 'SLA Prioritário em até 4h úteis',
    features: [
      'Consultoria de setup inicial',
      'Treinamento da equipe',
      'Migração da base de clientes',
      'Régua de cobrança completa',
      'Fatura personalizada',
      'Nota fiscal de serviço automática (NFS-e)',
      'Split de pagamento automático',
    ],
  },
  {
    id: 'performance',
    track: 'asaas',
    name: 'Performance',
    headline: 'Tudo do PRO + Integração com ERPs, Dashboard e Consultoria Estratégica',
    baseMonthlyPrice: 599,
    baseSetupPrice: 3500,
    idealFor: 'Empresas em expansão que utilizam ERP e exigem gestão financeira contínua',
    sla: 'SLA Crítico em até 1 hora',
    features: [
      'Consultoria de setup inicial',
      'Treinamento da equipe',
      'Migração da base de clientes',
      'Régua de cobrança completa',
      'Fatura personalizada',
      'Nota fiscal de serviço automática (NFS-e)',
      'Split de pagamento automático',
      'Integração com ERPs (Omie, Conta Azul, etc.)',
      'Dashboard e BI avançado',
      'Consultoria estratégica mensal com Pablo Khoury',
    ],
  },
  {
    id: 'personalizado',
    track: 'asaas',
    name: 'Personalizado',
    headline: 'Projeto sob medida para operações complexas e grupos empresariais',
    baseMonthlyPrice: 950,
    baseSetupPrice: 4800,
    idealFor: 'Grandes carteiras, filiais e fluxos com regras comerciais customizadas',
    sla: 'SLA Imediato com Gerente de Contas Dedicado',
    features: [
      'Consultoria de setup inicial',
      'Treinamento da equipe',
      'Migração da base de clientes',
      'Régua de cobrança completa',
      'Fatura personalizada',
      'Nota fiscal de serviço automática (NFS-e)',
      'Split de pagamento automático',
      'Integração com ERPs customizados',
      'Dashboard e BI avançado',
      'Consultoria estratégica mensal',
      'Escopo e regras customizadas',
    ],
  },
];

// ESTEIRA 2: Multicobrança (Tabela Oficial do Documento da Proposta de Multicobrança)
export const MULTICOBRANCA_PLANS: Plan[] = [
  {
    id: 'regua-1k',
    track: 'regua-n8n',
    name: '1.000',
    headline: 'Até 1.000 mensagens automáticas/mês pelo WhatsApp',
    baseMonthlyPrice: 179,
    baseSetupPrice: 650,
    messageQuota: 1000,
    idealFor: 'Operações com até 300 clientes ativos',
    sla: 'SLA em até 8h úteis',
    features: [
      'Lembretes antes do vencimento e aviso no dia do vencimento',
      'Cobranças e acompanhamento (follow-up) automáticos após o atraso',
      'Envio pelo WhatsApp da própria empresa',
      'Integração com o seu sistema de pagamento atual',
      'Configuração da estratégia e textos validados antes da ativação',
      'Custos da Meta (WhatsApp) incluídos na mensalidade',
    ],
  },
  {
    id: 'regua-3k',
    track: 'regua-n8n',
    name: '3.000',
    headline: 'Até 3.000 mensagens automáticas/mês pelo WhatsApp',
    baseMonthlyPrice: 299,
    baseSetupPrice: 950,
    messageQuota: 3000,
    recommended: true,
    badge: 'Popular',
    idealFor: 'Empresas em crescimento com até 1.000 contratos',
    sla: 'SLA Prioritário em até 4h úteis',
    features: [
      'Lembretes antes do vencimento e aviso no dia do vencimento',
      'Cobranças e acompanhamento (follow-up) automáticos após o atraso',
      'Envio pelo WhatsApp da própria empresa',
      'Integração com o seu sistema de pagamento atual',
      'Configuração da estratégia e textos validados antes da ativação',
      'Custos da Meta (WhatsApp) incluídos na mensalidade',
    ],
  },
  {
    id: 'regua-5k',
    track: 'regua-n8n',
    name: '5.000',
    headline: 'Até 5.000 mensagens automáticas/mês pelo WhatsApp',
    baseMonthlyPrice: 499,
    baseSetupPrice: 1400,
    messageQuota: 5000,
    idealFor: 'Operações robustas com cobrança parcelada ou recorrente',
    sla: 'SLA Prioritário em até 2h úteis',
    features: [
      'Lembretes antes do vencimento e aviso no dia do vencimento',
      'Cobranças e acompanhamento (follow-up) automáticos após o atraso',
      'Envio pelo WhatsApp da própria empresa',
      'Integração com o seu sistema de pagamento atual',
      'Configuração da estratégia e textos validados antes da ativação',
      'Custos da Meta (WhatsApp) incluídos na mensalidade',
    ],
  },
  {
    id: 'regua-10k',
    track: 'regua-n8n',
    name: '10.000',
    headline: 'Até 10.000 mensagens automáticas/mês pelo WhatsApp',
    baseMonthlyPrice: 999,
    baseSetupPrice: 1900,
    messageQuota: 10000,
    idealFor: 'Grandes carteiras com carnês, mensalidades e alto fluxo',
    sla: 'SLA Crítico em até 1 hora',
    features: [
      'Lembretes antes do vencimento e aviso no dia do vencimento',
      'Cobranças e acompanhamento (follow-up) automáticos após o atraso',
      'Envio pelo WhatsApp da própria empresa',
      'Integração com o seu sistema de pagamento atual',
      'Configuração da estratégia e textos validados antes da ativação',
      'Custos da Meta (WhatsApp) incluídos na mensalidade',
    ],
  },
];

export const ALL_INITIAL_PLANS: Plan[] = [...ASAAS_PLANS, ...MULTICOBRANCA_PLANS];

// Dados iniciais de exemplo fiéis ao Print da Planilha do Usuário
export const INITIAL_DIAGNOSTIC_SHEET: DiagnosticSheetData = {
  companyName: 'Minha Empresa Ltda',
  segment: 'Prestação de Serviços',
  monthlyRevenue: 30000,
  clientCount: 130,
  delinquentClientCount: 10,
  newClientsPerMonth: 5,
  churnClientsPerMonth: 3,
  issuesNfse: 'sim',
  hasCommissionOrSplit: 'sim',
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
  currentSystem: 'Planilhas e ERP',
  collectionMethodNotes: 'Cobrança manual por WhatsApp e conferência de extrato',
  hoursSpentPerWeek: 10,
  reductionGoalPercent: 80,
  generalNotes: 'Cliente busca otimizar a equipe de faturamento, padronizar a emissão fiscal de NFS-e e reduzir atrasos nas mensalidades.',
};

// CONTRATO MESTRE OFICIAL (MSA)
export const MASTER_CONTRACT_FULL_TEXT = {
  title: 'Contrato Mestre de Prestação de Serviços',
  subtitle: 'Consultoria, tecnologia e gestão de cobranças',
  version: '1.0',
  codePrefix: 'MSA',
  parties: {
    contractor: {
      companyName: 'MULTILAGOS – NEGÓCIOS E TECNOLOGIA LTDA',
      cnpj: '43.153.053/0001-55',
      address: 'Rua Rio de Janeiro, nº 243, sala 802, Centro, Belo Horizonte/MG',
      representative: 'Pablo Hans Miranda Khoury',
      cpf: '133.863.187-03',
      channels: 'pablo.khoury@multilagos.com.br / (22) 99902-0466',
    },
  },
  preamble: 'As partes, doravante "Partes", celebram este Contrato Mestre ("Contrato"), que reúne as regras gerais e permanentes da relação entre elas. Os serviços contratados, com seus valores e condições, são definidos em Propostas Comerciais apartadas, na forma da Cláusula Primeira.',
  clauses: [
    {
      num: '1',
      title: 'CLÁUSULA PRIMEIRA – OBJETO E ESTRUTURA CONTRATUAL',
      items: [
        '1.1. O objeto deste Contrato é a prestação, pela CONTRATADA, de serviços de consultoria, parametrização, implantação, integração e gestão de cobranças corporativas, em uma ou mais das seguintes frentes: (i) implantação e gestão de contas digitais e plataformas de cobrança; (ii) régua de cobrança automatizada; e (iii) escolha, implantação e integração de ERP e demais sistemas de gestão.',
        '1.2. Cada serviço é contratado por meio de uma Proposta Comercial ("Proposta"), que define de forma exclusiva e vinculante o escopo, o cronograma, os valores, as franquias, o nível de suporte (SLA) do plano contratado e o prazo mínimo de permanência, quando houver. Este Contrato não fixa essas condições, que constam apenas da Proposta.',
        '1.3. Cada Proposta aceita integra este Contrato, e podem coexistir várias Propostas, cada uma regida por suas condições comerciais. Havendo conflito, a Proposta prevalece sobre escopo, preço, prazo e SLA, e este Contrato prevalece sobre todas as demais matérias. Nenhuma Proposta altera as cláusulas deste Contrato, salvo se indicar expressamente a cláusula derrogada e for assinada pelos representantes legais de ambas as Partes.',
        '1.4. Serviços não previstos em Proposta aceita estão fora do escopo e dependem de orçamento e aprovação prévios da CONTRATANTE.',
        '1.5. Os serviços constituem obrigação de meio. A CONTRATADA empregará diligência e técnica adequadas, mas não garante resultado específico, como percentual de redução de inadimplência, valores recuperados ou prazos de recebimento, os quais dependem de fatores alheios ao seu controle, como a conduta dos clientes finais da CONTRATANTE, sua política de crédito e as Plataformas de Terceiros.',
      ],
    },
    {
      num: '2',
      title: 'CLÁUSULA SEGUNDA – CONTRATAÇÃO E ALTERAÇÃO DE SERVIÇOS',
      items: [
        '2.1. Aceite. A Proposta considera-se aceita mediante (i) assinatura eletrônica ou digital; (ii) aceite em plataforma eletrônica de contratos; ou (iii) confirmação inequívoca, por e-mail ou WhatsApp oficial, do representante legal ou do ponto focal indicado na Proposta.',
        '2.2. Upgrade, serviços adicionais e mudança de plano serão formalizados por nova Proposta, sem necessidade de aditivo a este Contrato. A nova Proposta produz efeitos na data nela indicada e substitui as condições comerciais da anterior relativas ao mesmo serviço, sem novação e sem prejuízo das obrigações já vencidas.',
        '2.3. Redução ou cancelamento de serviço exige aviso prévio escrito de 30 (trinta) dias, observado o prazo mínimo de permanência da Proposta. O valor de implantação já pago não é reembolsável, por remunerar trabalho executado.',
        '2.4. O cancelamento de uma Proposta não afeta as demais. Este Contrato permanece válido, sem ônus, ainda que não haja Proposta ativa.',
      ],
    },
    {
      num: '3',
      title: 'CLÁUSULA TERCEIRA – OBRIGAÇÕES DAS PARTES',
      items: [
        '3.1. A CONTRATADA obriga-se a executar os serviços com diligência, boa técnica e equipe qualificada; adotar boas práticas de segurança no acesso às plataformas, como senhas fortes e autenticação em dois fatores; manter a CONTRATANTE informada sobre o andamento dos serviços; e comunicar incidentes de segurança.',
        '3.2. A CONTRATANTE obriga-se a: (a) fornecer os acessos às plataformas necessários à execução dos serviços; (b) entregar dados e informações corretos e completos, nos prazos combinados; (c) validar textos e regras das réguas de cobrança antes de sua ativação; (d) indicar ponto focal com poder de decisão; (e) abster-se de alterar configurações, integrações ou automações realizadas pela CONTRATADA sem comunicação prévia; e (f) arcar com as taxas e custos das Plataformas de Terceiros, salvo disposição diversa na Proposta.',
        '3.3. As contas mantidas em Plataformas de Terceiros são de titularidade da CONTRATANTE, a quem cabe mantê-las regulares e aceitar diretamente seus termos de uso. Após a validação, a CONTRATANTE é responsável pelo conteúdo das comunicações de cobrança, pela legalidade da cobrança e por suas obrigações fiscais e tributárias.',
        '3.4. Atrasos ou omissões da CONTRATANTE no cumprimento dessas obrigações suspendem os prazos e o SLA da CONTRATADA pelo período correspondente, sem configurar descumprimento.',
      ],
    },
    {
      num: '4',
      title: 'CLÁUSULA QUARTA – PLATAFORMAS DE TERCEIROS',
      items: [
        '4.1. A CONTRATADA é prestadora de serviços e integradora, e utiliza softwares, APIs, gateways de pagamento e infraestruturas de terceiros, como Asaas, N8N, ERPs, WhatsApp/Meta, provedores de SMS, e-mail e nuvem ("Plataformas de Terceiros"). Não é proprietária, desenvolvedora nem garantidora dessas plataformas, ainda que seja parceira oficial de alguma delas.',
        '4.2. A CONTRATADA não responde por fatos originados nas Plataformas de Terceiros ou por decisões de seus operadores, incluindo: (a) indisponibilidade, instabilidade, falhas de API, erros de código (bugs), alterações técnicas ou descontinuidade de funcionalidades; (b) vazamento, perda ou acesso indevido a dados ocorridos na infraestrutura dessas plataformas; (c) alteração de taxas, limites, prazos de liquidação e regras comerciais; (d) recusa de crédito, retenção de valores, bloqueio ou encerramento de contas e intervenção, liquidação ou falência de instituição financeira ou de pagamento; (e) bloqueio ou limitação de números, contas e mensagens por provedores de mensageria; e (f) mudança de licenciamento, preços ou termos de uso.',
        '4.3. Ocorrendo tais eventos, a CONTRATADA prestará assistência razoável, no horário de atendimento, abrindo chamado, acompanhando a solução junto ao terceiro e propondo alternativas técnicas, em obrigação de meio.',
      ],
    },
    {
      num: '5',
      title: 'CLÁUSULA QUINTA – SUPORTE E NÍVEL DE SERVIÇO (SLA)',
      items: [
        '5.1. O suporte é prestado remotamente, em dias úteis, das 09h às 17h, excluídos feriados, pelos canais oficiais indicados na Proposta. Solicitações recebidas fora desse horário consideram-se recebidas no dia útil seguinte.',
        '5.2. Ocorrências críticas, como a paralisação do faturamento por causa atribuível à configuração da CONTRATADA, têm prioridade sobre as demais. Os prazos de resposta e de solução por nível de urgência correspondem ao plano contratado e constam da Proposta.',
        '5.3. Os prazos de solução são estimados e ficam suspensos enquanto a CONTRATADA aguardar informação ou ação da CONTRATANTE ou de terceiro.',
      ],
    },
    {
      num: '6',
      title: 'CLÁUSULA SEXTA – REMUNERAÇÃO E INADIMPLÊNCIA',
      items: [
        '6.1. Os valores de implantação, mensalidades, franquias, excedentes e horas técnicas constam da Proposta. Tributos e custos de Plataformas de Terceiros não estão incluídos, salvo disposição diversa.',
        '6.2. O atraso sujeita a CONTRATANTE a multa de 2% sobre o valor devido, juros de 1% ao mês e correção monetária pelo IPCA. Descontos de pontualidade previstos na Proposta perdem eficácia após o vencimento.',
        '6.3. Os valores recorrentes serão reajustados a cada 12 (doze) meses, pelo IPCA acumulado no período.',
        '6.4. Suspensão por inadimplência. Persistindo atraso superior a 10 (dez) dias corridos, a CONTRATADA poderá suspender imediatamente as automações, réguas, integrações e o suporte, mediante comunicação simultânea por e-mail ou canal oficial.',
      ],
    },
    {
      num: '7',
      title: 'CLÁUSULA SÉTIMA – PROTEÇÃO DE DADOS PESSOAIS (LGPD)',
      items: [
        '7.1. Para os fins da Lei nº 13.709/2018 (LGPD), a CONTRATANTE é controladora dos dados pessoais de seus clientes, devedores e contatos, e a CONTRATADA é operadora, tratando os dados exclusivamente para executar os serviços e conforme instruções lícitas da CONTRATANTE.',
        '7.2. A CONTRATANTE garante que os dados foram coletados de forma lícita e que possui base legal adequada ao tratamento e às ações de cobrança.',
        '7.3. Verificado incidente de segurança que possa acarretar risco ou dano relevante aos titulares, a CONTRATADA comunicará a CONTRATANTE em até 48 (quarenta e oito) horas úteis.',
      ],
    },
    {
      num: '8',
      title: 'CLÁUSULA OITAVA – PROPRIEDADE INTELECTUAL',
      items: [
        '8.1. Pertencem exclusivamente à CONTRATADA as metodologias, fluxos, scripts, workflows e automações, réguas, modelos, dashboards, documentação e know-how, ainda que desenvolvidos sob medida para a CONTRATANTE.',
        '8.2. A CONTRATANTE recebe licença de uso não exclusiva, intransferível e não sublicenciável, restrita à sua operação interna.',
      ],
    },
    {
      num: '9',
      title: 'CLÁUSULA NONA – CONFIDENCIALIDADE E USO DE MARCA',
      items: [
        '9.1. As Partes manterão sigilo mútuo sobre as informações confidenciais a que tiverem acesso durante a vigência e por 5 (cinco) anos após o término.',
        '9.2. A CONTRATANTE autoriza a CONTRATADA a utilizar seu nome empresarial e sua logomarca em cases de sucesso, portfólios e apresentações comerciais.',
      ],
    },
    {
      num: '10',
      title: 'CLÁUSULA DÉCIMA – LIMITAÇÃO DE RESPONSABILIDADE',
      items: [
        '10.1. A responsabilidade total da CONTRATADA perante a CONTRATANTE fica limitada ao valor efetivamente pago nos 12 (doze) meses anteriores ao evento danoso.',
        '10.2. A CONTRATADA não responde por lucros cessantes, perda de receita, de clientes ou de oportunidades, nem pela inadimplência dos clientes finais da CONTRATANTE.',
      ],
    },
    {
      num: '11',
      title: 'CLÁUSULA DÉCIMA PRIMEIRA – VIGÊNCIA E RESCISÃO',
      items: [
        '11.1. Este Contrato vigora por prazo indeterminado, a partir da assinatura.',
        '11.2. Qualquer das Partes pode encerrá-lo sem justificativa, mediante aviso prévio escrito de 30 (trinta) dias, observado o prazo mínimo de permanência da Proposta.',
      ],
    },
    {
      num: '12',
      title: 'CLÁUSULA DÉCIMA SEGUNDA – DISPOSIÇÕES GERAIS E FORO',
      items: [
        '12.1. As Partes reconhecem a validade de assinaturas eletrônicas e digitais, nos termos da MP nº 2.200-2/2001 e da Lei nº 14.063/2020.',
        '12.2. Fica eleito o foro da Comarca de Belo Horizonte/MG, com renúncia a qualquer outro, para dirimir quaisquer controvérsias decorrentes deste Contrato.',
      ],
    },
  ],
};
