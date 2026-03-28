/**
 * ============================================================================
 * pdfProcessor.js — Traitement PDF v3
 * ============================================================================
 * 
 * MODES : 'image' | 'text' | 'both'
 * @module pdfProcessor
 */

import { PDFDocument, degrees, StandardFonts, rgb } from 'pdf-lib';
import { resolveTextVariables } from './textWatermarkConfig';

function toRadians(deg) { return (deg * Math.PI) / 180; }

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  return rgb(parseInt(c.substring(0, 2), 16) / 255, parseInt(c.substring(2, 4), 16) / 255, parseInt(c.substring(4, 6), 16) / 255);
}

const FONT_MAP = {
  'Helvetica': StandardFonts.Helvetica,
  'Helvetica-Bold': StandardFonts.HelveticaBold,
  'TimesRoman': StandardFonts.TimesRoman,
  'TimesRoman-Bold': StandardFonts.TimesRomanBold,
  'Courier': StandardFonts.Courier,
  'Courier-Bold': StandardFonts.CourierBold,
};

async function embedImageInPdf(pdfDoc, imageBytes, mimeType) {
  if (mimeType === 'image/png') return await pdfDoc.embedPng(imageBytes);
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return await pdfDoc.embedJpg(imageBytes);
  return await convertAndEmbed(pdfDoc, imageBytes, mimeType);
}

async function convertAndEmbed(pdfDoc, imageBytes, mimeType) {
  return new Promise((resolve, reject) => {
    const blob = new Blob([imageBytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = async () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        canvas.getContext('2d').drawImage(img, 0, 0);
        const b64 = canvas.toDataURL('image/png').split(',')[1];
        URL.revokeObjectURL(url);
        resolve(await pdfDoc.embedPng(Uint8Array.from(atob(b64), c => c.charCodeAt(0))));
      } catch (e) { URL.revokeObjectURL(url); reject(e); }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image error')); };
    img.src = url;
  });
}

const fontCache = new Map();

async function loadFont(pdfDoc, fontFamily, fontUrl) {
  if (!fontUrl) return await pdfDoc.embedFont(FONT_MAP[fontFamily] || StandardFonts.Helvetica);
  let bytes = fontCache.get(fontUrl);
  if (!bytes) {
    try {
      const res = await fetch(fontUrl);
      if (!res.ok) throw new Error('Font download failed');
      bytes = await res.arrayBuffer();
      fontCache.set(fontUrl, bytes);
    } catch (e) {
      console.warn('Font fallback Helvetica:', e);
      return await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
  }
  return await pdfDoc.embedFont(bytes);
}

function drawImageWatermark(page, logoImage, config) {
  const { width, height } = page.getSize();
  const rad = toRadians(config.rotation);
  const lw = width * (config.scale / 100);
  const lh = (logoImage.height / logoImage.width) * lw;
  const cx = width / 2, cy = height / 2;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  page.drawImage(logoImage, {
    x: cx - (lw / 2) * cos + (lh / 2) * sin,
    y: cy - (lw / 2) * sin - (lh / 2) * cos,
    width: lw, height: lh,
    rotate: degrees(config.rotation),
    opacity: config.opacity / 100,
  });
}

function drawTextWatermark(page, font, textConfig, resolvedText, config) {
  const { width, height } = page.getSize();
  const rad = toRadians(config.rotation);
  const scale = (width * (config.scale / 100)) / 600;
  const fs = textConfig.fontSize * scale;
  const tw = font.widthOfTextAtSize(resolvedText, fs);
  const cx = width / 2, cy = height / 2;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  page.drawText(resolvedText, {
    x: cx - (tw / 2) * cos + (fs / 2) * sin,
    y: cy - (tw / 2) * sin - (fs / 2) * cos,
    size: fs, font,
    color: hexToRgb(textConfig.color),
    rotate: degrees(config.rotation),
    opacity: config.opacity / 100,
  });
}

/**
 * Traiter un PDF.
 * @param {File} file
 * @param {Object} opts - { mode, logoBytes, logoMimeType, config, textConfig, fontUrl }
 */
export async function processSinglePdf(file, opts) {
  const { mode = 'image', logoBytes, logoMimeType, config, textConfig, fontUrl } = opts;
  const pdfDoc = await PDFDocument.load(new Uint8Array(await file.arrayBuffer()), {
    ignoreEncryption: true, throwOnInvalidObject: false, updateMetadata: false,
  });

  let logoImage = null;
  if ((mode === 'image' || mode === 'both') && logoBytes)
    logoImage = await embedImageInPdf(pdfDoc, logoBytes, logoMimeType);

  let font = null, resolved = '';
  if ((mode === 'text' || mode === 'both') && textConfig) {
    font = await loadFont(pdfDoc, textConfig.fontFamily, fontUrl);
    resolved = resolveTextVariables(textConfig.content, file.name);
  }

  pdfDoc.getPages().forEach(page => {
    if (logoImage) drawImageWatermark(page, logoImage, config);
    if (font && resolved) drawTextWatermark(page, font, textConfig, resolved, config);
  });

  return await pdfDoc.save();
}

export async function processMultiplePdfs(files, opts, onProgress) {
  const results = [];
  for (let i = 0; i < files.length; i++) {
    try {
      results.push({ name: `protected_${files[i].name}`, data: await processSinglePdf(files[i], opts) });
    } catch (e) {
      console.error(`Erreur ${files[i].name}:`, e);
      results.push({ name: `ERROR_${files[i].name}`, data: null, error: e.message });
    }
    if (onProgress) onProgress(Math.round(((i + 1) / files.length) * 100));
  }
  return results;
}

export async function generateZip(files) {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  files.forEach(({ name, data }) => { if (data) zip.file(name, data); });
  return await zip.generateAsync({ type: 'blob' });
}

export async function loadDefaultLogo() {
  const r = await fetch('/logo.png');
  if (!r.ok) throw new Error('Logo introuvable');
  return { bytes: await r.arrayBuffer(), mimeType: 'image/png' };
}
