import { AsaasConfig, AsaasBillingResult, ClientInfo } from '../types';

export function createAsaasCustomerPayload(client: ClientInfo) {
  return {
    name: client.contactName,
    company: client.companyName,
    cpfCnpj: client.cnpj.replace(/\D/g, '') || client.cpf.replace(/\D/g, ''),
    email: client.email,
    phone: client.phone.replace(/\D/g, ''),
    mobilePhone: client.phone.replace(/\D/g, ''),
    address: client.address || 'Av. Comercial',
    addressNumber: '100',
    province: client.cityState.split('-')[0]?.trim() || 'Centro',
    postalCode: '28900000',
    notificationDisabled: false,
  };
}

export function generateAsaasPixCopiaECola(paymentId: string, amount: number): string {
  // Realistic standard EMV BR Code format for Asaas Pix
  const formattedAmount = amount.toFixed(2);
  return `00020126580014br.gov.bcb.pix0136asaas-${paymentId.toLowerCase()}-multilagos5204000053039865405${formattedAmount}5802BR5925MULTILAGOS TECNOLOGIA6009CABO FRIO62070503***6304`;
}

export function generateAsaasQrCodeSvg(pixKey: string): string {
  // Clean QR-like visual SVG matrix representation
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="%230f172a"><rect width="100" height="100" fill="white"/><rect x="10" y="10" width="25" height="25" fill="%230066FF"/><rect x="15" y="15" width="15" height="15" fill="white"/><rect x="18" y="18" width="9" height="9" fill="%230066FF"/><rect x="65" y="10" width="25" height="25" fill="%230066FF"/><rect x="70" y="15" width="15" height="15" fill="white"/><rect x="73" y="18" width="9" height="9" fill="%230066FF"/><rect x="10" y="65" width="25" height="25" fill="%230066FF"/><rect x="15" y="70" width="15" height="15" fill="white"/><rect x="18" y="73" width="9" height="9" fill="%230066FF"/><rect x="42" y="15" width="8" height="8" fill="%230f172a"/><rect x="42" y="30" width="12" height="6" fill="%230f172a"/><rect x="15" y="42" width="10" height="8" fill="%230f172a"/><rect x="35" y="42" width="15" height="15" fill="%230066FF"/><rect x="58" y="42" width="12" height="10" fill="%230f172a"/><rect x="75" y="42" width="10" height="10" fill="%230f172a"/><rect x="42" y="65" width="10" height="15" fill="%230f172a"/><rect x="60" y="65" width="15" height="8" fill="%230f172a"/><rect x="78" y="78" width="12" height="12" fill="%230066FF"/></svg>`;
}

export async function processAsaasContractBilling(
  client: ClientInfo,
  amount: number,
  proposalId: string,
  config: AsaasConfig
): Promise<AsaasBillingResult> {
  // Simulate network latency for API communication
  await new Promise((resolve) => setTimeout(resolve, 800));

  const customerId = `cus_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const paymentId = `pay_${Math.random().toString(36).substring(2, 12).toUpperCase()}`;
  const invoiceNumber = `NF-${Math.floor(100000 + Math.random() * 900000)}`;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 5);
  const formattedDueDate = dueDate.toLocaleDateString('pt-BR');

  const pixString = generateAsaasPixCopiaECola(paymentId, amount);
  const qrSvg = generateAsaasQrCodeSvg(pixString);

  return {
    customerId,
    paymentId,
    invoiceNumber,
    pixQrCodeBase64: qrSvg,
    pixCopiaECola: pixString,
    bankSlipUrl: `https://${config.environment === 'sandbox' ? 'sandbox.' : ''}asaas.com/b/pdf/${paymentId}`,
    status: 'PENDING',
    netValue: amount - config.approvedRatePerLiquidation,
    feeApplied: config.approvedRatePerLiquidation, // R$ 0,99
    dueDate: formattedDueDate,
  };
}
