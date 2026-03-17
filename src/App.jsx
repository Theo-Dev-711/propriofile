/**
 * ============================================================================
 * ProprioFilev2 — Composant principal
 * ============================================================================
 * 
 * Ce fichier orchestre l'interface et délègue la logique aux modules :
 *   - utils/constants.js     → Configuration centralisée
 *   - utils/fileHelpers.js   → Formatage, validation, téléchargement
 *   - utils/pdfProcessor.js  → Traitement PDF + filigrane + ZIP
 * 
 * @author SIYANDJIDEV EXPERT
 * @version 2.1.0
 */

import './App.css';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

// ============================================================================
// IMPORTS DES MODULES UTILS
// ============================================================================

/** Configuration centralisée : valeurs par défaut, limites, messages */
import {
  DEFAULT_WATERMARK_CONFIG,
  SLIDER_LIMITS,
  ACCEPTED_IMAGE_TYPES,
  ACCEPTED_IMAGE_EXTENSIONS,
  THEME_STORAGE_KEY,
  TOAST_DURATION,
  MAX_FILE_SIZE,
  MESSAGES,
} from './utils/constants';

/** Utilitaires fichiers : formatage, lecture, validation, téléchargement */
import {
  formatFileSize,
  isAcceptedImageType,
  isFileSizeValid,
  readFileAsDataURL,
  generateExportFilename,
  downloadBlob,
} from './utils/fileHelpers';

/** Logique métier PDF : traitement filigrane, génération ZIP */
import {
  processSinglePdf,
  processMultiplePdfs,
  generateZip,
  loadDefaultLogo,
} from './utils/pdfProcessor';


// ============================================================================
// HOOK : useTheme — Gestion dark/light mode avec persistance
// ============================================================================

/**
 * Détecte le thème préféré (localStorage > système > défaut dark).
 * Applique l'attribut data-theme sur <html> et persiste le choix.
 * 
 * Utilise : THEME_STORAGE_KEY de constants.js
 */
function useTheme() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved !== null) return saved === 'dark';
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
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
// HOOK : useFileUpload — Drag & drop + sélection de fichiers
// ============================================================================

/**
 * Hook générique réutilisable pour l'upload de fichiers.
 * 
 * Utilise : ACCEPTED_IMAGE_TYPES de constants.js
 *           isFileSizeValid, isAcceptedImageType de fileHelpers.js
 * 
 * @param {Object} options
 * @param {string[]} options.acceptedTypes - Types MIME acceptés
 * @param {boolean} options.multiple - Sélection multiple autorisée
 */
function useFileUpload({ acceptedTypes, multiple = false }) {
  const [files, setFiles] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => acceptedTypes.includes(file.type) && isFileSizeValid(file)
    );

    if (droppedFiles.length > 0) {
      if (multiple) {
        setFiles(prev => [...prev, ...droppedFiles]);
      } else {
        setFiles([droppedFiles[0]]);
      }
    }
  }, [acceptedTypes, multiple]);

  const handleSelect = useCallback((e) => {
    const selected = Array.from(e.target.files).filter(f => isFileSizeValid(f));
    if (multiple) {
      setFiles(prev => [...prev, ...selected]);
    } else {
      setFiles(selected.slice(0, 1));
    }
    e.target.value = '';
  }, [multiple]);

  const removeFile = useCallback((index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetFiles = useCallback(() => setFiles([]), []);

  return { files, dragActive, handleDrag, handleDrop, handleSelect, removeFile, resetFiles };
}


// ============================================================================
// COMPOSANT : WatermarkPreview — Canvas de prévisualisation
// ============================================================================

/**
 * Dessine en temps réel le filigrane sur un canvas simulant une page A4.
 * Se met à jour automatiquement quand le logo ou la config changent.
 */
function WatermarkPreview({ logoPreview, config, isDark }) {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (!logoPreview) { imageRef.current = null; return; }
    const img = new Image();
    img.onload = () => { imageRef.current = img; drawPreview(); };
    img.src = logoPreview;
  }, [logoPreview]);

  useEffect(() => { drawPreview(); }, [config, isDark, logoPreview]);

  function drawPreview() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // --- Page A4 simulée ---
    const margin = 16;
    const pageW = w - margin * 2;
    const pageH = h - margin * 2;

    ctx.shadowColor = isDark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = isDark ? '#1e1e2e' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(margin, margin, pageW, pageH, 4);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // --- Lignes de texte simulées ---
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 18; i++) {
      const y = margin + 28 + i * 12;
      const lineW = pageW * (0.5 + Math.sin(i * 1.7) * 0.3);
      ctx.beginPath();
      ctx.roundRect(margin + 16, y, Math.max(lineW, pageW * 0.3), 4, 2);
      ctx.fill();
    }

    // --- Filigrane ---
    if (imageRef.current) {
      const img = imageRef.current;
      const logoW = pageW * (config.scale / 100);
      const logoH = (img.naturalHeight / img.naturalWidth) * logoW;

      ctx.save();
      ctx.globalAlpha = config.opacity / 100;
      ctx.translate(w / 2, h / 2);
      ctx.rotate((config.rotation * Math.PI) / 180);
      ctx.drawImage(img, -logoW / 2, -logoH / 2, logoW, logoH);
      ctx.restore();
    }
  }

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={380}
      style={{
        width: '100%', maxWidth: 280, height: 'auto', borderRadius: 12,
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
        background: isDark ? '#12121a' : '#f0f0f0',
      }}
      aria-label="Aperçu du filigrane sur une page simulée"
    />
  );
}


// ============================================================================
// ICÔNES SVG INLINE (zéro dépendance)
// ============================================================================

const Icons = {
  Sun: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Upload: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  FileText: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Image: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Settings: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  X: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  RotateCcw: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
    </svg>
  ),
  Shield: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Check: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Eye: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Download: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Loader: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1s linear infinite' }}>
      <line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
    </svg>
  ),
  Trash: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Info: ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};


// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

/** Toggle dark/light mode */
function ThemeToggle({ isDark, onToggle }) {
  return (
    <button onClick={onToggle} className="theme-toggle"
      aria-label={isDark ? 'Activer le mode clair' : 'Activer le mode sombre'}>
      {isDark ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
    </button>
  );
}

/**
 * Slider réutilisable avec label + valeur.
 * Utilise : SLIDER_LIMITS de constants.js pour les bornes.
 */
function SliderControl({ label, value, min, max, unit, onChange, accentColor }) {
  const percentage = ((value - min) / (max - min)) * 100;
  return (
    <div className="slider-control">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value" style={{ color: accentColor }}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input"
        style={{ '--slider-fill': `${percentage}%`, '--slider-accent': accentColor }}
        aria-label={`${label}: ${value}${unit}`}
      />
    </div>
  );
}

/**
 * Ligne d'un fichier dans la liste.
 * Utilise : formatFileSize() de fileHelpers.js
 */
function FileItem({ file, index, onRemove }) {
  const formattedSize = useMemo(() => formatFileSize(file.size), [file.size]);

  return (
    <div className="file-item" role="listitem">
      <Icons.FileText size={16} />
      <span className="file-name" title={file.name}>{file.name}</span>
      <span className="file-size">{formattedSize}</span>
      <button onClick={() => onRemove(index)} className="btn-icon btn-icon--danger"
        aria-label={`Retirer ${file.name}`}>
        <Icons.X size={14} />
      </button>
    </div>
  );
}

/**
 * Notification toast temporaire.
 * Utilise : TOAST_DURATION de constants.js
 */
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!message) return null;
  return (
    <div className={`toast toast--${type}`} role="alert">
      {type === 'success' ? <Icons.Check size={18} /> : <Icons.Info size={18} />}
      <span>{message}</span>
      <button onClick={onClose} className="toast-close" aria-label="Fermer">
        <Icons.X size={14} />
      </button>
    </div>
  );
}


// ============================================================================
// COMPOSANT PRINCIPAL : App
// ============================================================================

function App() {
  // --- Thème ---
  const { isDark, toggleTheme } = useTheme();

  // --- Logo filigrane ---
  const [customLogo, setCustomLogo] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // --- Configuration (initialisée depuis constants.js) ---
  const [config, setConfig] = useState({ ...DEFAULT_WATERMARK_CONFIG });

  // --- Fichiers PDF ---
  const pdfUpload = useFileUpload({
    acceptedTypes: ['application/pdf'],
    multiple: true,
  });

  // --- Traitement ---
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // --- Notifications ---
  const [toast, setToast] = useState({ message: '', type: 'info' });


  // ========================================================================
  // HANDLERS : Logo
  // ========================================================================

  /**
   * Sélection du logo filigrane.
   * Utilise : isAcceptedImageType() de fileHelpers.js
   *           readFileAsDataURL() de fileHelpers.js
   *           MESSAGES de constants.js
   */
  const handleLogoSelect = useCallback(async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validation du type via fileHelpers
    if (!isAcceptedImageType(file.type)) {
      setToast({ message: MESSAGES.LOGO_FORMAT_ERROR, type: 'error' });
      return;
    }

    // Validation de la taille via fileHelpers
    if (!isFileSizeValid(file)) {
      setToast({ message: MESSAGES.FILE_TOO_LARGE(file.name), type: 'error' });
      return;
    }

    setCustomLogo(file);

    // Aperçu via fileHelpers
    try {
      const dataUrl = await readFileAsDataURL(file);
      setLogoPreview(dataUrl);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Erreur de lecture du fichier', type: 'error' });
    }

    e.target.value = '';
  }, []);

  /** Reset logo — message depuis constants.js */
  const resetLogo = useCallback(() => {
    setCustomLogo(null);
    setLogoPreview(null);
    setToast({ message: MESSAGES.LOGO_RESET, type: 'success' });
  }, []);


  // ========================================================================
  // HANDLERS : Configuration
  // ========================================================================

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  /** Reset config aux valeurs par défaut de constants.js */
  const resetConfig = useCallback(() => {
    setConfig({ ...DEFAULT_WATERMARK_CONFIG });
    setToast({ message: MESSAGES.CONFIG_RESET, type: 'success' });
  }, []);

  /** Reset documents — message depuis constants.js */
  const resetDocuments = useCallback(() => {
    pdfUpload.resetFiles();
    setToast({ message: MESSAGES.DOCS_RESET, type: 'success' });
  }, [pdfUpload]);


  // ========================================================================
  // LOGIQUE : Traitement PDF via pdfProcessor.js
  // ========================================================================

  /**
   * Lance le traitement complet :
   * 1. Charge le logo (custom ou défaut via loadDefaultLogo)
   * 2. Traite chaque PDF via processMultiplePdfs
   * 3. Génère le ZIP via generateZip
   * 4. Déclenche le téléchargement via downloadBlob
   * 
   * Toutes ces fonctions viennent de pdfProcessor.js et fileHelpers.js
   */
 /**
   * Lance le traitement :
   * - 1 fichier  → télécharge directement le PDF protégé
   * - 2+ fichiers → télécharge un ZIP contenant tous les PDFs
   */
  const handleStart = useCallback(async () => {
    if (pdfUpload.files.length === 0) return;

    setIsProcessing(true);
    setProgress(0);

    try {
      // --- 1. Préparer le logo ---
      let logoBytes;
      let logoMimeType;

      if (customLogo) {
        logoBytes = await customLogo.arrayBuffer();
        logoMimeType = customLogo.type;
      } else {
        const defaultLogo = await loadDefaultLogo();
        logoBytes = defaultLogo.bytes;
        logoMimeType = defaultLogo.mimeType;
      }

      const isSingleFile = pdfUpload.files.length === 1;

      if (isSingleFile) {
        // --- CAS 1 FICHIER : télécharger le PDF directement ---
        setProgress(50);
        const pdfBytes = await processSinglePdf(
          pdfUpload.files[0],
          logoBytes,
          logoMimeType,
          config
        );
        setProgress(100);

        // Créer le blob PDF et télécharger
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const filename = `protected_${pdfUpload.files[0].name}`;
        downloadBlob(blob, filename);

        setToast({ message: MESSAGES.PROCESS_SUCCESS(1), type: 'success' });

      } else {
        // --- CAS MULTI-FICHIERS : générer un ZIP ---
        const results = await processMultiplePdfs(
          pdfUpload.files,
          logoBytes,
          logoMimeType,
          config,
          (pct) => setProgress(pct)
        );

        const zipBlob = await generateZip(results);
        const filename = generateExportFilename();
        downloadBlob(zipBlob, filename);

        const successCount = results.filter(r => r.data !== null).length;
        setToast({ message: MESSAGES.PROCESS_SUCCESS(successCount), type: 'success' });
      }
    } catch (error) {
      console.error('Erreur de traitement:', error);
      setToast({ message: MESSAGES.PROCESS_ERROR, type: 'error' });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [pdfUpload.files, customLogo, config]);

  // ========================================================================
  // RENDU
  // ========================================================================

  return (
    <div className={`app ${isDark ? 'dark' : 'light'}`}>

      {/* === HEADER === */}
      <header className="header">
        <div className="header-top">
          <div className="header-brand">
            <Icons.Shield size={28} />
            <h1>ProprioFile</h1>
          </div>
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        </div>
        <p className="header-subtitle">
          Protégez vos documents avec un filigrane personnalisé
        </p>
      </header>

      {/* === CONTENU === */}
      <main className="main">
        <div className="grid-layout">

          {/* --- COLONNE GAUCHE : Logo + PDFs --- */}
          <div className="col-left">

            {/* Carte Logo */}
            <section className="card" aria-labelledby="logo-title">
              <div className="card-header">
                <div className="card-title-group">
                  <Icons.Image size={20} />
                  <h2 id="logo-title">Filigrane</h2>
                </div>
                {customLogo && (
                  <button onClick={resetLogo} className="btn-reset" aria-label="Réinitialiser le logo">
                    <Icons.RotateCcw size={14} /><span>Reset</span>
                  </button>
                )}
              </div>
              <div className="card-body">
                {logoPreview ? (
                  <div className="logo-preview-container">
                    <img src={logoPreview} alt="Aperçu du logo" className="logo-preview-img" />
                    <div className="logo-preview-info">
                      <Icons.Check size={14} /><span>{customLogo?.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-zone upload-zone--compact">
                    <input type="file" accept={ACCEPTED_IMAGE_EXTENSIONS}
                      onChange={handleLogoSelect} id="logo-upload" hidden />
                    <label htmlFor="logo-upload" className="upload-label">
                      <Icons.Upload size={22} />
                      <span className="upload-text">Choisir un logo</span>
                      <span className="upload-hint">PNG, JPG, WEBP, SVG</span>
                    </label>
                  </div>
                )}
              </div>
            </section>

            {/* Carte Documents PDF */}
            <section className="card" aria-labelledby="pdf-title">
              <div className="card-header">
                <div className="card-title-group">
                  <Icons.FileText size={20} />
                  <h2 id="pdf-title">Documents PDF</h2>
                  {pdfUpload.files.length > 0 && (
                    <span className="counter">{pdfUpload.files.length}</span>
                  )}
                </div>
                {pdfUpload.files.length > 0 && (
                  <button onClick={resetDocuments} className="btn-reset" aria-label="Tout retirer">
                    <Icons.Trash size={14} /><span>Tout retirer</span>
                  </button>
                )}
              </div>
              <div className="card-body">
                <div className={`drop-zone ${pdfUpload.dragActive ? 'drop-zone--active' : ''}`}
                  onDragEnter={pdfUpload.handleDrag} onDragLeave={pdfUpload.handleDrag}
                  onDragOver={pdfUpload.handleDrag} onDrop={pdfUpload.handleDrop}>
                  <input type="file" multiple accept=".pdf"
                    onChange={pdfUpload.handleSelect} id="pdf-upload" hidden />
                  <label htmlFor="pdf-upload" className="drop-label">
                    <Icons.Upload size={28} />
                    <span>Glissez vos PDF ou cliquez</span>
                  </label>
                </div>
                {pdfUpload.files.length > 0 && (
                  <div className="file-list" role="list">
                    {pdfUpload.files.map((file, i) => (
                      <FileItem key={`${file.name}-${i}`} file={file} index={i}
                        onRemove={pdfUpload.removeFile} />
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* --- COLONNE DROITE : Config + Preview --- */}
          <div className="col-right">

            {/* Carte Configuration — limites depuis SLIDER_LIMITS (constants.js) */}
            <section className="card" aria-labelledby="config-title">
              <div className="card-header">
                <div className="card-title-group">
                  <Icons.Settings size={20} />
                  <h2 id="config-title">Configuration</h2>
                </div>
                <button onClick={resetConfig} className="btn-reset" aria-label="Réinitialiser">
                  <Icons.RotateCcw size={14} /><span>Reset</span>
                </button>
              </div>
              <div className="card-body">
                <SliderControl label="Rotation" value={config.rotation}
                  min={SLIDER_LIMITS.rotation.min} max={SLIDER_LIMITS.rotation.max}
                  unit={SLIDER_LIMITS.rotation.unit}
                  onChange={(v) => updateConfig('rotation', v)} accentColor="var(--accent)" />
                <SliderControl label="Opacité" value={config.opacity}
                  min={SLIDER_LIMITS.opacity.min} max={SLIDER_LIMITS.opacity.max}
                  unit={SLIDER_LIMITS.opacity.unit}
                  onChange={(v) => updateConfig('opacity', v)} accentColor="var(--accent-alt)" />
                <SliderControl label="Taille" value={config.scale}
                  min={SLIDER_LIMITS.scale.min} max={SLIDER_LIMITS.scale.max}
                  unit={SLIDER_LIMITS.scale.unit}
                  onChange={(v) => updateConfig('scale', v)} accentColor="var(--accent-warm)" />
              </div>
            </section>

            {/* Carte Aperçu */}
            <section className="card" aria-labelledby="preview-title">
              <div className="card-header">
                <div className="card-title-group">
                  <Icons.Eye size={20} />
                  <h2 id="preview-title">Aperçu</h2>
                </div>
              </div>
              <div className="card-body preview-body">
                <WatermarkPreview logoPreview={logoPreview} config={config} isDark={isDark} />
                {!logoPreview && (
                  <p className="preview-hint">Chargez un logo pour voir l'aperçu</p>
                )}
              </div>
            </section>
          </div>
        </div>

        {/* === BARRE DE PROGRESSION === */}
        {isProcessing && (
          <div className="progress-section" role="status" aria-live="polite">
            <div className="progress-info">
              <Icons.Loader size={18} />
              <span>Traitement en cours... {progress}%</span>
              <span className="progress-count">
                {Math.ceil((progress / 100) * pdfUpload.files.length)}/{pdfUpload.files.length}
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }}
                role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
            </div>
          </div>
        )}

        {/* === BOUTON ACTION === */}
<div className="action-section">
          <button onClick={handleStart}
            disabled={pdfUpload.files.length === 0 || isProcessing}
            className="btn-action" aria-busy={isProcessing}>
            {isProcessing ? (
              <><Icons.Loader size={20} /><span>Traitement en cours...</span></>
            ) : (
              <><Icons.Download size={20} /><span>
                {pdfUpload.files.length <= 1
                  ? 'Télécharger le PDF protégé'
                  : `Générer le ZIP (${pdfUpload.files.length} fichiers)`
                }
              </span></>
            )}
          </button>
          {pdfUpload.files.length === 0 && !isProcessing && (
            <p className="action-hint">{MESSAGES.NO_FILES}</p>
          )}
        </div>
      </main>

      {/* === FOOTER === */}
      <footer className="footer">
        <p>ProprioFile © 2026 — La protection intelligente de vos PDF.</p>
      </footer>

      {/* === TOAST === */}
      <Toast message={toast.message} type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}

export default App;