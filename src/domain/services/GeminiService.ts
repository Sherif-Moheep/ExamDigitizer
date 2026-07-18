export interface GeminiService {
  digitize(
    pdfBase64: string, 
    apiKey: string, 
    model: string, 
    signal?: AbortSignal
  ): Promise<string>;
}
