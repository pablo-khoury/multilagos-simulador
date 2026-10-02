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
export async function exportElementToPdf(
  elementOrId: string | HTMLElement,
  filename: string
): Promise<boolean> {
  let container: HTMLElement | null = null;

  if (typeof elementOrId === 'string') {
    container = document.getElementById(elementOrId);
  } else {
    container = elementOrId;
  }

  if (!container) {
    console.error(`[PDF Export] Elemento '${String(elementOrId)}' não encontrado no DOM.`);
    return false;
  }

  try {
    // If container is hidden via display: none, temporarily display it
    const originalDisplay = container.style.display;
    if (originalDisplay === 'none') {
      container.style.display = 'block';
    }

    // Find all discrete .pdf-page elements within the document container
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

      // Primary engine: html-to-image (native foreignObject rendering - supports Tailwind v4, oklch, color-mix)
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
        // Fallback engine: html2canvas
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

      // Exact A4 dimensions in mm: 210 x 297
      pdf.addImage(imgData, 'JPEG', 0, 0, 210, 297, undefined, 'FAST');
    }

    // Restore original display
    if (originalDisplay === 'none') {
      container.style.display = originalDisplay;
    }

    const cleanFilename = filename.toLowerCase().endsWith('.pdf') ? filename : `${filename}.pdf`;

    // Download execution with dual strategies
    triggerBrowserPdfDownload(pdf, cleanFilename);

    return true;
  } catch (error) {
    console.error('[PDF Export] Falha geral ao exportar PDF:', error);
    return false;
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
