/**
 * ============================================================================
 * ProprioFile v3 — Composant principal
 * ============================================================================
 * 
 * NOUVEAUTÉS v3 :
 * - Mode filigrane : Image / Texte / Combiné (onglets)
 * - Texte personnalisable avec variables dynamiques
 * - Sélecteur de police (standard + Google Fonts)
 * - Color picker avec presets
 * - Preview canvas temps réel pour image ET texte
 * 
 * @author SIYANDJI DEV EXPERT
 * @version 3.0.0
 */

import './App.css';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// === IMPORTS UTILS ===
import {
  DEFAULT_WATERMARK_CONFIG, SLIDER_LIMITS, ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_EXTENSIONS, THEME_STORAGE_KEY, TOAST_DURATION,
  MAX_FILE_SIZE, MESSAGES,
} from './utils/constants';
import {
  formatFileSize, isAcceptedImageType, isFileSizeValid,
  readFileAsDataURL, generateExportFilename, downloadBlob,
} from './utils/fileHelpers';
import {
  processSinglePdf, processMultiplePdfs, generateZip, loadDefaultLogo,
} from './utils/pdfProcessor';

// === IMPORT CONFIG TEXTE v3 ===
import {
  DEFAULT_TEXT_CONFIG, STANDARD_FONTS, GOOGLE_FONTS,
  TEXT_VARIABLES, COLOR_PRESETS, FONT_SIZE_LIMITS, resolveTextVariables,
} from './utils/textWatermarkConfig';


// ============================================================================
// HOOK : useTheme
// ============================================================================

function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved !== null) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia)
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    return true;
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);
  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);
  return { isDark, toggleTheme };
}


// ============================================================================
// HOOK : useFileUpload
// ============================================================================

function useFileUpload({ acceptedTypes, multiple = false }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    const valid = Array.from(e.dataTransfer.files).filter(
      f => acceptedTypes.includes(f.type) && isFileSizeValid(f)
    );
    if (valid.length > 0) setFiles(prev => multiple ? [...prev, ...valid] : [valid[0]]);
  }, [acceptedTypes, multiple]);

  const handleSelect = useCallback((e) => {
    const sel = Array.from(e.target.files).filter(f => isFileSizeValid(f));
    if (multiple) setFiles(prev => [...prev, ...sel]);
    else setFiles(sel.slice(0, 1));
    e.target.value = '';
  }, [multiple]);

  const removeFile = useCallback((i) => setFiles(prev => prev.filter((_, idx) => idx !== i)), []);
  const resetFiles = useCallback(() => setFiles([]), []);

  return { files, dragActive, handleDrag, handleDrop, handleSelect, removeFile, resetFiles };
}


// ============================================================================
// COMPOSANT : WatermarkPreview — Preview canvas avec support TEXTE
// ============================================================================

function WatermarkPreview({ logoPreview, config, textConfig, watermarkMode, isDark }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!logoPreview) { imageRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imageRef.current = img; drawPreview(); };
    img.src = logoPreview;
  }, [logoPreview]);

  useEffect(() => { drawPreview(); }, [config, textConfig, watermarkMode, isDark, logoPreview]);

  function drawPreview() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Page A4
    const m = 16, pw = w - m * 2, ph = h - m * 2;
    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
    ctx.fillStyle = isDark ? '#1e1e2e' : '#ffffff';
    ctx.beginPath(); ctx.roundRect(m, m, pw, ph, 4); ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

    // Lignes simulées
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 18; i++) {
      const y = m + 28 + i * 12;
      ctx.beginPath();
      ctx.roundRect(m + 16, y, Math.max(pw * (0.5 + Math.sin(i * 1.7) * 0.3), pw * 0.3), 4, 2);
      ctx.fill();
    }

    // Filigrane IMAGE
    if ((watermarkMode === 'image' || watermarkMode === 'both') && imageRef.current) {
      const img = imageRef.current;
      const lw = pw * (config.scale / 100);
      const lh = (img.naturalHeight / img.naturalWidth) * lw;
      ctx.save();
      ctx.globalAlpha = config.opacity / 100;
      ctx.translate(w / 2, h / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.drawImage(img, -lw / 2, -lh / 2, lw, lh);
      ctx.restore();
    }

    // Filigrane TEXTE
    if ((watermarkMode === 'text' || watermarkMode === 'both') && textConfig.content) {
      const text = resolveTextVariables(textConfig.content, 'preview.pdf');
      const scaleFactor = (pw * (config.scale / 100)) / 280;
      const fontSize = Math.max(8, textConfig.fontSize * scaleFactor * 0.5);

      ctx.save();
      ctx.globalAlpha = config.opacity / 100;
      ctx.translate(w / 2, h / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.font = `${fontSize}px ${textConfig.fontFamily.includes('Bold') ? 'bold' : 'normal'} sans-serif`;
      ctx.fillStyle = textConfig.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 0, watermarkMode === 'both' ? fontSize * 0.8 : 0);
      ctx.restore();
    }
  }

  return (
    <canvas ref={canvasRef} width={280} height={380}
      style={{
        width: '100%', maxWidth: 280, height: 'auto', borderRadius: 12,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        background: isDark ? '#12121a' : '#f0f0f0',
      }}
      aria-label="Aperçu du filigrane"
    />
  );
}


// ============================================================================
// ICÔNES SVG
// ============================================================================

const Icons = {
  Sun: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>),
  Moon: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>),
  Upload: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>),
  FileText: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>),
  Image: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>),
  Settings: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  X: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  RotateCcw: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>),
  Shield: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Check: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  Eye: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>),
  Download: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>),
  Loader: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>),
  Trash: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>),
  Info: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>),
  Type: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>),
  Layers: ({ size = 20 }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>),
};


// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

function ThemeToggle({ isDark, onToggle }) {
  return (
    <button onClick={onToggle} className="theme-toggle"
      aria-label={isDark ? 'Mode clair' : 'Mode sombre'}>
      {isDark ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
    </button>
  );
}

function SliderControl({ label, value, min, max, unit, onChange, accentColor }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value" style={{ color: accentColor }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))} className="slider-input"
        style={{ '--slider-fill': `${pct}%`, '--slider-accent': accentColor }}
        aria-label={`${label}: ${value}${unit}`} />
    </div>
  );
}

function FileItem({ file, index, onRemove }) {
  const size = useMemo(() => formatFileSize(file.size), [file.size]);
  return (
    <div className="file-item" role="listitem">
      <Icons.FileText size={16} />
      <span className="file-name" title={file.name}>{file.name}</span>
      <span className="file-size">{size}</span>
      <button onClick={() => onRemove(index)} className="btn-icon btn-icon--danger" aria-label={`Retirer ${file.name}`}>
        <Icons.X size={14} />
      </button>
    </div>
  );
}

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, TOAST_DURATION); return () => clearTimeout(t); }, [onClose]);
  if (!message) return null;
  return (
    <div className={`toast toast--${type}`} role="alert">
      {type === 'success' ? <Icons.Check size={18} /> : <Icons.Info size={18} />}
      <span>{message}</span>
      <button onClick={onClose} className="toast-close" aria-label="Fermer"><Icons.X size={14} /></button>
    </div>
  );
}

/** v3 : Onglets de mode filigrane */
function WatermarkTabs({ mode, onModeChange }) {
  const tabs = [
    { key: 'image', label: 'Image', icon: <Icons.Image size={16} /> },
    { key: 'text', label: 'Texte', icon: <Icons.Type size={16} /> },
    { key: 'both', label: 'Combiné', icon: <Icons.Layers size={16} /> },
  ];
  return (
    <div className="watermark-tabs" role="tablist">
      {tabs.map(t => (
        <button key={t.key} role="tab" aria-selected={mode === t.key}
          className={`watermark-tab ${mode === t.key ? 'watermark-tab--active' : ''}`}
          onClick={() => onModeChange(t.key)}>
          {t.icon}<span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

/** v3 : Panneau de configuration texte */
function TextConfigPanel({ textConfig, onUpdate, fontUrl, onFontUrlChange }) {
  const updateField = (key, val) => onUpdate({ ...textConfig, [key]: val });
  const insertVar = (v) => updateField('content', textConfig.content + ' ' + v);
  const fsPct = ((textConfig.fontSize - FONT_SIZE_LIMITS.min) / (FONT_SIZE_LIMITS.max - FONT_SIZE_LIMITS.min)) * 100;

  const handleFontChange = (e) => {
    const val = e.target.value;
    const std = STANDARD_FONTS.find(f => f.value === val);
    if (std) { updateField('fontFamily', std.value); onFontUrlChange(null); return; }
    const gf = GOOGLE_FONTS.find(f => f.name === val);
    if (gf) { updateField('fontFamily', gf.name); onFontUrlChange(gf.url); }
  };

  const currentFontValue = fontUrl
    ? GOOGLE_FONTS.find(f => f.url === fontUrl)?.name || 'Helvetica'
    : textConfig.fontFamily;

  return (
    <div className="text-config">
      {/* Saisie texte */}
      <div className="text-input-group">
        <label className="text-input-label">Texte du filigrane</label>
        <textarea className="text-input" value={textConfig.content}
          onChange={(e) => updateField('content', e.target.value)}
          placeholder="Ex: CONFIDENTIEL, NE PAS COPIER..." rows={2} maxLength={200} />
        <span className="text-char-count">{textConfig.content.length}/200</span>
      </div>

      {/* Variables */}
      <div className="text-variables">
        <span className="text-variables-label">Variables :</span>
        <div className="text-variables-list">
          {TEXT_VARIABLES.map(v => (
            <button key={v.variable} className="text-variable-btn" type="button"
              onClick={() => insertVar(v.variable)} title={`Insère "${v.example}"`}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Police */}
      <div className="font-picker">
        <label className="font-picker-label">Police</label>
        <select className="font-picker-select" value={currentFontValue} onChange={handleFontChange}>
          <optgroup label="Standard (rapide)">
            {STANDARD_FONTS.map(f => <option key={f.value} value={f.value}>{f.name} — {f.style}</option>)}
          </optgroup>
          <optgroup label="Google Fonts">
            {GOOGLE_FONTS.map(f => <option key={f.name} value={f.name}>{f.name} — {f.style}</option>)}
          </optgroup>
        </select>
      </div>

      {/* Taille police */}
      <div className="slider-control">
        <div className="slider-header">
          <span className="slider-label">Taille de police</span>
          <span className="slider-value" style={{ color: 'var(--accent)' }}>{textConfig.fontSize}px</span>
        </div>
        <input type="range" min={FONT_SIZE_LIMITS.min} max={FONT_SIZE_LIMITS.max}
          value={textConfig.fontSize} onChange={(e) => updateField('fontSize', Number(e.target.value))}
          className="slider-input" style={{ '--slider-fill': `${fsPct}%`, '--slider-accent': 'var(--accent)' }} />
      </div>

      {/* Couleur */}
      <div className="color-picker">
        <label className="color-picker-label">Couleur</label>
        <div className="color-picker-row">
          <div className="color-presets">
            {COLOR_PRESETS.map(c => (
              <button key={c.hex} type="button"
                className={`color-preset ${textConfig.color === c.hex ? 'color-preset--active' : ''}`}
                style={{ background: c.hex }} onClick={() => updateField('color', c.hex)}
                title={c.name} aria-label={c.name} />
            ))}
          </div>
          <div className="color-custom">
            <input type="color" value={textConfig.color}
              onChange={(e) => updateField('color', e.target.value)} className="color-input" />
            <span className="color-hex">{textConfig.color}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// COMPOSANT PRINCIPAL : App
// ============================================================================

function App({ onBack }) {
  const { isDark, toggleTheme } = useTheme();

  // --- Mode filigrane (v3) ---
  const [watermarkMode, setWatermarkMode] = useState('image');

  // --- Logo ---
  const [customLogo, setCustomLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // --- Config commune (rotation, opacité, taille) ---
  const [config, setConfig] = useState({ ...DEFAULT_WATERMARK_CONFIG });

  // --- Config texte (v3) ---
  const [textConfig, setTextConfig] = useState({ ...DEFAULT_TEXT_CONFIG });
  const [fontUrl, setFontUrl] = useState(null);

  // --- PDFs ---
  const pdfUpload = useFileUpload({ acceptedTypes: ['application/pdf'], multiple: true });

  // --- Traitement ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // === HANDLERS LOGO ===

  const handleLogoSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!isAcceptedImageType(file.type)) { setToast({ message: MESSAGES.LOGO_FORMAT_ERROR, type: 'error' }); return; }
    if (!isFileSizeValid(file)) { setToast({ message: MESSAGES.FILE_TOO_LARGE(file.name), type: 'error' }); return; }
    setCustomLogo(file);
    try { setLogoPreview(await readFileAsDataURL(file)); } catch { setToast({ message: 'Erreur lecture', type: 'error' }); }
    e.target.value = '';
  }, []);

  const resetLogo = useCallback(() => {
    setCustomLogo(null); setLogoPreview(null);
    setToast({ message: MESSAGES.LOGO_RESET, type: 'success' });
  }, []);

  // === HANDLERS CONFIG ===

  const updateConfig = useCallback((key, val) => setConfig(prev => ({ ...prev, [key]: val })), []);
  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_WATERMARK_CONFIG });
    setTextConfig({ ...DEFAULT_TEXT_CONFIG });
    setFontUrl(null);
    setToast({ message: MESSAGES.CONFIG_RESET, type: 'success' });
  }, []);
  const resetDocuments = useCallback(() => {
    pdfUpload.resetFiles();
    setToast({ message: MESSAGES.DOCS_RESET, type: 'success' });
  }, [pdfUpload]);

  // === TRAITEMENT PDF v3 ===

  const handleStart = useCallback(async () => {
    if (pdfUpload.files.length === 0) return;
    setIsProcessing(true); setProgress(0);

    try {
      // Préparer le logo si mode image ou both
      let logoBytes = null, logoMimeType = null;
      if (watermarkMode === 'image' || watermarkMode === 'both') {
        if (customLogo) {
          logoBytes = await customLogo.arrayBuffer();
          logoMimeType = customLogo.type;
        } else {
          const def = await loadDefaultLogo();
          logoBytes = def.bytes; logoMimeType = def.mimeType;
        }
      }

      // Options pour le processor v3
      const opts = {
        mode: watermarkMode,
        logoBytes,
        logoMimeType,
        config,
        textConfig: (watermarkMode === 'text' || watermarkMode === 'both') ? textConfig : null,
        fontUrl: (watermarkMode === 'text' || watermarkMode === 'both') ? fontUrl : null,
      };

      const isSingle = pdfUpload.files.length === 1;

      if (isSingle) {
        setProgress(50);
        const pdfBytes = await processSinglePdf(pdfUpload.files[0], opts);
        setProgress(100);
        downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), `protected_${pdfUpload.files[0].name}`);
        setToast({ message: MESSAGES.PROCESS_SUCCESS(1), type: 'success' });
      } else {
        const results = await processMultiplePdfs(pdfUpload.files, opts, (p) => setProgress(p));
        downloadBlob(await generateZip(results), generateExportFilename());
        setToast({ message: MESSAGES.PROCESS_SUCCESS(results.filter(r => r.data).length), type: 'success' });
      }
    } catch (err) {
      console.error('Erreur:', err);
      setToast({ message: MESSAGES.PROCESS_ERROR, type: 'error' });
    } finally { setIsProcessing(false); setProgress(0); }
  }, [pdfUpload.files, customLogo, config, watermarkMode, textConfig, fontUrl]);

  // Vérifier si le mode actuel a assez de données pour générer
  const canGenerate = useMemo(() => {
    if (pdfUpload.files.length === 0) return false;
    if (watermarkMode === 'text') return textConfig.content.trim().length > 0;
    if (watermarkMode === 'both') return textConfig.content.trim().length > 0;
    return true; // mode image
  }, [pdfUpload.files, watermarkMode, textConfig.content]);

  // ========================================================================
  // RENDU
  // ========================================================================

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>

      <header className="header">
        <div className="header-top">
          <div className="header-brand">
            {onBack && (
              <button onClick={onBack} className="btn-back" aria-label="Retour" title="Retour">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
                </svg>
              </button>
            )}
            <Icons.Shield size={28} />
            <h1>ProprioFile</h1>
            <span className="badge">v3</span>
          </div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
        <p className="header-subtitle">La protection intelligente de vos PDF.</p>
      </header>

      <main className="main">
        <div className="grid-layout">

          {/* === COLONNE GAUCHE === */}
          <div className="col-left">

            {/* Carte Filigrane — avec onglets v3 */}
            <section className="card" aria-labelledby="wm-title">
              <div className="card-header">
                <div className="card-title-group">
                  <Icons.Image size={20} />
                  <h2 id="wm-title">Filigrane</h2>
                </div>
                {(customLogo || textConfig.content !== DEFAULT_TEXT_CONFIG.content) && (
                  <button onClick={() => { resetLogo(); setTextConfig({ ...DEFAULT_TEXT_CONFIG }); setFontUrl(null); }}
                    className="btn-reset" aria-label="Reset"><Icons.RotateCcw size={14} /><span>Reset</span></button>
                )}
              </div>
              <div className="card-body">
                {/* Onglets Image / Texte / Combiné */}
                <WatermarkTabs mode={watermarkMode} onModeChange={setWatermarkMode} />

                {/* CONTENU MODE IMAGE */}
                {(watermarkMode === 'image' || watermarkMode === 'both') && (
                  <div style={{ marginBottom: watermarkMode === 'both' ? 16 : 0 }}>
                    {logoPreview ? (
                      <div className="logo-preview-container">
                        <img src={logoPreview} alt="Logo" className="logo-preview-img" />
                        <div className="logo-preview-info"><Icons.Check size={14} /><span>{customLogo?.name}</span></div>
                      </div>
                    ) : (
                      <div className="upload-zone upload-zone--compact">
                        <input type="file" accept={ACCEPTED_IMAGE_EXTENSIONS} onChange={handleLogoSelect} id="logo-upload" hidden />
                        <label htmlFor="logo-upload" className="upload-label">
                          <Icons.Upload size={22} />
                          <span className="upload-text">Choisir un logo</span>
                          <span className="upload-hint">PNG, JPG, WEBP, SVG</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* CONTENU MODE TEXTE */}
                {(watermarkMode === 'text' || watermarkMode === 'both') && (
                  <TextConfigPanel textConfig={textConfig} onUpdate={setTextConfig}
                    fontUrl={fontUrl} onFontUrlChange={setFontUrl} />
                )}
              </div>
            </section>

            {/* Carte Documents PDF */}
            <section className="card" aria-labelledby="pdf-title">
              <div className="card-header">
                <div className="card-title-group">
                  <Icons.FileText size={20} />
                  <h2 id="pdf-title">Documents PDF</h2>
                  {pdfUpload.files.length > 0 && <span className="counter">{pdfUpload.files.length}</span>}
                </div>
                {pdfUpload.files.length > 0 && (
                  <button onClick={resetDocuments} className="btn-reset" aria-label="Tout retirer">
                    <Icons.Trash size={14} /><span>Tout retirer</span></button>
                )}
              </div>
              <div className="card-body">
                <div className={`drop-zone ${pdfUpload.dragActive ? 'drop-zone--active' : ''}`}
                  onDragEnter={pdfUpload.handleDrag} onDragLeave={pdfUpload.handleDrag}
                  onDragOver={pdfUpload.handleDrag} onDrop={pdfUpload.handleDrop}>
                  <input type="file" multiple accept=".pdf" onChange={pdfUpload.handleSelect} id="pdf-upload" hidden />
                  <label htmlFor="pdf-upload" className="drop-label"><Icons.Upload size={28} /><span>Glissez vos PDF ou cliquez</span></label>
                </div>
                {pdfUpload.files.length > 0 && (
                  <div className="file-list" role="list">
                    {pdfUpload.files.map((f, i) => <FileItem key={`${f.name}-${i}`} file={f} index={i} onRemove={pdfUpload.removeFile} />)}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* === COLONNE DROITE === */}
          <div className="col-right">

            {/* Carte Configuration */}
            <section className="card" aria-labelledby="config-title">
              <div className="card-header">
                <div className="card-title-group"><Icons.Settings size={20} /><h2 id="config-title">Configuration</h2></div>
                <button onClick={resetConfig} className="btn-reset" aria-label="Reset"><Icons.RotateCcw size={14} /><span>Reset</span></button>
              </div>
              <div className="card-body">
                <SliderControl label="Rotation" value={config.rotation} min={SLIDER_LIMITS.rotation.min}
                  max={SLIDER_LIMITS.rotation.max} unit="°" onChange={v => updateConfig('rotation', v)} accentColor="var(--accent)" />
                <SliderControl label="Opacité" value={config.opacity} min={SLIDER_LIMITS.opacity.min}
                  max={SLIDER_LIMITS.opacity.max} unit="%" onChange={v => updateConfig('opacity', v)} accentColor="var(--accent-alt)" />
                <SliderControl label="Taille" value={config.scale} min={SLIDER_LIMITS.scale.min}
                  max={SLIDER_LIMITS.scale.max} unit="%" onChange={v => updateConfig('scale', v)} accentColor="var(--accent-warm)" />
              </div>
            </section>

            {/* Carte Aperçu — mise à jour pour texte */}
            <section className="card" aria-labelledby="preview-title">
              <div className="card-header">
                <div className="card-title-group"><Icons.Eye size={20} /><h2 id="preview-title">Aperçu</h2></div>
              </div>
              <div className="card-body preview-body">
                <WatermarkPreview logoPreview={logoPreview} config={config}
                  textConfig={textConfig} watermarkMode={watermarkMode} isDark={isDark} />
                {watermarkMode === 'image' && !logoPreview && <p className="preview-hint">Chargez un logo pour voir l'aperçu</p>}
                {watermarkMode === 'text' && !textConfig.content && <p className="preview-hint">Saisissez du texte pour voir l'aperçu</p>}
              </div>
            </section>
          </div>
        </div>

        {/* Progression */}
        {isProcessing && (
          <div className="progress-section" role="status" aria-live="polite">
            <div className="progress-info">
              <Icons.Loader size={18} /><span>Traitement... {progress}%</span>
              <span className="progress-count">{Math.ceil((progress / 100) * pdfUpload.files.length)}/{pdfUpload.files.length}</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} role="progressbar"
                aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
            </div>
          </div>
        )}

        {/* Bouton action */}
        <div className="action-section">
          <button onClick={handleStart} disabled={!canGenerate || isProcessing} className="btn-action" aria-busy={isProcessing}>
            {isProcessing ? (
              <><Icons.Loader size={20} /><span>Traitement en cours...</span></>
            ) : (
              <><Icons.Download size={20} /><span>
                <p>{pdfUpload.files.length <= 1 ? 'Télécharger le PDF protégé' : `Générer le ZIP (${pdfUpload.files.length} fichiers)`}</p>
              </span></>
            )}
          </button>
          {!canGenerate && !isProcessing && <p className="action-hint">{MESSAGES.NO_FILES}</p>}
        </div>
      </main>

      <footer className="footer"><p>ProprioFile v3 © 2026 — La protection intelligente de vos PDF.</p></footer>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}

export default App;
