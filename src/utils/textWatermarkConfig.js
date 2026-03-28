/**
 * ============================================================================
 * textWatermarkConfig.js — Configuration du filigrane texte (v3)
 * ============================================================================
 * 
 * Constantes, polices, couleurs et variables dynamiques
 * pour le mode filigrane texte.
 * 
 * @module textWatermarkConfig
 */

/** Configuration par défaut du filigrane texte */
export const DEFAULT_TEXT_CONFIG = {
  content: 'CONFIDENTIEL',
  fontFamily: 'Helvetica',
  fontSize: 60,
  color: '#000000',
};

/** Polices standard pdf-lib (embarquées, pas de téléchargement) */
export const STANDARD_FONTS = [
  { name: 'Helvetica', value: 'Helvetica', style: 'Sans-serif' },
  { name: 'Helvetica Bold', value: 'Helvetica-Bold', style: 'Sans-serif gras' },
  { name: 'Times Roman', value: 'TimesRoman', style: 'Serif' },
  { name: 'Times Bold', value: 'TimesRoman-Bold', style: 'Serif gras' },
  { name: 'Courier', value: 'Courier', style: 'Monospace' },
  { name: 'Courier Bold', value: 'Courier-Bold', style: 'Monospace gras' },
];

/** Google Fonts (téléchargement TTF à la volée) */
export const GOOGLE_FONTS = [
  { name: 'Roboto', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5Q.ttf', style: 'Moderne' },
  { name: 'Roboto Bold', url: 'https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlvAw.ttf', style: 'Moderne gras' },
  { name: 'Open Sans', url: 'https://fonts.gstatic.com/s/opensans/v36/memSYaGs126MiZpBA-UvWbX2vVnXBbObj2OVZyOOSr4dVJWUgsjZ0B4gaVQ.ttf', style: 'Professionnel' },
  { name: 'Playfair Display', url: 'https://fonts.gstatic.com/s/playfairdisplay/v36/nuFvD-vYSZviVYUb_rj3ij__anPXBYf9lW4e5j5hNKe1_w.ttf', style: 'Elegant' },
  { name: 'Dancing Script', url: 'https://fonts.gstatic.com/s/dancingscript/v25/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7BMSoHTeB9ptDqpw.ttf', style: 'Signature' },
  { name: 'Oswald', url: 'https://fonts.gstatic.com/s/oswald/v53/TK3_WkUHHAIjg75cFRf3bXL8LICs169vsUZiYA.ttf', style: 'Impact' },
];

/** Variables dynamiques insérables dans le texte */
export const TEXT_VARIABLES = [
  { label: 'Date', variable: '{{DATE}}', example: '26/03/2026' },
  { label: 'Année', variable: '{{YEAR}}', example: '2026' },
  { label: 'Heure', variable: '{{TIME}}', example: '14:30' },
  { label: 'Fichier', variable: '{{FILENAME}}', example: 'monCV' },
];

/** Couleurs prédéfinies */
export const COLOR_PRESETS = [
  { name: 'Noir', hex: '#000000' },
  { name: 'Gris', hex: '#6B7280' },
  { name: 'Rouge', hex: '#DC2626' },
  { name: 'Bleu', hex: '#2563EB' },
  { name: 'Violet', hex: '#7C3AED' },
  { name: 'Vert', hex: '#059669' },
];

/** Limites du slider taille de police */
export const FONT_SIZE_LIMITS = { min: 12, max: 150, unit: 'px' };

/**
 * Résoudre les variables dynamiques dans le texte.
 * @param {string} text - Texte avec {{VARIABLES}}
 * @param {string} filename - Nom du fichier PDF
 * @returns {string} Texte résolu
 */
export function resolveTextVariables(text, filename = '') {
  const now = new Date();
  const replacements = {
    '{{DATE}}': now.toLocaleDateString('fr-FR'),
    '{{YEAR}}': now.getFullYear().toString(),
    '{{TIME}}': now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
    '{{FILENAME}}': filename.replace('.pdf', ''),
  };
  let result = text;
  for (const [variable, value] of Object.entries(replacements)) {
    result = result.replaceAll(variable, value);
  }
  return result;
}
