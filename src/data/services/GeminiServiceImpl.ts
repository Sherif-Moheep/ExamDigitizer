import { GeminiService } from '../../domain/services/GeminiService';

const EXAM_PROMPT = `Role: You are an expert document parser and formatting assistant.
Task: Convert the attached exam/text into clean, well-structured Markdown format. If the text contains raw OCR transcription errors or broken mathematical symbols from the PDF parsing, use your domain knowledge of math, physics, or business to correct them into the proper academic notation.

Formatting Rules:
1. Headers & Metadata: Extract and preserve ALL exam header details at the top of the exam exactly as written. Include the university/institution name, department/faculty name, course name, course code, program, lecturer/examiner, academic year, semester, date, duration/time allowed, and total marks. Use clear headers (#, ##, ###) and bold key-value text (e.g., **Course:** Physics 101). Do NOT omit, modify, or summarize any of this information.
2. Question Formatting: Format all question numbers and question labels in bold (e.g., **Question 1:**, **Q2:**, **Problem 3:**).
3. Math Formatting: Convert all mathematical expressions, variables, equations, and formulas into LaTeX format using single dollar signs ($...$) for inline math and double dollar signs ($$...$$) for block equations.
4. Clean Up Noise: Strip out any layout artifacts, system text, page dividers, watermarks, stamps, or scanner transcription markers. Do not include page numbers or footer messages unless they are part of a question.
5. Lists: Format multiple-choice options as standard Markdown bullet lists (e.g., * (a) Option A).
6. Placeholders: Insert the exact text [SOLVE_SPACE_HERE] on a new line immediately following the end of every question and sub-question (both multiple-choice and long-answer).
7. Figures & Diagrams: For any figure, diagram, graph, image, circuit, drawing, or visual element relevant to a question:
   - If you can represent it clearly as an ASCII text diagram/art, draw it using an ASCII text block (enclosed in a pre/code block) and add a note explaining that it is a representation.
   - If it is too complex or cannot be drawn in ASCII, include a prominent blockquote note:
     > **[FIGURE REFERENCE]**: A relevant diagram (description: [insert short description of the figure]) is located on PDF Page P. Please refer to page P of the original PDF to view it.
   - Place this ASCII diagram or reference note exactly where the figure appears relative to the question.
8. Preserve Structure: Keep the original question numbering, sub-questions, instructions, and sections. Use --- (horizontal rules) between major exam sections.
9. Output Constraints: Do NOT add answers or solutions. Do NOT skip any exam content. Output ONLY the markdown text — no explanations, no preamble, and no HTML markdown code fences.`;

export class GeminiServiceImpl implements GeminiService {
  async digitize(
      pdfBase64: string,
      apiKey: string,
      model: string,
      signal?: AbortSignal
  ): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{
        parts: [
          { text: EXAM_PROMPT },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: pdfBase64
            }
          }
        ]
      }]
    };

    const maxRetries = 3;
    let delay = 1500;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          signal: signal
        });

        const data = await response.json();

        if (!response.ok) {
          const isRetryable = response.status === 503 || response.status === 429 || response.status === 504;
          
          let errorMsg = 'Gemini API Error';
          if (data.error) {
            errorMsg = data.error.message || `Error ${data.error.code}: ${data.error.status}`;
          }

          if (isRetryable && attempt < maxRetries) {
            console.warn(`Gemini API returned status ${response.status} (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
            continue;
          }

          if (response.status === 400 && errorMsg.includes('API_KEY_INVALID')) {
            throw new Error('Invalid API Key. Please verify your key in Settings.');
          }
          throw new Error(errorMsg);
        }

        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          return data.candidates[0].content.parts[0].text;
        }

        throw new Error('Empty response received from Gemini model.');
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw error;
        }
        
        // Retry on network errors
        if (attempt < maxRetries) {
          console.warn(`Network error during Gemini request (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }
        throw error;
      }
    }

    throw new Error('Failed to get response from Gemini after maximum retries.');
  }
}
