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
  setupTotal: number;
  monthlyTotal: number;
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
    'Valor de Setup (R$)',
    'Mensalidade Total (R$)',
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
    data.setupTotal,
    data.monthlyTotal,
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
