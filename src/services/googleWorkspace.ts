/**
 * Service to interact directly with Google Drive and Google Sheets APIs
 * using the client-side Google OAuth access token.
 */

export interface GoogleSyncResult {
  success: boolean;
  driveFolderId?: string;
  driveFolderUrl?: string;
  proposalPdfUrl?: string;
  contractPdfUrl?: string;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

export interface ProposalSheetRecord {
  proposalId: string;
  contractMasterId: string;
  signedAt: string;
  companyName: string;
  tradeName?: string;
  cnpj: string;
  contactName: string;
  contactRole?: string;
  cpf: string;
  email: string;
  phone: string;
  cityState?: string;
  servicesSummary: string;
  reguaPortfolioLabel?: string;
  setupPaymentMode?: string;
  setupCashPrice?: number;
  setupInstallmentTotal?: number;
  setupInstallmentsCount?: number;
  setupInstallmentValue?: number;
  setupConditionSummary?: string;
  setupTotal: number;
  monthlyTotal: number;
  dueDay?: number;
  promptPaymentDiscountPercent?: number;
  monthlyWithPromptDiscount?: number;
  asaasStatus?: string;
  asaasPaymentId?: string;
  verificationHash?: string;
  signerIp?: string;
  proposalDriveUrl?: string;
  contractDriveUrl?: string;
}

export const DEFAULT_FOLDER_NAME = 'Multilagos - Contratos Assinados';
export const DEFAULT_SHEET_TITLE = 'Multilagos - Registro de Contratos e Aceites';

/**
 * Searches for an existing folder or creates one in Google Drive.
 */
export async function getOrCreateDriveFolder(
  accessToken: string,
  folderName = DEFAULT_FOLDER_NAME
): Promise<{ id: string; webViewLink?: string }> {
  const query = encodeURIComponent(`name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!searchRes.ok) {
    const errText = await searchRes.text();
    console.warn('[Google Drive] Erro ao buscar pasta:', errText);
    throw new Error(`Falha ao buscar pasta no Google Drive (${searchRes.status}): ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return {
      id: searchData.files[0].id,
      webViewLink: searchData.files[0].webViewLink || `https://drive.google.com/drive/folders/${searchData.files[0].id}`,
    };
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Pasta automatizada Multilagos para arquivo e guarda de contratos e propostas assinadas.',
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    console.error('[Google Drive] Erro ao criar pasta:', errText);
    throw new Error(`Falha ao criar pasta no Google Drive (${createRes.status}): ${createRes.statusText}`);
  }

  const newFolder = await createRes.json();
  return {
    id: newFolder.id,
    webViewLink: newFolder.webViewLink || `https://drive.google.com/drive/folders/${newFolder.id}`,
  };
}

/**
 * Uploads a PDF Blob to Google Drive inside a specified folder using standard multipart upload.
 */
export async function uploadPdfToDrive(
  accessToken: string,
  pdfBlob: Blob,
  fileName: string,
  folderId?: string
): Promise<{ fileId: string; webViewLink: string; webContentLink?: string }> {
  const cleanName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  const metadata: Record<string, any> = {
    name: cleanName,
    mimeType: 'application/pdf',
    description: 'Documento assinado digitalmente emitido pela plataforma Multilagos.',
  };

  if (folderId) {
    metadata.parents = [folderId];
  }

  const boundary = 'multilagos_multipart_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
  const metadataPart = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const mediaHeader = `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`;
  const closePart = `\r\n--${boundary}--`;

  const pdfArrayBuffer = await pdfBlob.arrayBuffer();

  const metadataBlob = new Blob([metadataPart], { type: 'text/plain; charset=UTF-8' });
  const mediaHeaderBlob = new Blob([mediaHeader], { type: 'text/plain; charset=UTF-8' });
  const pdfDataBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
  const closeBlob = new Blob([closePart], { type: 'text/plain; charset=UTF-8' });

  const multipartBody = new Blob([metadataBlob, mediaHeaderBlob, pdfDataBlob, closeBlob]);

  const uploadRes = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    console.error('[Google Drive Upload] Falha:', errText);
    throw new Error(`Erro ao enviar arquivo '${cleanName}' para o Google Drive (${uploadRes.status}): ${uploadRes.statusText}`);
  }

  const uploaded = await uploadRes.json();
  return {
    fileId: uploaded.id,
    webViewLink: uploaded.webViewLink || `https://drive.google.com/file/d/${uploaded.id}/view`,
    webContentLink: uploaded.webContentLink,
  };
}

/**
 * Searches for an existing spreadsheet or creates a new one with official Multilagos headers.
 */
export async function getOrCreateSpreadsheet(
  accessToken: string,
  title = DEFAULT_SHEET_TITLE,
  parentFolderId?: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // Check Drive for existing spreadsheet
  const query = encodeURIComponent(`name = '${title}' and mimeType = 'application/vnd.google-apps.spreadsheet' and trashed = false`);
  const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink,parents)`;

  const searchRes = await fetch(searchUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (searchRes.ok) {
    const searchData = await searchRes.json();
    if (searchData.files && searchData.files.length > 0) {
      const file = searchData.files[0];
      return {
        spreadsheetId: file.id,
        spreadsheetUrl: file.webViewLink || `https://docs.google.com/spreadsheets/d/${file.id}/edit`,
      };
    }
  }

  // Official columns to record in Google Sheets
  const headerRow = [
    'Carimbo de Data/Hora',
    'Nº Proposta',
    'Nº Contrato Mestre',
    'Razão Social',
    'Nome Fantasia',
    'CNPJ',
    'Representante Legal',
    'Cargo',
    'CPF',
    'E-mail',
    'Telefone / WhatsApp',
    'Cidade / UF',
    'Serviços Contratados',
    'Portfólio Régua WhatsApp',
    'Modalidade Setup',
    'Setup à Vista (R$)',
    'Setup Parcelado Total (R$)',
    'Qtd Parcelas Setup',
    'Valor Parcela Setup (R$)',
    'Valor de Setup Contratado (R$)',
    'Mensalidade Total (R$)',
    'Dia Vencimento',
    '% Desc. até Dia 05',
    'Mensalidade até Dia 05 (R$)',
    'Status Asaas',
    'ID Fatura Asaas',
    'Hash de Assinatura Digital',
    'Endereço IP do Assinante',
    'Link Proposta Assinada (Google Drive)',
    'Link Contrato Mestre (Google Drive)',
  ];

  // Create new spreadsheet via Sheets API v4
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Aceites e Contratos',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
          data: [
            {
              startRow: 0,
              startColumn: 0,
              rowData: [
                {
                  values: headerRow.map((h) => ({
                    userEnteredValue: { stringValue: h },
                    userEnteredFormat: {
                      textFormat: { bold: true },
                    },
                  })),
                },
              ],
            },
          ],
        },
      ],
    }),
  });

  if (!createRes.ok) {
    const err = await createRes.text();
    console.error('[Google Sheets] Erro ao criar planilha:', err);
    throw new Error(`Falha ao criar planilha Google Sheets (${createRes.status}): ${createRes.statusText}`);
  }

  const newSheet = await createRes.json();
  const spreadsheetId = newSheet.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Move or link spreadsheet inside the parent folder if specified
  if (parentFolderId) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${spreadsheetId}?addParents=${parentFolderId}&fields=id,parents`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    } catch (e) {
      console.warn('[Google Drive] Não foi possível vincular planilha à pasta pai:', e);
    }
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}

/**
 * Appends a proposal row to the Google Sheet.
 */
export async function appendProposalRowToSheet(
  accessToken: string,
  spreadsheetId: string,
  data: ProposalSheetRecord
): Promise<boolean> {
  const rowValues = [
    data.signedAt || new Date().toLocaleString('pt-BR'),
    data.proposalId,
    data.contractMasterId,
    data.companyName,
    data.tradeName || '',
    data.cnpj,
    data.contactName,
    data.contactRole || 'Representante Legal',
    data.cpf,
    data.email,
    data.phone,
    data.cityState || '',
    data.servicesSummary,
    data.reguaPortfolioLabel || 'N/A',
    data.setupConditionSummary || (data.setupPaymentMode === 'installments' ? 'Parcelado' : 'À Vista'),
    data.setupCashPrice ?? data.setupTotal,
    data.setupInstallmentTotal ?? data.setupTotal,
    data.setupInstallmentsCount ?? 1,
    data.setupInstallmentValue ?? data.setupTotal,
    data.setupTotal,
    data.monthlyTotal,
    data.dueDay ? `Dia ${String(data.dueDay).padStart(2, '0')}` : 'Dia 10',
    typeof data.promptPaymentDiscountPercent === 'number' ? `${data.promptPaymentDiscountPercent}%` : '5%',
    data.monthlyWithPromptDiscount ?? data.monthlyTotal,
    data.asaasStatus || 'Ativado',
    data.asaasPaymentId || '',
    data.verificationHash || '',
    data.signerIp || '',
    data.proposalDriveUrl || '',
    data.contractDriveUrl || '',
  ];

  // Try appending to the 'Aceites e Contratos' sheet
  const rangeEnc = encodeURIComponent("'Aceites e Contratos'!A1");
  let appendRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeEnc}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  // Fallback to simple A1:append if specific tab name fails
  if (!appendRes.ok) {
    appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [rowValues],
        }),
      }
    );
  }

  if (!appendRes.ok) {
    const err = await appendRes.text();
    console.error('[Google Sheets] Erro ao inserir linha na planilha:', err);
    throw new Error(`Falha ao adicionar dados na planilha Google Sheets (${appendRes.status}): ${appendRes.statusText}`);
  }

  return true;
}

// ============================================================================
// INTEGRAÇÃO 24H VIA GOOGLE APPS SCRIPT / WEBHOOK (SEM EXPIRAÇÃO DE TOKEN)
// ============================================================================

const STORAGE_KEY_WEBHOOK = 'multilagos_google_webhook_url';

export function getGoogleWebhookUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_WEBHOOK);
    if (saved && saved.trim()) return saved.trim();
  } catch {}
  const env = (import.meta as any).env || {};
  if (env.VITE_GOOGLE_WEBHOOK_URL && String(env.VITE_GOOGLE_WEBHOOK_URL).trim()) {
    return String(env.VITE_GOOGLE_WEBHOOK_URL).trim();
  }
  return '';
}

export function saveGoogleWebhookUrl(url: string): void {
  try {
    const clean = url.trim();
    if (clean) {
      localStorage.setItem(STORAGE_KEY_WEBHOOK, clean);
    } else {
      localStorage.removeItem(STORAGE_KEY_WEBHOOK);
    }
  } catch {}
}

function blobToBase64Pure(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = String(reader.result || '');
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function testGoogleWebhook(webhookUrl: string): Promise<GoogleSyncResult> {
  const res = await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action: 'ping',
      folderName: DEFAULT_FOLDER_NAME,
      sheetTitle: DEFAULT_SHEET_TITLE,
    }),
  });

  if (!res.ok) {
    throw new Error(`Resposta HTTP ${res.status} ao testar Webhook.`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'O script retornou falha.');
  }

  return {
    success: true,
    driveFolderId: json.folderId,
    driveFolderUrl: json.folderUrl,
    spreadsheetId: json.spreadsheetId,
    spreadsheetUrl: json.spreadsheetUrl,
  };
}

export async function sendContractViaGoogleWebhook(
  webhookUrl: string,
  record: ProposalSheetRecord,
  proposalPdfBlob?: Blob,
  contractPdfBlob?: Blob,
  proposalFilename?: string,
  contractFilename?: string
): Promise<GoogleSyncResult> {
  const propBase64 = proposalPdfBlob ? await blobToBase64Pure(proposalPdfBlob) : undefined;
  const contractBase64 = contractPdfBlob ? await blobToBase64Pure(contractPdfBlob) : undefined;

  const payload = {
    action: 'save_contract',
    folderName: DEFAULT_FOLDER_NAME,
    sheetTitle: DEFAULT_SHEET_TITLE,
    record,
    proposalPdfBase64: propBase64,
    proposalFilename: proposalFilename ? (proposalFilename.endsWith('.pdf') ? proposalFilename : `${proposalFilename}.pdf`) : `Proposta_${record.proposalId}.pdf`,
    contractPdfBase64: contractBase64,
    contractFilename: contractFilename ? (contractFilename.endsWith('.pdf') ? contractFilename : `${contractFilename}.pdf`) : `Contrato_${record.contractMasterId}.pdf`,
  };

  const res = await fetch(webhookUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Erro HTTP ${res.status} ao enviar para o Webhook Google.`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Falha ao salvar via Google Apps Script.');
  }

  return {
    success: true,
    driveFolderId: json.folderId,
    driveFolderUrl: json.folderUrl,
    proposalPdfUrl: json.proposalPdfUrl,
    contractPdfUrl: json.contractPdfUrl,
    spreadsheetId: json.spreadsheetId,
    spreadsheetUrl: json.spreadsheetUrl,
  };
}

export const GOOGLE_APPS_SCRIPT_CODE = `// =========================================================================
// MULTILAGOS - INTEGRAÇÃO AUTOMÁTICA 24H GOOGLE DRIVE & GOOGLE SHEETS
// Cole este código em https://script.google.com -> Implantar -> App da Web
// Executar como: "Eu" | Quem pode acessar: "Qualquer pessoa"
// =========================================================================

function getOrCreateFolder_(folderName) {
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function getOrCreateSheet_(sheetTitle, folder) {
  var files = DriveApp.getFilesByName(sheetTitle);
  while (files.hasNext()) {
    var f = files.next();
    if (!f.isTrashed() && f.getMimeType() === MimeType.GOOGLE_SHEETS) {
      return SpreadsheetApp.openById(f.getId());
    }
  }
  var ss = SpreadsheetApp.create(sheetTitle);
  var sheet = ss.getActiveSheet();
  sheet.setName('Aceites e Contratos');
  var headers = [
    'Data/Hora Assinatura', 'Nº Proposta', 'Nº Contrato Mestre', 'Razão Social',
    'Nome Fantasia', 'CNPJ', 'Representante Legal', 'Cargo', 'CPF', 'E-mail',
    'Telefone / WhatsApp', 'Cidade/UF', 'Serviços Contratados', 'Portfólio Régua WhatsApp',
    'Modalidade Setup', 'Setup à Vista (R$)', 'Setup Parcelado Total (R$)',
    'Qtd Parcelas Setup', 'Valor Parcela Setup (R$)', 'Setup Contratado (R$)',
    'Mensalidade Total (R$)', 'Dia Vencimento', '% Desc. até Dia 05', 'Mensalidade até Dia 05 (R$)',
    'Status Asaas', 'ID Cobrança Asaas',
    'Hash Assinatura Digital', 'IP Verificado', 'Link PDF Proposta (Drive)', 'Link PDF Contrato (Drive)'
  ];
  sheet.appendRow(headers);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#111F24').setFontColor('#FFFFFF');
  try {
    var ssFile = DriveApp.getFileById(ss.getId());
    folder.addFile(ssFile);
  } catch (err) {}
  return ss;
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var folderName = data.folderName || 'Multilagos - Contratos Assinados';
    var sheetTitle = data.sheetTitle || 'Multilagos - Registro de Contratos e Aceites';

    var folder = getOrCreateFolder_(folderName);
    var ss = getOrCreateSheet_(sheetTitle, folder);

    if (data.action === 'ping') {
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        folderId: folder.getId(),
        folderUrl: folder.getUrl(),
        spreadsheetId: ss.getId(),
        spreadsheetUrl: ss.getUrl()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var proposalPdfUrl = '';
    var contractPdfUrl = '';

    if (data.proposalPdfBase64) {
      var propBlob = Utilities.newBlob(Utilities.base64Decode(data.proposalPdfBase64), 'application/pdf', data.proposalFilename || 'Proposta.pdf');
      var propFile = folder.createFile(propBlob);
      proposalPdfUrl = propFile.getUrl();
    }

    if (data.contractPdfBase64) {
      var contBlob = Utilities.newBlob(Utilities.base64Decode(data.contractPdfBase64), 'application/pdf', data.contractFilename || 'Contrato.pdf');
      var contFile = folder.createFile(contBlob);
      contractPdfUrl = contFile.getUrl();
    }

    var r = data.record || {};
    var sheet = ss.getSheetByName('Aceites e Contratos') || ss.getSheets()[0];
    sheet.appendRow([
      r.signedAt || new Date().toLocaleString('pt-BR'),
      r.proposalId || '',
      r.contractMasterId || '',
      r.companyName || '',
      r.tradeName || '',
      r.cnpj || '',
      r.contactName || '',
      r.contactRole || 'Representante Legal',
      r.cpf || '',
      r.email || '',
      r.phone || '',
      r.cityState || '',
      r.servicesSummary || '',
      r.reguaPortfolioLabel || 'N/A',
      r.setupConditionSummary || (r.setupPaymentMode === 'installments' ? 'Parcelado' : 'À Vista'),
      r.setupCashPrice !== undefined ? r.setupCashPrice : (r.setupTotal || 0),
      r.setupInstallmentTotal !== undefined ? r.setupInstallmentTotal : (r.setupTotal || 0),
      r.setupInstallmentsCount || 1,
      r.setupInstallmentValue !== undefined ? r.setupInstallmentValue : (r.setupTotal || 0),
      r.setupTotal || 0,
      r.monthlyTotal || 0,
      r.dueDay ? ('Dia ' + r.dueDay) : 'Dia 10',
      r.promptPaymentDiscountPercent !== undefined ? (r.promptPaymentDiscountPercent + '%') : '5%',
      r.monthlyWithPromptDiscount !== undefined ? r.monthlyWithPromptDiscount : (r.monthlyTotal || 0),
      r.asaasStatus || 'Ativado',
      r.asaasPaymentId || '',
      r.verificationHash || '',
      r.signerIp || '',
      proposalPdfUrl || r.proposalDriveUrl || '',
      contractPdfUrl || r.contractDriveUrl || ''
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      folderId: folder.getId(),
      folderUrl: folder.getUrl(),
      proposalPdfUrl: proposalPdfUrl,
      contractPdfUrl: contractPdfUrl,
      spreadsheetId: ss.getId(),
      spreadsheetUrl: ss.getUrl()
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`;

