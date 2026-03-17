/**
 * ============================================================================
 * LandingPage.jsx — Page de présentation ProprioFile
 * ============================================================================
 * 
 * Landing page moderne avec :
 * - Hero section avec animation d'entrée
 * - Section fonctionnalités avec cards animées
 * - Section "Comment ça marche" en 3 étapes
 * - Bouton CTA "Commencer" qui redirige vers l'app
 * - Support dark/light mode
 * - Animations CSS staggerées au chargement
 * 
 * @author SIYANDJI DEV EXPERT
 * @version 1.0.0
 */

import { useEffect, useState } from 'react';
import './LandingPage.css';

// ============================================================================
// ICÔNES SVG INLINE
// ============================================================================

const LandingIcons = {
  Shield: () => (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Zap: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Eye: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Lock: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Sliders: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  Image: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  Download: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Upload: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Settings: () => (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Sun: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
};


// ============================================================================
// DONNÉES STATIQUES
// ============================================================================

/** Fonctionnalités affichées dans les cards */
const FEATURES = [
  {
    icon: <LandingIcons.Lock />,
    title: 'Protection filigrane',
    desc: 'Appliquez votre logo en filigrane sur chaque page de vos PDFs en un instant.',
  },
  {
    icon: <LandingIcons.Eye />,
    title: 'Preview en temps réel',
    desc: 'Visualisez le résultat avant de générer. Ajustez rotation, opacité et taille.',
  },
  {
    icon: <LandingIcons.Sliders />,
    title: 'Configuration avancée',
    desc: 'Contrôle total sur votre filigrane : rotation -180° à +180°, opacité, taille.',
  },
  {
    icon: <LandingIcons.Image />,
    title: 'Multi-format logo',
    desc: 'Importez votre logo en PNG, JPG, WEBP ou SVG. On gère la conversion.',
  },
  {
    icon: <LandingIcons.Zap />,
    title: 'Traitement rapide',
    desc: 'Tout se passe dans votre navigateur. Aucun upload serveur, zéro latence.',
  },
  {
    icon: <LandingIcons.Download />,
    title: 'Export intelligent',
    desc: '1 fichier → PDF direct. Plusieurs fichiers → ZIP automatique.',
  },
];

/** Étapes "Comment ça marche" */
const STEPS = [
  {
    number: '01',
    icon: <LandingIcons.Upload />,
    title: 'Importez',
    desc: 'Glissez vos PDFs et choisissez votre logo filigrane.',
  },
  {
    number: '02',
    icon: <LandingIcons.Settings />,
    title: 'Configurez',
    desc: 'Ajustez la rotation, l\'opacité et la taille avec la preview live.',
  },
  {
    number: '03',
    icon: <LandingIcons.Download />,
    title: 'Téléchargez',
    desc: 'Récupérez vos PDFs protégés en un clic.',
  },
];


// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

function LandingPage({ onStart, onTuto, isDark, onToggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);

  /** Déclencher les animations d'entrée après le montage */
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`landing ${isVisible ? 'landing--visible' : ''}`}>

      {/* ============================================================ */}
      {/* NAVBAR                                                       */}
      {/* ============================================================ */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <LandingIcons.Shield />
            <span className="landing-logo-text">ProprioFile</span>
          </div>
          <div className="landing-nav-actions">
            <button
              onClick={onToggleTheme}
              className="landing-theme-btn"
              aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
            >
              {isDark ? <LandingIcons.Sun /> : <LandingIcons.Moon />}
            </button>
            <button onClick={onTuto} className="landing-theme-btn"
              style={{ width: 'auto', padding: '0 14px', fontSize: '0.82rem', fontWeight: 500 }}>
              Tutoriel
            </button>
            <button onClick={onStart} className="landing-nav-cta">
              Commencer
              <LandingIcons.ArrowRight />
            </button>
          </div>
        </div>
      </nav>

      {/* ============================================================ */}
      {/* HERO SECTION                                                 */}
      {/* ============================================================ */}
      <section className="hero">
        {/* Grille décorative en arrière-plan */}
        <div className="hero-grid" aria-hidden="true" />
        {/* Orbe lumineux */}
        <div className="hero-orb hero-orb--1" aria-hidden="true" />
        <div className="hero-orb hero-orb--2" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-badge anim-item" style={{ '--delay': '0s' }}>
            <LandingIcons.CheckCircle />
            <span>100% côté client — vos fichiers restent privés</span>
          </div>

          <h1 className="hero-title anim-item" style={{ '--delay': '0.1s' }}>
            La protection<br />
            <span className="hero-title-accent">intelligente</span> de vos PDF.
          </h1>

          <p className="hero-subtitle anim-item" style={{ '--delay': '0.2s' }}>
            Appliquez un filigrane personnalisé sur tous vos documents en quelques secondes.
            Aucun serveur, aucune inscription, tout se passe dans votre navigateur.
          </p>

          <div className="hero-actions anim-item" style={{ '--delay': '0.3s' }}>
            <button onClick={onStart} className="btn-start">
              <span>Commencer maintenant</span>
              <LandingIcons.ArrowRight />
            </button>
            <span className="hero-free">Gratuit et sans inscription</span>
          </div>

          {/* Mockup flottant */}
          <div className="hero-mockup anim-item" style={{ '--delay': '0.5s' }}>
            <div className="mockup-window">
              <div className="mockup-toolbar">
                <span className="mockup-dot" />
                <span className="mockup-dot" />
                <span className="mockup-dot" />
                <span className="mockup-title">ProprioFile — Workspace</span>
              </div>
              <div className="mockup-body">
                <div className="mockup-sidebar">
                  <div className="mockup-block mockup-block--logo" />
                  <div className="mockup-block mockup-block--files" />
                </div>
                <div className="mockup-main">
                  <div className="mockup-page">
                    <div className="mockup-lines">
                      <span /><span /><span /><span /><span /><span /><span />
                    </div>
                    <div className="mockup-watermark">P</div>
                  </div>
                  <div className="mockup-sliders">
                    <div className="mockup-slider"><span style={{ width: '38%' }} /></div>
                    <div className="mockup-slider"><span style={{ width: '25%' }} /></div>
                    <div className="mockup-slider"><span style={{ width: '70%' }} /></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FEATURES                                                     */}
      {/* ============================================================ */}
      <section className="features" id="features">
        <div className="features-inner">
          <h2 className="section-title">Tout ce qu'il vous faut</h2>
          <p className="section-subtitle">
            Une app simple, puissante et respectueuse de votre vie privée.
          </p>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <div
                key={i}
                className="feature-card"
                style={{ '--card-delay': `${i * 0.08}s` }}
              >
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* HOW IT WORKS                                                 */}
      {/* ============================================================ */}
      <section className="steps-section">
        <div className="steps-inner">
          <h2 className="section-title">Comment ça marche</h2>
          <p className="section-subtitle">Trois étapes, zéro complication.</p>

          <div className="steps-grid">
            {STEPS.map((s, i) => (
              <div key={i} className="step-card" style={{ '--step-delay': `${i * 0.15}s` }}>
                <span className="step-number">{s.number}</span>
                <div className="step-icon">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================================ */}
      {/* CTA FINAL                                                    */}
      {/* ============================================================ */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Prêt à protéger vos documents ?</h2>
          <p className="cta-desc">
            Aucune inscription. Aucun upload serveur. Vos fichiers ne quittent jamais votre appareil.
          </p>
          <button onClick={onStart} className="btn-start btn-start--lg">
            <span>Lancer ProprioFile</span>
            <LandingIcons.ArrowRight />
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* FOOTER                                                       */}
      {/* ============================================================ */}
      <footer className="landing-footer">
        <p>ProprioFile © 2026 — Conçu par <strong>SIYANDJI DEV EXPERT</strong></p>
      </footer>
    </div>
  );
}

export default LandingPage;