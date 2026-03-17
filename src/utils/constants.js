/**
 * ============================================================================
 * constants.js — Constantes globales de l'application
 * ============================================================================
 * 
 * Centralise toutes les valeurs de configuration utilisées
 * à travers l'application. Modifier ici = modifier partout.
 * 
 * @module constants
 */

/** Configuration par défaut du filigrane */
export const DEFAULT_WATERMARK_CONFIG = {
  rotation: -45,    // Angle de rotation (degrés)
  opacity: 25,      // Opacité (0-100)
  scale: 70,        // Taille relative à la page (%)
};

/** Limites des sliders */
export const SLIDER_LIMITS = {
  rotation: { min: -180, max: 180, unit: '°' },
  opacity:  { min: 1,    max: 100, unit: '%' },
  scale:    { min: 10,   max: 100, unit: '%' },
};

/** Types MIME acceptés pour le logo */
export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
];

/** Extensions de fichiers image acceptées (pour l'attribut accept) */
export const ACCEPTED_IMAGE_EXTENSIONS = '.png,.jpg,.jpeg,.webp,.svg';

/** Type MIME accepté pour les documents */
export const ACCEPTED_PDF_TYPES = ['application/pdf'];

/** Clé localStorage pour le thème */
export const THEME_STORAGE_KEY = 'Propriofile-theme';

/** Durée d'affichage des toasts (ms) */
export const TOAST_DURATION = 4000;

/** Taille maximale de fichier (50 Mo) */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Messages d'erreur centralisés.
 * Facilite la traduction future (i18n).
 */
export const MESSAGES = {
  LOGO_FORMAT_ERROR: 'Format non supporté. Utilisez PNG, JPG, WEBP ou SVG.',
  LOGO_RESET: 'Logo réinitialisé',
  CONFIG_RESET: 'Configuration réinitialisée',
  DOCS_RESET: 'Documents supprimés',
  PROCESS_SUCCESS: (count) => `${count} fichier(s) traité(s) avec succès !`,
  PROCESS_ERROR: 'Erreur lors du traitement. Veuillez réessayer.',
  DEFAULT_LOGO_NOT_FOUND: 'Logo par défaut introuvable dans /public/logo.png',
  FILE_TOO_LARGE: (name) => `${name} dépasse la taille maximale (50 Mo)`,
  NO_FILES: 'Sélectionnez au moins un fichier PDF pour commencer',
};
