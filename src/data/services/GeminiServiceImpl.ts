import { GeminiService } from '../../domain/services/GeminiService';
import { GoogleGenerativeAI } from '@google/generative-ai';

const EXAM_PROMPT = `Role: You are an expert document parser and formatting assistant.
Task: Convert the attached exam/text into clean, well-structured Markdown format. If the text contains raw OCR transcription errors or broken mathematical symbols from the PDF parsing, use your domain knowledge of math, physics, or business to correct them into the proper academic notation.

Formatting Rules:
1. Headers & Metadata: Extract and preserve ALL exam header details at the absolute top of the exam exactly as written. Include every detail found (e.g., university/institution name, department/faculty name, course name, course code, program, lecturer/examiner, academic year, semester, date, duration/time allowed, total marks, or room).
   - Use '#' for the main institution name (e.g., # Suez Canal University).
   - Use '##' for secondary details (e.g., ## Faculty of Computers and Informatics, ## Department of Basic Science).
   - Format all metadata details (Course, Code, Lecturer, Date, Marks, Time, etc.) as standard Markdown bullet list items: * **Key:** Value (e.g., * **Course:** Differential Equations).
   - Place a horizontal divider line ('---') on a new line immediately below the metadata list.
   - Do NOT omit, modify, or summarize any of this information. Place this metadata section at the absolute beginning of the file, before any other content.
2. Question Formatting: Format all major questions as standard numbered paragraphs (e.g., 1. The relation y(x)... is a solution of...). Do NOT format questions as headings.
   - Format multiple-choice options as standard Markdown bullet lists (e.g., * (a) Option A).
   - Use '##' or '###' for major exam sections or parts (e.g., ## Part I: Choose the Correct Answer (36 Marks)).
3. Math Formatting: Convert all mathematical expressions, variables, equations, and formulas into LaTeX format using single dollar signs ($...$) for inline math and double dollar signs ($$...$$) for block equations.
4. Clean Up Noise: Strip out any layout artifacts, system text, page dividers, watermarks, stamps, or scanner transcription markers. Do NOT include page numbers or footer messages unless they are part of a question.
   - Ignore and omit all handwritten markings, scribbles, student answers/notes written on the paper, grader checkmarks, corrections, score indicators, or teacher comments.
   - Ignore and strip out any hand-drawn sketches, graphs, coordinate axes, plots, diagrams, or drawings made by a student (often written in pen or pencil inside solve spaces or margins). Focus ONLY on transcribing official printed/typeset exam content and diagrams.
5. Lists: Format multiple-choice options as standard Markdown bullet lists (e.g., * (a) Option A).
   - Convert any True or False style questions to have two separate bulleted choices: * (a) True and * (b) False, rather than writing the words 'True' and 'False' or '(True/False)' in the question description line.
6. Placeholders: Insert the exact text [SOLVE_SPACE_HERE] on a new line immediately following the end of every question and sub-question (both multiple-choice and long-answer).
7. Figures & Diagrams: For any figure, diagram, graph, image, circuit, drawing, UML diagram, tree, flowchart, or visual element:
   - You MUST ALWAYS provide a prominent figure reference note blockquote at its position:
     > **[FIGURE REFERENCE]**: A relevant diagram (description: [insert short description of the figure]) is located on PDF Page P. Please refer to page P of the original PDF to view it.
   - Additionally, you MUST make your best effort to construct a clear ASCII text diagram of the figure (enclosed in standard Markdown code blocks) directly next to/below the reference note. Attempt this for all structural graphics, including UMLs, trees, block diagrams, flowcharts, circuits, and geometric shapes. Only omit the ASCII art if the graphic is a photographic image or high-detail plot.
8. Preserve Structure: Keep the original question numbering, sub-questions, instructions, and sections. Use --- (horizontal rules) between major exam sections.
9. Output Constraints: Do NOT add answers or solutions. Do NOT skip any exam content. Output ONLY the markdown text — no explanations, no preamble, and no HTML markdown code fences.`;

export class GeminiServiceImpl implements GeminiService {
  async digitize(
      pdfBase64: string,
      apiKey: string,
      model: string,
      signal?: AbortSignal
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({ model: model });

    const maxRetries = 5;
    let delay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const contents = [
          EXAM_PROMPT,
          {
            inlineData: {
              data: pdfBase64,
              mimeType: 'application/pdf'
            }
          }
        ];

        const response = await modelInstance.generateContent(
          contents,
          signal ? { signal } : undefined
        );

        const text = response.response.text();
        if (text) {
          return text;
        }

        throw new Error('Empty response received from Gemini model.');
      } catch (error: any) {
        if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
          throw error;
        }

        const errorMsg = error.message || String(error);
        const isRateLimit = errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('exhausted');
        const isOverloaded = errorMsg.includes('503') || errorMsg.toLowerCase().includes('overloaded') || errorMsg.toLowerCase().includes('unavailable');
        const isRetryable = isRateLimit || isOverloaded || errorMsg.toLowerCase().includes('fetch') || errorMsg.toLowerCase().includes('network');

        if (isRetryable && attempt < maxRetries) {
          console.warn(`Gemini SDK request failed (attempt ${attempt}/${maxRetries}): ${errorMsg}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        if (errorMsg.includes('API_KEY_INVALID') || errorMsg.toLowerCase().includes('key not valid') || errorMsg.includes('400')) {
          throw new Error('Invalid API Key. Please verify your key in Settings.');
        }

        if (isOverloaded) {
          throw new Error('The Gemini model is currently overloaded. Please try again in a few seconds, or switch to a stable model (like Gemini 1.5 Flash) in Settings.');
        }
        if (isRateLimit) {
          throw new Error('Gemini API rate limit exceeded. Please wait a moment before trying again, or switch to a stable model in Settings.');
        }

        throw new Error(errorMsg);
      }
    }

    throw new Error('Failed to get response from Gemini after maximum retries.');
  }
}
