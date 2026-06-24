// Initialize markdown-it with math typesetting
let md;
let activeAbortController = null;
let statusTimeout;

// Constants for Gemini Models
const GEMINI_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Recommended)' },
  { id: 'gemini-3.5-pro', name: 'Gemini 3.5 Pro' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' }
];

// Default configuration
const DEFAULT_MODEL = 'gemini-3.5-flash';

// Custom prompt matching user's requests regarding figures
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

// State
let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
  // Initialize Markdown-It and Katex
  if (window.markdownit && window.texmath && window.katex) {
    md = window.markdownit({ html: true, breaks: true })
      .use(window.texmath, { engine: window.katex, delimiters: "dollars" });
  } else {
    console.error("Required libraries (markdown-it, texmath, or KaTeX) failed to load.");
  }

  // Load Settings from LocalStorage
  loadSettings();

  // Setup Event Listeners
  setupEventListeners();

  // Initial preview render (if there's default content, though it's empty initially now)
  updatePreview();

  // Check if API Key is missing. If so, open Settings modal to guide the user.
  const apiKey = localStorage.getItem('clearexam_api_key');
  if (!apiKey) {
    showSettingsModal();
  }
});

// Load settings from local storage into elements
function loadSettings() {
  const apiKey = localStorage.getItem('clearexam_api_key') || '';
  const model = localStorage.getItem('clearexam_model') || DEFAULT_MODEL;

  document.getElementById('input-api-key').value = apiKey;
  
  const selectModel = document.getElementById('select-model');
  // Clear options and rebuild to ensure models are correct
  selectModel.innerHTML = '';
  
  let modelExistsInPresets = false;
  GEMINI_MODELS.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m.id;
    opt.textContent = m.name;
    if (m.id === model) {
      opt.selected = true;
      modelExistsInPresets = true;
    }
    selectModel.appendChild(opt);
  });

  // Add the "Custom" option
  const customOpt = document.createElement('option');
  customOpt.value = 'custom';
  customOpt.textContent = 'Custom Model...';
  if (!modelExistsInPresets && model) {
    customOpt.selected = true;
    document.getElementById('custom-model-group').style.display = 'block';
    document.getElementById('input-custom-model').value = model;
  } else {
    document.getElementById('custom-model-group').style.display = 'none';
    document.getElementById('input-custom-model').value = '';
  }
  selectModel.appendChild(customOpt);
}

// Setup elements events
function setupEventListeners() {
  // Navigation / Views
  document.getElementById('btn-new-exam').addEventListener('click', resetToUploadScreen);
  document.getElementById('btn-settings').addEventListener('click', showSettingsModal);

  // Settings Modal controls
  document.getElementById('btn-close-modal-x').addEventListener('click', hideSettingsModal);
  document.getElementById('btn-settings-cancel').addEventListener('click', hideSettingsModal);
  document.getElementById('btn-settings-save').addEventListener('click', saveSettings);
  document.getElementById('btn-toggle-key-visibility').addEventListener('click', toggleApiKeyVisibility);
  
  // Custom model group toggle
  document.getElementById('select-model').addEventListener('change', (e) => {
    const customGroup = document.getElementById('custom-model-group');
    if (e.target.value === 'custom') {
      customGroup.style.display = 'block';
      document.getElementById('input-custom-model').focus();
    } else {
      customGroup.style.display = 'none';
    }
  });

  // Textarea input
  document.getElementById('gemini-output').addEventListener('input', updatePreview);

  // Upload actions
  const uploadZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');
  const btnBrowse = document.getElementById('btn-browse');
  const btnRemoveFile = document.getElementById('btn-remove-file');
  const btnProcess = document.getElementById('btn-process');
  const btnCancelProcessing = document.getElementById('btn-cancel-processing');

  // Trigger file browser
  uploadZone.addEventListener('click', (e) => {
    // Prevent double triggering if clicked browse button directly
    if (e.target !== btnBrowse && e.target.closest('#upload-selected-state')) {
      return;
    }
    if (!selectedFile) {
      fileInput.click();
    }
  });

  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) handleFileSelection(file);
  });

  // Drag and Drop
  uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('drag-over');
  });

  uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('drag-over');
  });

  uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelection(file);
  });

  btnRemoveFile.addEventListener('click', (e) => {
    e.stopPropagation();
    removeSelectedFile();
  });

  btnProcess.addEventListener('click', (e) => {
    e.stopPropagation();
    processExam();
  });

  btnCancelProcessing.addEventListener('click', () => {
    if (activeAbortController) {
      activeAbortController.abort();
    }
    hideProcessingOverlay();
  });
}

// Show/Hide Settings Modal
function showSettingsModal() {
  // Read current saved values to fill inputs (in case user typed something but cancelled earlier)
  const apiKey = localStorage.getItem('clearexam_api_key') || '';
  const model = localStorage.getItem('clearexam_model') || DEFAULT_MODEL;
  
  document.getElementById('input-api-key').value = apiKey;
  
  const selectModel = document.getElementById('select-model');
  const customGroup = document.getElementById('custom-model-group');
  const customInput = document.getElementById('input-custom-model');

  let modelExistsInPresets = false;
  // Re-sync select state
  Array.from(selectModel.options).forEach(opt => {
    if (opt.value === model) {
      opt.selected = true;
      modelExistsInPresets = true;
    }
  });

  if (!modelExistsInPresets && model) {
    selectModel.value = 'custom';
    customGroup.style.display = 'block';
    customInput.value = model;
  } else {
    customGroup.style.display = 'none';
    customInput.value = '';
  }

  document.getElementById('settings-modal').style.display = 'flex';
}

function hideSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

// Toggle password text visibility
function toggleApiKeyVisibility() {
  const input = document.getElementById('input-api-key');
  const btn = document.getElementById('btn-toggle-key-visibility');
  if (input.type === 'password') {
    input.type = 'text';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      </svg>
    `;
  } else {
    input.type = 'password';
    btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;
  }
}

// Save settings to LocalStorage
function saveSettings() {
  const apiKey = document.getElementById('input-api-key').value.trim();
  const selectModel = document.getElementById('select-model').value;
  const customModel = document.getElementById('input-custom-model').value.trim();
  
  const savedModel = (selectModel === 'custom') ? customModel : selectModel;

  if (selectModel === 'custom' && !customModel) {
    alert('Please enter a custom Model ID.');
    return;
  }

  localStorage.setItem('clearexam_api_key', apiKey);
  localStorage.setItem('clearexam_model', savedModel);

  hideSettingsModal();
}

// File selection handler
function handleFileSelection(file) {
  if (file.type !== 'application/pdf') {
    showUploadError('Only PDF files are supported.');
    return;
  }

  // 20MB limit
  if (file.size > 20 * 1024 * 1024) {
    showUploadError('File is too large. Maximum size is 20MB.');
    return;
  }

  selectedFile = file;
  hideUploadError();

  // Update UI selected file state
  document.getElementById('selected-file-name').textContent = file.name;
  document.getElementById('selected-file-size').textContent = formatSize(file.size);

  document.getElementById('upload-idle-state').style.display = 'none';
  document.getElementById('upload-selected-state').style.display = 'flex';
}

function removeSelectedFile() {
  selectedFile = null;
  document.getElementById('file-input').value = '';
  document.getElementById('upload-idle-state').style.display = 'flex';
  document.getElementById('upload-selected-state').style.display = 'none';
}

function showUploadError(msg) {
  const errEl = document.getElementById('upload-error');
  document.getElementById('error-message').textContent = msg;
  errEl.style.display = 'block';
}

function hideUploadError() {
  document.getElementById('upload-error').style.display = 'none';
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// UI State Switcher
function showEditorView() {
  document.body.classList.remove('view-upload');
  document.body.classList.add('view-editor');
  document.getElementById('btn-new-exam').style.display = 'inline-flex';
  document.getElementById('btn-print').style.display = 'inline-flex';

  // Update document title for Print/PDF filename
  if (selectedFile) {
    const originalName = selectedFile.name.replace(/\.[^/.]+$/, "");
    document.title = `${originalName} - Digitized`;
  }
}

function resetToUploadScreen() {
  document.body.classList.remove('view-editor');
  document.body.classList.add('view-upload');
  document.getElementById('btn-new-exam').style.display = 'none';
  document.getElementById('btn-print').style.display = 'none';
  
  // Reset document title to default
  document.title = "Exam Digitizer - Native Print";
  
  removeSelectedFile();
  hideUploadError();
}

// Processing modal
function showProcessingOverlay(status) {
  const overlay = document.getElementById('processing-overlay');
  document.getElementById('processing-status').textContent = status;
  overlay.style.display = 'flex';
}

function updateProcessingStatus(status) {
  document.getElementById('processing-status').textContent = status;
}

function hideProcessingOverlay() {
  document.getElementById('processing-overlay').style.display = 'none';
}

// API processing
async function processExam() {
  const apiKey = localStorage.getItem('clearexam_api_key');
  const model = localStorage.getItem('clearexam_model') || DEFAULT_MODEL;

  if (!apiKey) {
    showUploadError('Please configure your Gemini API Key in Settings first.');
    showSettingsModal();
    return;
  }

  if (!selectedFile) {
    showUploadError('Please select an exam PDF first.');
    return;
  }

  showProcessingOverlay('Reading PDF file...');
  activeAbortController = new AbortController();

  try {
    // 1. Convert PDF to base64
    const base64Data = await fileToBase64(selectedFile);
    
    // 2. Call Gemini API
    updateProcessingStatus('Analyzing exam content with Gemini...');
    let result = await generateExamMarkdown(apiKey, model, base64Data, activeAbortController.signal);
    
    // 3. Put result in editor (clean any code fences first)
    result = stripMarkdownFences(result);
    document.getElementById('gemini-output').value = result;
    updatePreview();
    
    // 4. Navigate
    hideProcessingOverlay();
    showEditorView();
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('Processing aborted by user.');
      return;
    }
    console.error(error);
    hideProcessingOverlay();
    showUploadError(error.message || 'An error occurred during digitizing.');
  } finally {
    activeAbortController = null;
  }
}

// Base64 helper
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Make REST call to Gemini
async function generateExamMarkdown(apiKey, model, pdfBase64, signal) {
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
    let errorMsg = 'Gemini API Error';
    if (data.error) {
      errorMsg = data.error.message || `Error ${data.error.code}: ${data.error.status}`;
    }
    // Handle typical API issues
    if (response.status === 400 && errorMsg.includes('API_KEY_INVALID')) {
      throw new Error('Invalid API Key. Please verify your key in Settings.');
    }
    throw new Error(errorMsg);
  }

  // Extract response text
  if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error('Empty response received from Gemini model.');
}

/**
 * Generates vertical spacing lines for paper writing practice/solutions
 * @param {number} numberOfLines - Number of lines to generate
 * @returns {string} HTML string representing the writing lines container
 */
function generateLines(numberOfLines) {
  let linesHtml = "<div class='solve-space-container'>";
  for (let i = 0; i < numberOfLines; i++) {
    linesHtml += "<div class='writing-line'></div>";
  }
  linesHtml += "</div>";
  return linesHtml;
}

/**
 * Reads user markdown input, renders it with LaTeX equation support,
 * and updates the preview frame dynamically.
 */
function updatePreview() {
  const outputEl = document.getElementById("gemini-output");
  const containerEl = document.getElementById("pdf-container");
  const statusEl = document.getElementById("status-text");

  if (!outputEl || !containerEl) return;

  // Simple typing feedback
  if (statusEl) {
    statusEl.textContent = "Syncing...";
    statusEl.style.opacity = "0.7";
    
    clearTimeout(statusTimeout);
    statusTimeout = setTimeout(() => {
      statusEl.textContent = "Synced";
      statusEl.style.opacity = "1";
    }, 450);
  }

  let rawText = outputEl.value;
  // Clean markdown fences (helps with manual copy-pastes)
  rawText = stripMarkdownFences(rawText);

  if (md) {
    // 1. Parse markdown
    let parsedHtml = md.render(rawText);

    // 2. Format custom figures text if any matches [FIGURE REFERENCE] or similar
    // Note: Since we don't have custom image tags now, we can render simple blockquotes.
    // If we want a nice visual block for blockquotes matching figure text:
    parsedHtml = parsedHtml.replace(
      /<blockquote>\s*<p>\s*<strong>\[FIGURE REFERENCE\]<\/strong>:([\s\S]*?)<\/p>\s*<\/blockquote>/gi,
      (match, content) => {
        return `<div class="figure-note-container">
          <strong>🖼️ Figure Reference</strong>: ${content}
        </div>`;
      }
    );

    // 3. Inject the HTML lines where the token ended up
    const linesHtml = generateLines(6);
    const finalHtml = parsedHtml
      .replaceAll("<p>[SOLVE_SPACE_HERE]</p>", linesHtml)
      .replaceAll("[SOLVE_SPACE_HERE]", linesHtml); // Fallback

    containerEl.innerHTML = finalHtml;

    // 4. Post-process to extract and format exam metadata grid
    const allParagraphs = Array.from(containerEl.querySelectorAll('p'));
    const metadata = {};
    const metadataParagraphs = [];
    
    allParagraphs.forEach(p => {
      const text = p.innerHTML.trim();
      // Match key-value patterns (with or without strong tags)
      const match = text.match(/^(?:<strong>)?(Course|Program|Lecturer|Professor|Instructor|Date|Duration|Time|Marks|Semester|Department|Dept|Year|Student Name|Student ID|Class|Faculty|Examiner|Academic Year|Subject|Time Allowed)(?:<\/strong>)?:\s*(.*)$/i);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim();
        metadata[key] = val;
        metadataParagraphs.push(p);
      }
    });

    if (Object.keys(metadata).length > 0) {
      // Remove original plain text paragraphs
      metadataParagraphs.forEach(p => p.remove());

      // Create structured grid
      const metaGrid = document.createElement('div');
      metaGrid.className = 'exam-metadata-grid';
      
      let gridHtml = '';
      for (const [key, val] of Object.entries(metadata)) {
        // If it's a student field and blank, draw a line for name entry
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

      // Insert metaGrid after exam title (h1) or at the top
      const h1 = containerEl.querySelector('h1');
      if (h1) {
        h1.after(metaGrid);
      } else {
        containerEl.prepend(metaGrid);
      }
    }

    // 5. Post-process to highlight questions nicely
    const paragraphs = containerEl.querySelectorAll('p');
    paragraphs.forEach(p => {
      const firstChild = p.firstElementChild;
      if (firstChild && firstChild.tagName === 'STRONG') {
        const text = firstChild.textContent.trim();
        // Match: Question 1, Q2:, Problem 3, Prob 4: etc.
        if (/^(Question|Q|Prob|Problem)\s*\d+/i.test(text)) {
          p.classList.add('question-paragraph');
        }
      }
    });
  } else {
    containerEl.textContent = rawText;
  }
}

/**
 * Strips starting and ending markdown code fences (```markdown or ```) from text
 * @param {string} text
 * @returns {string} Cleaned text
 */
function stripMarkdownFences(text) {
  if (!text) return '';
  let cleaned = text.trim();
  // Strip starting ```markdown or ```
  cleaned = cleaned.replace(/^```markdown\s*/i, '');
  cleaned = cleaned.replace(/^```\s*/, '');
  // Strip ending ```
  cleaned = cleaned.replace(/\s*```$/, '');
  return cleaned.trim();
}
