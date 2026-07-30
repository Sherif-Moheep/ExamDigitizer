export interface GeminiService {
  digitize(
    pdfBase64: string, 
    apiKey: string, 
    model: string, 
    signal?: AbortSignal
  ): Promise<string>;

  digitizeStream(
    pdfBase64: string,
    apiKey: string,
    model: string,
    onChunk: (accumulatedText: string) => void,
    signal?: AbortSignal
  ): Promise<string>;
}
