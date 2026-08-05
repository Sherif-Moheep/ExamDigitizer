import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ExamDigitizer/',
  resolve: {
    alias: [
      { find: /^pdfjs-dist$/, replacement: 'pdfjs-dist/legacy/build/pdf.mjs' },
      { find: /^pdfjs-dist\/build\/pdf\.worker\.min\.mjs$/, replacement: 'pdfjs-dist/legacy/build/pdf.worker.min.mjs' },
    ],
  },
  server: { host: true}
});
