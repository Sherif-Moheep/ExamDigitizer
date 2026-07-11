import markdownIt from 'markdown-it';
// @ts-ignore - markdown-it-texmath doesn't have official TS definitions
import texmath from 'markdown-it-texmath';
import katex from 'katex';
import { MarkdownParser } from '../../domain/services/MarkdownParser';

export class MarkdownParserImpl implements MarkdownParser {
  private md: markdownIt;

  constructor() {
    this.md = markdownIt({ html: true, breaks: true })
      .use(texmath, { engine: katex, delimiters: 'dollars' });

    const defaultFence = this.md.renderer.rules.fence;
    this.md.renderer.rules.fence = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (token.info.trim() === 'mermaid') {
        return `<pre class="mermaid">${token.content}</pre>\n`;
      }
      return defaultFence ? defaultFence(tokens, idx, options, env, self) : '';
    };
  }

  parse(input: string): string {
    return this.md.render(input);
  }
}
