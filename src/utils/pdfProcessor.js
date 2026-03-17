/**
 * ============================================================================
 * pdfProcessor.js — Utilitaire de traitement PDF
 * ============================================================================
 * 
 * Ce module encapsule toute la logique de manipulation PDF :
 * - Chargement des fichiers PDF existants
 * - Intégration du filigrane (logo) sur chaque page
 * - Gestion des différents formats d'image
 * - Export en bytes pour archivage ZIP
 * 
 * DÉPENDANCES :
 * - pdf-lib : manipulation PDF côté client
 * 
 * USAGE :
 *   import { processSinglePdf, processMultiplePdfs } from './pdfProcessor';
 *   const result = await processSinglePdf(file, logoBytes, logoMimeType, config);
 * 
 * @module pdfProcessor
 */

import { PDFDocument, degrees } from 'pdf-lib';

/**
 * Convertir des degrés en radians.
 * Utilisé pour les calculs trigonométriques de positionnement.
 * 
 * @param {number} deg - Angle en degrés
 * @returns {number} Angle en radians
 */
function toRadians(deg) {
  return (deg * Math.PI) / 180;
}

/**
 * Détecter le type MIME d'une image à partir de ses premiers octets.
 * Utile quand le type MIME du fichier n'est pas fiable.
 * 
 * @param {ArrayBuffer} buffer - Contenu binaire de l'image
 * @returns {string} Type MIME détecté
 */
function detectImageType(buffer) {
  const arr = new Uint8Array(buffer).subarray(0, 4);
  let header = '';
  for (let i = 0; i < arr.length; i++) {
    header += arr[i].toString(16).padStart(2, '0');
  }

  // Signatures magiques des formats d'image
  if (header.startsWith('89504e47')) return 'image/png';
  if (header.startsWith('ffd8ff')) return 'image/jpeg';
  if (header.startsWith('52494646')) return 'image/webp';
  
  // SVG commence par '<' ou '<?xml'
  const text = new TextDecoder().decode(new Uint8Array(buffer).subarray(0, 100));
  if (text.trim().startsWith('<svg') || text.trim().startsWith('<?xml')) {
    return 'image/svg+xml';
  }

  return 'image/png'; // Fallback
}

/**
 * Intégrer une image dans un document PDF selon son type.
 * 
 * pdf-lib supporte nativement PNG et JPEG.
 * Pour les autres formats (WEBP, SVG), on convertit d'abord en PNG
 * via un canvas offscreen.
 * 
 * @param {PDFDocument} pdfDoc - Document PDF cible
 * @param {ArrayBuffer} imageBytes - Contenu binaire de l'image
 * @param {string} mimeType - Type MIME de l'image
 * @returns {Promise<PDFImage>} Image intégrée dans le PDF
 */
async function embedImageInPdf(pdfDoc, imageBytes, mimeType) {
  // PNG : support natif pdf-lib
  if (mimeType === 'image/png') {
    return await pdfDoc.embedPng(imageBytes);
  }

  // JPEG : support natif pdf-lib
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return await pdfDoc.embedJpg(imageBytes);
  }

  // WEBP, SVG et autres : conversion en PNG via canvas
  return await convertAndEmbed(pdfDoc, imageBytes, mimeType);
}

/**
 * Convertir une image non-supportée en PNG via un canvas offscreen,
 * puis l'intégrer dans le PDF.
 * 
 * @param {PDFDocument} pdfDoc - Document PDF cible
 * @param {ArrayBuffer} imageBytes - Contenu binaire de l'image originale
 * @param {string} mimeType - Type MIME original
 * @returns {Promise<PDFImage>} Image PNG intégrée
 */
async function convertAndEmbed(pdfDoc, imageBytes, mimeType) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageBytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        const pngDataUrl = canvas.toDataURL('image/png');
        const pngBase64 = pngDataUrl.split(',')[1];
        const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));

        const embedded = await pdfDoc.embedPng(pngBytes);
        URL.revokeObjectURL(url);
        resolve(embedded);
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Impossible de charger l'image (${mimeType})`));
    };

    img.src = url;
  });
}

/**
 * Traiter un seul fichier PDF en y appliquant le filigrane.
 * 
 * ⚠️  CORRECTION IMPORTANTE (v2.1) :
 * - Conversion explicite en Uint8Array avant PDFDocument.load()
 *   pour éviter l'erreur "No PDF header found"
 * - Options de tolérance pour les PDFs mal formés
 * 
 * @param {File} file - Fichier PDF à traiter
 * @param {ArrayBuffer} logoBytes - Contenu binaire du logo
 * @param {string} logoMimeType - Type MIME du logo
 * @param {Object} config - Configuration du filigrane
 * @param {number} config.rotation - Angle de rotation (degrés)
 * @param {number} config.opacity - Opacité (0-100)
 * @param {number} config.scale - Taille relative (%)
 * @returns {Promise<Uint8Array>} PDF modifié en bytes
 */
export async function processSinglePdf(file, logoBytes, logoMimeType, config) {
  // ✅ FIX : Convertir en Uint8Array explicitement
  // ArrayBuffer brut peut causer "No PDF header found" sur certains PDFs
  const existingPdfBytes = new Uint8Array(await file.arrayBuffer());

  // ✅ FIX : Options de tolérance pour PDFs générés par Word, Canva, etc.
  const pdfDoc = await PDFDocument.load(existingPdfBytes, {
    ignoreEncryption: true,
    throwOnInvalidObject: false,
    updateMetadata: false,
  });

  // Intégrer le logo selon son format
  const logoImage = await embedImageInPdf(pdfDoc, logoBytes, logoMimeType);

  // Préparer la rotation
  const rotationAngle = degrees(config.rotation);
  const angleRad = toRadians(config.rotation);

  // Appliquer le filigrane sur chaque page
  const pages = pdfDoc.getPages();

  pages.forEach((page) => {
    const { width, height } = page.getSize();

    // Dimensions du logo proportionnelles à la page
    const logoWidth = width * (config.scale / 100);
    const logoHeight = (logoImage.height / logoImage.width) * logoWidth;

    // Centrage avec compensation trigonométrique de la rotation
    const centerX = width / 2;
    const centerY = height / 2;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const startX = centerX - (logoWidth / 2) * cosA + (logoHeight / 2) * sinA;
    const startY = centerY - (logoWidth / 2) * sinA - (logoHeight / 2) * cosA;

    // Dessiner le filigrane
    page.drawImage(logoImage, {
      x: startX,
      y: startY,
      width: logoWidth,
      height: logoHeight,
      rotate: rotationAngle,
      opacity: config.opacity / 100,
    });
  });

  return await pdfDoc.save();
}

/**
 * Traiter plusieurs fichiers PDF en batch.
 * Appelle processSinglePdf pour chaque fichier.
 * 
 * @param {File[]} files - Liste des fichiers PDF
 * @param {ArrayBuffer} logoBytes - Contenu binaire du logo
 * @param {string} logoMimeType - Type MIME du logo
 * @param {Object} config - Configuration du filigrane
 * @param {Function} onProgress - Callback (pourcentage: number) => void
 * @returns {Promise<Array<{name: string, data: Uint8Array}>>} PDFs traités
 */
export async function processMultiplePdfs(
  files,
  logoBytes,
  logoMimeType,
  config,
  onProgress
) {
  const results = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    try {
      const modifiedPdf = await processSinglePdf(
        files[i],
        logoBytes,
        logoMimeType,
        config
      );

      results.push({
        name: `protected_${files[i].name}`,
        data: modifiedPdf,
      });
    } catch (error) {
      console.error(`Erreur sur ${files[i].name}:`, error);
      results.push({
        name: `ERROR_${files[i].name}`,
        data: null,
        error: error.message,
      });
    }

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
  }

  return results;
}

/**
 * Générer un ZIP contenant tous les PDFs traités.
 * Utilisé uniquement quand il y a 2+ fichiers.
 * 
 * @param {Array<{name: string, data: Uint8Array}>} processedFiles
 * @returns {Promise<Blob>} Archive ZIP en blob
 */
export async function generateZip(processedFiles) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  processedFiles.forEach(({ name, data }) => {
    if (data) {
      zip.file(name, data);
    }
  });

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Charger le logo par défaut depuis le dossier public.
 * Fallback si aucun logo personnalisé n'est fourni.
 * 
 * @returns {Promise<{bytes: ArrayBuffer, mimeType: string}>}
 */
export async function loadDefaultLogo() {
  const response = await fetch('/logo.png');
  if (!response.ok) {
    throw new Error('Logo par défaut introuvable dans /public/logo.png');
  }

  const bytes = await response.arrayBuffer();
  return {
    bytes,
    mimeType: 'image/png',
  };
}