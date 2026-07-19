import { MarkdownParser } from '../services/MarkdownParser';
import { PdfPage } from '../models/PdfPage';
import { SVG_IMAGE_ICON, SVG_SCISSOR_ICON } from '../utils/iconStrings';

export interface ParsedFigure {
  pageNum: number;
  coords: { y1: number; x1: number; y2: number; x2: number; } | null;
  description: string;
}

export class CompileExamUseCase {
  constructor(private parser: MarkdownParser) {}

  execute(
    rawMarkdown: string,
    solveLines: number = 6,
    figureImages: Record<string, string> = {},
    pageImages: PdfPage[] = []
  ): string {
    if (!rawMarkdown) return '';

    // 1. Compile Markdown using the parser engine
    let parsedHtml = this.parser.parse(rawMarkdown);

    // 2. Format custom figures text blocks
    parsedHtml = parsedHtml.replace(
      /<blockquote>\s*<p>\s*<strong>\[FIGURE REFERENCE\]<\/strong>:([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
      (_, content) => {
        return `<div class="figure-note-container">
          ${SVG_IMAGE_ICON}
          <strong>Figure Reference</strong>: ${content}
        </div>`;
      }
    );

    // 3. Inject solve spaces (both default and custom sizes)
    const defaultLinesHtml = this.generateLines(solveLines);
    parsedHtml = parsedHtml
      .replaceAll("<p>[SOLVE_SPACE_HERE]</p>", defaultLinesHtml)
      .replaceAll("[SOLVE_SPACE_HERE]", defaultLinesHtml);

    parsedHtml = parsedHtml.replace(
      /(?:<p>)?\[SOLVE_SPACE:(\d+)\](?:<\/p>)?/g,
      (_, count) => this.generateLines(parseInt(count, 10))
    );

    // 4. Replace [FIGURE:...] markers with images
    parsedHtml = parsedHtml.replace(
      /(?:<p>)?\[FIGURE:[^\]]+\](?:<\/p>)?/g,
      (fullMatch) => {
        const markerText = fullMatch.replace(/<\/?p>/g, '');
        const parsed = this.parseFigureMarker(markerText);
        if (!parsed) return fullMatch;

        const figureKey = `fig-${parsed.pageNum}-${parsed.description.slice(0, 20).replace(/\s/g, '_')}`;

        const imageSrc = figureImages[figureKey];
        const pageImage = pageImages.find(p => p.pageNum === parsed.pageNum);
        const displaySrc = imageSrc || pageImage?.base64 || '';

        if (!displaySrc) {
          return `<div class="figure-embed figure-missing"><p class="figure-caption">⚠️ Figure from page ${parsed.pageNum}: ${parsed.description}</p></div>`;
        }

        return `<div class="figure-embed" data-figure-key="${figureKey}" data-page="${parsed.pageNum}">
          <img src="${displaySrc}" alt="${parsed.description}" class="figure-image" />
          <div class="figure-actions no-print">
            <button class="crop-btn" data-figure-key="${figureKey}" data-page="${parsed.pageNum}" title="Crop this figure">
              ${SVG_SCISSOR_ICON}
              Crop
            </button>
          </div>
        </div>`;
      }
    );

    // 5. Use DOMParser to format question classes
    if (typeof window !== 'undefined' && window.DOMParser) {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(parsedHtml, 'text/html');
      const body = doc.body;

      const paragraphs = body.querySelectorAll('p');
      paragraphs.forEach(p => {
        const firstChild = p.firstElementChild;
        if (firstChild && firstChild.tagName === 'STRONG') {
          const text = firstChild.textContent?.trim() || '';
          if (/^(Question|Q|Prob|Problem)\s*\d+/i.test(text)) {
            p.classList.add('question-paragraph');
          }
        }
      });

      return body.innerHTML;
    }

    return parsedHtml;
  }

  private parseFigureMarker(markerText: string): ParsedFigure | null {
    const match = markerText.match(
      /\[FIGURE:(\d+):(\d+),(\d+),(\d+),(\d+):([^\]]+)\]/i
    );
    if (!match) {
      const simpleMatch = markerText.match(/\[FIGURE:(\d+):([^\]]+)\]/i);
      if (simpleMatch) {
        return {
          pageNum: parseInt(simpleMatch[1], 10),
          coords: null,
          description: simpleMatch[2].trim(),
        };
      }
      return null;
    }
    return {
      pageNum: parseInt(match[1], 10),
      coords: {
        y1: parseInt(match[2], 10),
        x1: parseInt(match[3], 10),
        y2: parseInt(match[4], 10),
        x2: parseInt(match[5], 10),
      },
      description: match[6].trim(),
    };
  }

  private generateLines(numberOfLines: number): string {
    let linesHtml = "<div class='solve-space-container'>";
    for (let i = 0; i < numberOfLines; i++) {
      linesHtml += "<div class='writing-line'></div>";
    }
    linesHtml += "</div>";
    return linesHtml;
  }
}
