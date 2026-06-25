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

    // 4. Use DOMParser to structure metadata and format question classes
    if (typeof window !== 'undefined' && window.DOMParser) {
      const domParser = new DOMParser();
      const doc = domParser.parseFromString(parsedHtml, 'text/html');
      const body = doc.body;

      // Parse metadata paragraphs
      const allParagraphs = Array.from(body.querySelectorAll('p'));
      const metadata: Record<string, string> = {};
      const metadataParagraphs: HTMLParagraphElement[] = [];

      allParagraphs.forEach(p => {
        const text = p.innerHTML.trim();
        const match = text.match(/^(?:<strong>)?(Course|Program|Lecturer|Professor|Instructor|Date|Duration|Time|Marks|Semester|Department|Dept|Year|Student Name|Student ID|Class|Faculty|Examiner|Academic Year|Subject|Time Allowed)(?:<\/strong>)?:\s*(.*)$/i);
        if (match) {
          const key = match[1].trim();
          const val = match[2].trim();
          metadata[key] = val;
          metadataParagraphs.push(p as HTMLParagraphElement);
        }
      });

      if (Object.keys(metadata).length > 0) {
        // Remove original plain text paragraphs
        metadataParagraphs.forEach(p => p.remove());

        // Create structured grid
        const metaGrid = doc.createElement('div');
        metaGrid.className = 'exam-metadata-grid';

        let gridHtml = '';
        for (const [key, val] of Object.entries(metadata)) {
          let displayVal = val;
          if ((key.toLowerCase().includes('student') || key.toLowerCase().includes('name')) && (!val || val.trim() === '')) {
            displayVal = '_______________________________';
          }
          gridHtml += `
            <div class="metadata-item">
              <span class="metadata-label">${key}</span>
              <span class="metadata-value">${displayVal}</span>
            </div>
          `;
        }
        metaGrid.innerHTML = gridHtml;

        // Insert after exam title (h1) or at the top
        const h1 = body.querySelector('h1');
        if (h1) {
          h1.after(metaGrid);
        } else {
          body.prepend(metaGrid);
        }
      }

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
