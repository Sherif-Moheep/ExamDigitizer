export interface PdfPage {
  pageNum: number;
  base64: string;
  width: number;
  height: number;
}

export interface FigureCoords {
  y1: number;
  x1: number;
  y2: number;
  x2: number;
}
