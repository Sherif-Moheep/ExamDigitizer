import { GeminiService } from '../services/GeminiService';

export class DigitizeExamUseCase {
  constructor(private geminiService: GeminiService) {}

  async execute(
      pdfBase64: string,
      apiKey: string,
      model: string,
      signal?: AbortSignal
  ): Promise<string> {
    const rawResult = await this.geminiService.digitize(pdfBase64, apiKey, model, signal);
    return this.stripMarkdownFences(rawResult);
  }

  private stripMarkdownFences(text: string): string {
    if (!text) return '';
    let cleaned = text.trim();
    // Strip starting \`\`\`markdown or \`\`\`
    cleaned = cleaned.replace(/^```markdown\s*/i, '');
    cleaned = cleaned.replace(/^```\s*/, '');
    // Strip ending \`\`\`
    cleaned = cleaned.replace(/\s*```$/, '');
    return cleaned.trim();
  }
}
