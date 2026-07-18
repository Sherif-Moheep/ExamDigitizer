import { PdfService } from '../../domain/services/PdfService';
import { PdfPage, FigureCoords } from '../../domain/models/PdfPage';
import * as pdfjsLib from 'pdfjs-dist';
// @ts-ignore - Vite asset URL import query
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export class PdfServiceImpl implements PdfService {
  async renderPdfPages(pdfBase64: string): Promise<PdfPage[]> {
    const binaryString = atob(pdfBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
    const pages: PdfPage[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const scale = 2.0; // 2x for crisp images
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get 2D canvas context');
      }

      await page.render({ canvasContext: ctx, viewport } as any).promise;

      pages.push({
        pageNum: i,
        base64: canvas.toDataURL('image/png'),
        width: viewport.width,
        height: viewport.height,
      });
    }

    return pages;
  }

  async cropFigureFromPage(
    pageBase64: string,
    _pageWidth: number,
    _pageHeight: number,
    coords: FigureCoords
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const sx = (coords.x1 / 1000) * img.width;
        const sy = (coords.y1 / 1000) * img.height;
        const sw = ((coords.x2 - coords.x1) / 1000) * img.width;
        const sh = ((coords.y2 - coords.y1) / 1000) * img.height;

        const padX = img.width * 0.02;
        const padY = img.height * 0.02;
        const cropX = Math.max(0, sx - padX);
        const cropY = Math.max(0, sy - padY);
        const cropW = Math.min(img.width - cropX, sw + 2 * padX);
        const cropH = Math.min(img.height - cropY, sh + 2 * padY);

        const canvas = document.createElement('canvas');
        canvas.width = cropW;
        canvas.height = cropH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get 2D context for cropped canvas'));
          return;
        }

        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = (err) => reject(err);
      img.src = pageBase64;
    });
  }
}
