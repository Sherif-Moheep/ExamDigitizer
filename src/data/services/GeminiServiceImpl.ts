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
2. Question Formatting: Format all major questions as standard numbered paragraphs. Wrap the question number/label prefix in bold formatting exactly as it appears on the exam (e.g., **1.** The relation..., **Question 1:** The relation..., **Problem (1)** The relation..., **I.** The relation...). Do NOT format questions as headings.
   - Format multiple-choice options as standard Markdown bullet lists (e.g., * (a) Option A).
   - Use '##' or '###' for major exam sections or parts (e.g., ## Part I: Choose the Correct Answer (36 Marks)).
3. Math Formatting: Convert all mathematical expressions, variables, equations, and formulas into LaTeX format using single dollar signs ($...$) for inline math and double dollar signs ($$...$$) for block equations.
4. Clean Up Noise: Strip out any layout artifacts, system text, page dividers, watermarks, stamps, or scanner transcription markers. Do NOT include page numbers or footer messages unless they are part of a question.
   - Ignore and omit all handwritten markings, scribbles, student answers/notes written on the paper, grader checkmarks, corrections, score indicators, or teacher comments.
   - Ignore and strip out any hand-drawn sketches, graphs, coordinate axes, plots, diagrams, or drawings made by a student (often written in pen or pencil inside solve spaces or margins). Focus ONLY on transcribing official printed/typeset exam content and diagrams.
5. Lists: Format multiple-choice options as standard Markdown bullet lists (e.g., * (a) Option A).
6. True/False Questions: For EVERY True or False question, you MUST remove the words "True or False", "(T/F)", "(True/False)", or similar phrasing from the question text itself, and instead ALWAYS add two explicit bullet-point choices on separate lines after the question:
   * (a) True
   * (b) False
   For example, if the original question reads: "1. (T/F) A binary search tree is always balanced.", output:
   **1.** A binary search tree is always balanced.
   * (a) True
   * (b) False
   Do NOT leave True/False questions without these two explicit choices. Every single T/F question must have them.
7. Placeholders: Insert the exact text [SOLVE_SPACE_HERE] on a new line, ensuring there is a blank line before it (separated by an empty line from the question text), immediately following the end of every question and sub-question (both multiple-choice and long-answer).
8. Figures & Diagrams: For ANY figure, diagram, graph, image, circuit, drawing, or visual element that is RELEVANT to a question:
   - Write [FIGURE:P:Y1,X1,Y2,X2:description] on its own line where:
     - P = the PDF page number (1-indexed)
     - Y1,X1 = top-left corner coordinates (0-1000 normalized scale)
     - Y2,X2 = bottom-right corner coordinates (0-1000 normalized scale)
     - description = brief description of the figure
   - Place this marker exactly where the figure appears relative to the question
   - Example: [FIGURE:2:120,50,450,800:Right triangle with hypotenuse c and legs a=3, b=4]
   - ONLY include figures relevant to answering questions (diagrams, circuits, graphs, geometric shapes, charts)
   - IGNORE decorative elements: university logos, headers, footers, watermarks, stamps, signatures, page borders. Do NOT use Mermaid.js code blocks.
9. Preserve Structure: Keep the original question numbering, sub-questions, instructions, and sections. Use --- (horizontal rules) between major exam sections.
10. Output Constraints: Do NOT add answers or solutions. Do NOT skip any exam content. Output ONLY the markdown text — no explanations, no preamble, and no HTML markdown code fences.
11. Table Formatting: For any table, matrix (non-mathematical), grid, or tabular data:
    - You MUST ALWAYS format it as a standard Markdown table using pipes and hyphens (e.g., \`| Header 1 | Header 2 |\` followed by \`|---|---|\` and the row data).
    - Do NOT output tables as preformatted ASCII art, inside code blocks, or as unstructured tab-separated/space-separated text.
    - Ensure all cells are properly aligned and that math formulas inside tables are enclosed in standard LaTeX delimiters ($...$).`;

export class GeminiServiceImpl implements GeminiService {
  async digitize(
      pdfBase64: string,
      apiKey: string,
      model: string,
      signal?: AbortSignal
  ): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelInstance = genAI.getGenerativeModel({
      model: model,
      systemInstruction: EXAM_PROMPT,
    });

    const maxRetries = 5;
    let delay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const contents = [
          {
            inlineData: {
              data: pdfBase64,
              mimeType: 'application/pdf'
            }
          }
        ];

        const result = await modelInstance.generateContent(
          contents,
          signal ? { signal } : undefined
        );

        const response = result.response;

        // Check input block feedback from SDK
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt was blocked by Gemini (${response.promptFeedback.blockReason}). Please check your document content.`);
        }

        // Check candidate finishReason
        const candidate = response.candidates?.[0];
        if (candidate?.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
          if (candidate.finishReason === 'SAFETY') {
            throw new Error('Document processing was stopped by Gemini safety filters.');
          }
          if (candidate.finishReason === 'RECITATION') {
            throw new Error('Document processing was stopped due to Gemini recitation/copyright policies.');
          }
        }

        const text = response.text();
        if (text) {
          return text;
        }

        throw new Error('Empty response received from Gemini model.');
      } catch (error: any) {
        if (error.name === 'AbortError' || (error instanceof DOMException && error.name === 'AbortError')) {
          throw error;
        }

        const errorMsg = error.message || String(error);
        const lowerMsg = errorMsg.toLowerCase();
        const retrySeconds = extractRetryDelaySeconds(error);

        // 429 / RESOURCE_EXHAUSTED canonical status
        const isRateLimit = errorMsg.includes('429') || lowerMsg.includes('resource_exhausted') || lowerMsg.includes('rate limit') || lowerMsg.includes('quota');
        // 503 / UNAVAILABLE canonical status
        const isOverloaded = errorMsg.includes('503') || lowerMsg.includes('unavailable') || lowerMsg.includes('overloaded');
        // 504 / DEADLINE_EXCEEDED
        const isTimeout = errorMsg.includes('504') || lowerMsg.includes('deadline_exceeded') || lowerMsg.includes('timeout');
        // Network connectivity issues
        const isNetwork = lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('econnrefused');

        // 429 / RESOURCE_EXHAUSTED canonical status - Fail immediately so user sees wait time UI error
        if (isRateLimit) {
          if (retrySeconds) {
            throw new Error(`Gemini API rate limit or quota exceeded. Please wait ${retrySeconds} seconds before trying again, or switch models in Settings.`);
          }
          throw new Error('Gemini API rate limit or quota exceeded. You have sent too many requests in a short time. Please wait a minute before trying again or check your API quota.');
        }

        // Transient Server & Network errors (503 Overloaded, 504 Timeout, Network drops) - Retry in background
        const isTransientServerOrNetwork = isOverloaded || isTimeout || isNetwork;

        if (isTransientServerOrNetwork && attempt < maxRetries) {
          console.warn(`Gemini SDK request failed (attempt ${attempt}/${maxRetries}): ${errorMsg}. Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        // Standard HTTP & Canonical API Status Mappings based on Official Google Docs
        // 401 / 403 / UNAAUTHENTICATED / PERMISSION_DENIED / API_KEY_INVALID
        if (errorMsg.includes('API_KEY_INVALID') || errorMsg.includes('401') || errorMsg.includes('403') || lowerMsg.includes('unauthenticated') || lowerMsg.includes('permission_denied') || lowerMsg.includes('key not valid') || lowerMsg.includes('invalid api key')) {
          throw new Error('Invalid API Key or permission denied. Please verify your Gemini API key and access in Settings.');
        }

        // 404 / NOT_FOUND
        if (errorMsg.includes('404') || lowerMsg.includes('not_found') || lowerMsg.includes('model not found') || lowerMsg.includes('is not found')) {
          throw new Error('The selected Gemini model is unavailable or not supported for your API key. Please select a valid model in Settings.');
        }

        // 400 / INVALID_ARGUMENT
        if (errorMsg.includes('400') || lowerMsg.includes('invalid_argument')) {
          throw new Error('Invalid request or document payload sent to Gemini. The file may be corrupt or formatted unexpectedly.');
        }

        // 503 / UNAVAILABLE
        if (isOverloaded) {
          throw new Error('Google AI servers are currently overloaded due to high demand. Please wait a few seconds and try again, or switch models in Settings.');
        }

        // 504 / DEADLINE_EXCEEDED
        if (isTimeout) {
          throw new Error('Gemini API request timed out. Please try again.');
        }

        // Network Error
        if (isNetwork) {
          throw new Error('Network connection error. Unable to reach Gemini API. Please check your internet connection.');
        }

        // Safety / Blocked Content Error
        if (lowerMsg.includes('safety') || lowerMsg.includes('blocked') || lowerMsg.includes('recitation') || lowerMsg.includes('prohibited_content')) {
          throw new Error('Document processing was stopped by Gemini content safety filters. Please review the document.');
        }

        throw new Error(errorMsg);
      }
    }

    throw new Error('Failed to get response from Gemini after maximum retries.');
  }
}

function extractRetryDelaySeconds(error: any): number | null {
  if (!error) return null;

  try {
    // 1. Check HTTP Response Headers if available
    if (error?.response?.headers?.get) {
      const retryAfter = error.response.headers.get('retry-after');
      if (retryAfter && !isNaN(Number(retryAfter))) {
        return Math.ceil(Number(retryAfter));
      }
    }

    // 2. Check direct SDK properties
    if (typeof error?.retryDelay === 'number' && error.retryDelay > 0) {
      return Math.ceil(error.retryDelay / 1000);
    }

    // 3. Extract via Regex from error message / stringified error
    const errorStr = (error.message || '') + ' ' + (typeof error === 'string' ? error : JSON.stringify(error));

    const regexPatterns = [
      /retry\s*(?:after|in)?\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?/i,
      /retry_delay["\s:]+(\d+(?:\.\d+)?)/i,
      /reset\s*(?:in|after)?\s*(\d+(?:\.\d+)?)\s*(?:s|sec|seconds)?/i
    ];

    for (const pattern of regexPatterns) {
      const match = errorStr.match(pattern);
      if (match && match[1]) {
        const val = parseFloat(match[1]);
        if (!isNaN(val) && val > 0 && val < 3600) {
          return Math.ceil(val);
        }
      }
    }
  } catch {
    // Fail silently and return null on parsing errors
  }

  return null;
}
