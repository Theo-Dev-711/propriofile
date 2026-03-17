/**
 * ============================================================================
 * main.jsx — Point d'entrée de l'application ProprioFile
 * ============================================================================
 * 
 * Gère la navigation entre :
 * - LandingPage : page de présentation (route par défaut)
 * - TutoPage : page tutoriel (comment utiliser l'app)
 * - App : zone de travail (après clic sur "Commencer")
 * 
 * Utilise un état local simple au lieu de react-router
 * pour éviter une dépendance supplémentaire.
 * 
 * Le thème (dark/light) est partagé entre toutes les pages.
 */

import React, { useState, useCallback, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import LandingPage from './LandingPage';
import TutoPage from './TutoPage';
import App from './App';

/** Clé localStorage pour la persistance du thème */
const THEME_KEY = 'Propriofile-theme';

/**
 * Composant racine qui orchestre la navigation.
 * 
 * 3 pages possibles :
 * - 'landing' → LandingPage.jsx (présentation)
 * - 'tuto'    → TutoPage.jsx (tutoriel utilisateur)
 * - 'app'     → App.jsx (zone de travail)
 */
function Root() {
  // --- Navigation simple par état ---
  const [currentPage, setCurrentPage] = useState('landing');

  // --- Thème partagé entre toutes les pages ---
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved !== null) return saved === 'dark';
    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  /** Appliquer le thème au document */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  /** Naviguer vers l'app (zone de travail) */
  const goToApp = useCallback(() => {
    setCurrentPage('app');
    window.scrollTo(0, 0);
  }, []);

  /** Retourner à la landing */
  const goToLanding = useCallback(() => {
    setCurrentPage('landing');
    window.scrollTo(0, 0);
  }, []);

  /** Naviguer vers le tutoriel */
  const goToTuto = useCallback(() => {
    setCurrentPage('tuto');
    window.scrollTo(0, 0);
  }, []);

  // --- Rendu conditionnel ---
  if (currentPage === 'app') {
    return <App onBack={goToLanding} />;
  }

  if (currentPage === 'tuto') {
    return (
      <TutoPage
        onBack={goToLanding}
        onStart={goToApp}
        isDark={isDark}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <LandingPage
      onStart={goToApp}
      onTuto={goToTuto}
      isDark={isDark}
      onToggleTheme={toggleTheme}
    />
  );
}

// --- Montage React ---
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);