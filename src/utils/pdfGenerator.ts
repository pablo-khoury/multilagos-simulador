import jsPDF from 'jspdf';
import { toJpeg } from 'html-to-image';
import html2canvas from 'html2canvas';

/**
 * High-fidelity PDF exporter matching official Multilagos templates.
 * Captures discrete A4 pages (794px x 1123px) individually to ensure:
 * - Zero page bleeding and zero overlap
 * - Crisp high-DPI typography (2.0x canvas scale)
 * - Headers and footers on every single page
 * - 100% reliable download via standard Blob & jsPDF save
 */
/**
 * Generates the jsPDF instance and raw Blob for a given HTML element.
 */
export async function generateElementPdfBlob(
  elementOrId: string | HTMLElement
): Promise<{ pdf: jsPDF; blob: Blob } | null> {
  let container: HTMLElement | null = null;

  if (typeof elementOrId === 'string') {
    container = document.getElementById(elementOrId);
  } else {
    container = elementOrId;
  }

  if (!container) {
    console.error(`[PDF Export] Elemento '${String(elementOrId)}' não encontrado no DOM.`);
    return null;
  }

  try {
    const originalDisplay = container.style.display;
    if (originalDisplay === 'none') {
      container.style.display = 'block';
    }

    let pageElements = Array.from(container.querySelectorAll<HTMLElement>('.pdf-page'));

    if (pageElements.length === 0 && container.classList.contains('pdf-page')) {
      pageElements = [container];
    }

    if (pageElements.length === 0) {
      console.warn(`[PDF Export] Nenhuma .pdf-page encontrada em '${String(elementOrId)}'. Capturando container completo.`);
      pageElements = [container];
    }

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      let imgData = '';

      try {
        imgData = await toJpeg(pageEl, {
          quality: 0.98,
          pixelRatio: 2.0,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          cacheBust: true,
        });
      } catch (err) {
        console.warn(`[PDF Export] toJpeg falhou na página ${i + 1}, tentando html2canvas fallback:`, err);
        const canvas = await html2canvas(pageEl, {
          scale: 2.0,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          windowWidth: 1200,
        });
        imgData = canvas.toDataURL('image/jpeg', 0.98);
      }

      if (i > 0) {
        pdf.addPage('a4', 'portrait');
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    if (originalDisplay === 'none') {
      container.style.display = originalDisplay;
    }

    const blob = pdf.output('blob');
    return { pdf, blob };
  } catch (err) {
    console.error('[PDF Export] Erro ao gerar Blob do PDF:', err);
    return null;
  }
}

export async function exportElementToPdf(
  elementOrId: string | HTMLElement,
  filename: string
): Promise<{ success: boolean; blob?: Blob }> {
  try {
    const generated = await generateElementPdfBlob(elementOrId);
    if (!generated) {
      return { success: false };
    }

    const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;
    triggerBrowserPdfDownload(generated.pdf, cleanFilename);

    return { success: true, blob: generated.blob };
  } catch (error) {
    console.error('[PDF Export] Falha geral ao exportar PDF:', error);
    return { success: false };
  }
}

/**
 * Cross-browser, iframe-compatible download trigger.
 * Executes exactly ONE clean download per call.
 */
function triggerBrowserPdfDownload(pdf: jsPDF, filename: string): void {
  try {
    // Primary: Standard Blob Object URL download
    const blob = pdf.output('blob');
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.setAttribute('download', filename);
    link.rel = 'noopener';
    link.style.position = 'fixed';
    link.style.top = '-9999px';
    link.style.left = '-9999px';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 20000);
  } catch (blobErr) {
    console.warn('[PDF Export] Download via Blob falhou, acionando fallback nativo pdf.save:', blobErr);
    // Fallback: Native jsPDF file save only if Blob failed
    try {
      pdf.save(filename);
    } catch (saveErr) {
      console.error('[PDF Export] Falha no fallback pdf.save:', saveErr);
    }
  }
}
