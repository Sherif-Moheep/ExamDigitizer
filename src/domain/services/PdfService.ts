import { PdfPage, FigureCoords } from '../models/PdfPage';

export interface PdfService {
  renderPdfPages(pdfBase64: string): Promise<PdfPage[]>;
  cropFigureFromPage(
    pageBase64: string,
    pageWidth: number,
    pageHeight: number,
    coords: FigureCoords
  ): Promise<string>;
}
