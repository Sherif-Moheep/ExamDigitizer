import { MarkdownParser } from '../services/MarkdownParser';

export class CompileExamUseCase {
  constructor(private parser: MarkdownParser) {}

  execute(rawMarkdown: string): string {
    if (!rawMarkdown) return '';

    // 1. Compile Markdown using the parser engine
    let parsedHtml = this.parser.parse(rawMarkdown);

    // 2. Format custom figures text blocks
    parsedHtml = parsedHtml.replace(
      /<blockquote>\s*<p>\s*<strong>\[FIGURE REFERENCE\]<\/strong>:([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
      (_, content) => {
        return `<div class="figure-note-container">
          <strong>🖼️ Figure Reference</strong>: ${content}
        </div>`;
      }
    );

    // 3. Inject solve spaces
    const linesHtml = this.generateLines(6);
    parsedHtml = parsedHtml
      .replaceAll("<p>[SOLVE_SPACE_HERE]</p>", linesHtml)
      .replaceAll("[SOLVE_SPACE_HERE]", linesHtml);

    // 4. Use DOMParser to format question classes
    if (typeof window !== 'undefined' && window.DOMParser) {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(parsedHtml, 'text/html');
      const body = doc.body;

      // Highlight questions
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

  private generateLines(numberOfLines: number): string {
    let linesHtml = "<div class='solve-space-container'>";
    for (let i = 0; i < numberOfLines; i++) {
      linesHtml += "<div class='writing-line'></div>";
    }
    linesHtml += "</div>";
    return linesHtml;
  }
}
