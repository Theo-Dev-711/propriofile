/**
 * ============================================================================
 * fileHelpers.js — Utilitaires de gestion de fichiers
 * ============================================================================
 * 
 * Fonctions utilitaires pour la manipulation de fichiers côté client :
 * - Formatage des tailles
 * - Validation des types
 * - Lecture de fichiers en différents formats
 * 
 * @module fileHelpers
 */

import { ACCEPTED_IMAGE_TYPES, MAX_FILE_SIZE } from './constants';

/**
 * Formater une taille de fichier en unité lisible.
 * 
 * @param {number} bytes - Taille en octets
 * @returns {string} Taille formatée (ex: "1.5 Mo", "340 Ko")
 * 
 * @example
 * formatFileSize(1536)     // "1.5 Ko"
 * formatFileSize(2097152)  // "2.0 Mo"
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 o';

  const units = ['o', 'Ko', 'Mo', 'Go'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

/**
 * Vérifier si un type MIME est accepté pour le logo.
 * 
 * @param {string} mimeType - Type MIME à vérifier
 * @returns {boolean} true si le type est accepté
 */
export function isAcceptedImageType(mimeType) {
  return ACCEPTED_IMAGE_TYPES.includes(mimeType);
}

/**
 * Vérifier si un fichier ne dépasse pas la taille maximale.
 * 
 * @param {File} file - Fichier à vérifier
 * @returns {boolean} true si la taille est acceptable
 */
export function isFileSizeValid(file) {
  return file.size <= MAX_FILE_SIZE;
}

/**
 * Lire un fichier en tant que ArrayBuffer.
 * Encapsulation de FileReader en Promise.
 * 
 * @param {File} file - Fichier à lire
 * @returns {Promise<ArrayBuffer>} Contenu binaire du fichier
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Erreur de lecture : ${file.name}`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Lire un fichier en tant que Data URL (base64).
 * Utile pour les aperçus d'images.
 * 
 * @param {File} file - Fichier à lire
 * @returns {Promise<string>} Data URL du fichier
 */
export function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Erreur de lecture : ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * Extraire l'extension d'un nom de fichier.
 * 
 * @param {string} filename - Nom du fichier
 * @returns {string} Extension en minuscules (sans le point)
 * 
 * @example
 * getFileExtension('document.pdf')  // 'pdf'
 * getFileExtension('logo.PNG')      // 'png'
 */
export function getFileExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

/**
 * Générer un nom de fichier unique pour l'export.
 * Format : "glearn_pack_TIMESTAMP.zip"
 * 
 * @returns {string} Nom de fichier unique
 */
export function generateExportFilename() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `glearn_pack_${timestamp}.zip`;
}

/**
 * Déclencher le téléchargement d'un Blob.
 * Crée un lien temporaire et simule un clic.
 * 
 * @param {Blob} blob - Contenu à télécharger
 * @param {string} filename - Nom du fichier de téléchargement
 */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
