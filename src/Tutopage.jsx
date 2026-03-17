/**
 * ============================================================================
 * TutoPage.jsx — Page tutoriel pour les utilisateurs
 * ============================================================================
 * 
 * Guide pas-à-pas expliquant comment utiliser ProprioFile.
 * Accessible depuis la landing page et depuis l'app.
 * 
 * Sections :
 * 1. Accéder à l'application
 * 2. Choisir son filigrane (logo)
 * 3. Importer ses PDFs
 * 4. Configurer le filigrane
 * 5. Prévisualiser le résultat
 * 6. Télécharger les fichiers protégés
 * 7. FAQ
 * 
 * @author SIYANDJI DEV EXPERT
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import './TutoPage.css';

// ============================================================================
// ICÔNES
// ============================================================================

const TutoIcons = {
  ArrowLeft: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Play: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
  ),
  Upload: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Image: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  ),
  FileText: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Sliders: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
    </svg>
  ),
  Eye: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Download: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Shield: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
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
// DONNÉES DES ÉTAPES
// ============================================================================

const STEPS = [
  {
    number: '01',
    icon: <TutoIcons.Shield />,
    title: 'Accéder à l\'application',
    content: [
      'Depuis la page d\'accueil, cliquez sur le bouton "Commencer maintenant".',
      'Vous arrivez sur l\'espace de travail avec 4 sections : Filigrane, Documents PDF, Configuration et Aperçu.',
      'Aucune inscription n\'est nécessaire. L\'application est gratuite et fonctionne directement dans votre navigateur.',
    ],
    tip: 'Vos fichiers ne sont jamais envoyés sur un serveur. Tout le traitement se fait localement sur votre appareil.',
  },
  {
    number: '02',
    icon: <TutoIcons.Image />,
    title: 'Choisir son filigrane',
    content: [
      'Dans la carte "Filigrane", cliquez sur "Choisir un logo".',
      'Sélectionnez une image depuis votre appareil. Les formats acceptés sont : PNG, JPG, WEBP et SVG.',
      'Un aperçu de votre logo apparaît immédiatement dans la carte.',
      'Si vous ne choisissez pas de logo, le logo par défaut de l\'application sera utilisé.',
    ],
    tip: 'Pour un meilleur résultat, utilisez un logo avec un fond transparent (format PNG).',
  },
  {
    number: '03',
    icon: <TutoIcons.FileText />,
    title: 'Importer ses PDFs',
    content: [
      'Dans la carte "Documents PDF", vous avez deux options :',
      '• Glissez-déposez vos fichiers PDF directement dans la zone prévue.',
      '• Ou cliquez sur la zone pour ouvrir l\'explorateur de fichiers.',
      'Vous pouvez ajouter autant de PDFs que vous voulez. Chaque fichier apparaît dans une liste avec son nom et sa taille.',
      'Pour retirer un fichier, cliquez sur la croix à côté de son nom. Pour tout supprimer, cliquez sur "Tout retirer".',
    ],
    tip: 'Seuls les fichiers .pdf sont acceptés. Les fichiers Word ou images seront ignorés.',
  },
  {
    number: '04',
    icon: <TutoIcons.Sliders />,
    title: 'Configurer le filigrane',
    content: [
      'La carte "Configuration" contient 3 réglages :',
      '• Rotation : l\'angle du filigrane sur la page (-180° à +180°). Par défaut -45° (en diagonale).',
      '• Opacité : la transparence du filigrane (1% à 100%). Par défaut 25% pour rester discret.',
      '• Taille : la taille du filigrane par rapport à la page (10% à 100%). Par défaut 70%.',
      'Déplacez les curseurs pour ajuster chaque paramètre. Le bouton "Reset" remet les valeurs par défaut.',
    ],
    tip: 'Une opacité entre 15% et 30% est idéale : le filigrane est visible sans gêner la lecture.',
  },
  {
    number: '05',
    icon: <TutoIcons.Eye />,
    title: 'Prévisualiser le résultat',
    content: [
      'La carte "Aperçu" montre en temps réel à quoi ressemblera votre filigrane sur une page.',
      'Chaque modification (rotation, opacité, taille) se reflète instantanément dans l\'aperçu.',
      'La page simulée montre des lignes grises représentant du texte, avec votre logo superposé.',
      'Cela vous permet d\'ajuster les paramètres avant de lancer le traitement.',
    ],
    tip: 'L\'aperçu n\'apparaît que si vous avez chargé un logo. Sans logo, un message vous invite à en importer un.',
  },
  {
    number: '06',
    icon: <TutoIcons.Download />,
    title: 'Télécharger les fichiers protégés',
    content: [
      'Quand tout est prêt, cliquez sur le bouton en bas de la page :',
      '• Si vous avez 1 seul PDF → le fichier protégé se télécharge directement (ex: protected_monCV.pdf).',
      '• Si vous avez plusieurs PDFs → un fichier ZIP contenant tous les PDFs protégés se télécharge.',
      'Une barre de progression indique l\'avancement du traitement.',
      'Un message de confirmation apparaît quand c\'est terminé.',
    ],
    tip: 'Le bouton change de texte selon le nombre de fichiers : "Télécharger le PDF protégé" ou "Générer le ZIP (X fichiers)".',
  },
];

// ============================================================================
// DONNÉES FAQ
// ============================================================================

const FAQ = [
  {
    q: 'Mes fichiers sont-ils envoyés sur un serveur ?',
    a: 'Non, jamais. Tout le traitement se fait dans votre navigateur grâce à la technologie pdf-lib. Vos fichiers restent sur votre appareil du début à la fin.',
  },
  {
    q: 'Quelle est la taille maximale des fichiers ?',
    a: 'Il n\'y a pas de limite stricte côté serveur puisque tout est local. Cependant, les fichiers très lourds (plus de 50 Mo) peuvent ralentir le traitement selon la puissance de votre appareil.',
  },
  {
    q: 'Quels formats de logo sont acceptés ?',
    a: 'PNG, JPG, JPEG, WEBP et SVG. Pour un résultat optimal, utilisez un PNG avec fond transparent.',
  },
  {
    q: 'Le filigrane peut-il être retiré du PDF ?',
    a: 'Le filigrane est intégré directement dans le PDF, mais il n\'offre pas une protection absolue. Un utilisateur averti pourrait l\'éditer. C\'est un dissuasif visuel, pas un DRM.',
  },
  {
    q: 'L\'application est-elle gratuite ?',
    a: 'Oui, ProprioFile est entièrement gratuit, sans inscription, sans publicité et sans limite d\'utilisation.',
  },
  {
    q: 'L\'application fonctionne-t-elle sur mobile ?',
    a: 'Oui, l\'interface est entièrement responsive et fonctionne sur smartphone et tablette. Vous pouvez même l\'ajouter à votre écran d\'accueil comme une application.',
  },
  {
    q: 'Mon PDF affiche une erreur lors du traitement, que faire ?',
    a: 'Certains PDFs protégés par mot de passe ou générés par des logiciels anciens peuvent poser problème. Essayez d\'abord de ré-exporter votre PDF depuis le logiciel d\'origine, puis réessayez.',
  },
];

// ============================================================================
// COMPOSANT : FAQ Accordion
// ============================================================================

function FaqItem({ question, answer }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-item ${isOpen ? 'faq-item--open' : ''}`}>
      <button
        className="faq-question"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span>{question}</span>
        <span className={`faq-chevron ${isOpen ? 'faq-chevron--open' : ''}`}>
          <TutoIcons.ChevronDown />
        </span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COMPOSANT PRINCIPAL
// ============================================================================

function TutoPage({ onBack, onStart, isDark, onToggleTheme }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`tuto ${isVisible ? 'tuto--visible' : ''}`}>

      {/* === NAVBAR === */}
      <nav className="tuto-nav">
        <div className="tuto-nav-inner">
          <button onClick={onBack} className="tuto-back-btn" aria-label="Retour">
            <TutoIcons.ArrowLeft />
            <span>Retour</span>
          </button>
          <div className="tuto-nav-actions">
            <button onClick={onToggleTheme} className="tuto-theme-btn"
              aria-label={isDark ? 'Mode clair' : 'Mode sombre'}>
              {isDark ? <TutoIcons.Sun /> : <TutoIcons.Moon />}
            </button>
            <button onClick={onStart} className="tuto-start-btn">
              <TutoIcons.Play />
              <span>Lancer l'app</span>
            </button>
          </div>
        </div>
      </nav>

      {/* === HERO === */}
      <header className="tuto-hero">
        <div className="tuto-hero-inner">
          <span className="tuto-label anim-item" style={{ '--delay': '0s' }}>Guide d'utilisation</span>
          <h1 className="tuto-title anim-item" style={{ '--delay': '0.1s' }}>
            Comment utiliser <span className="tuto-title-accent">ProprioFile</span>
          </h1>
          <p className="tuto-subtitle anim-item" style={{ '--delay': '0.2s' }}>
            6 étapes simples pour protéger vos documents PDF avec un filigrane personnalisé.
          </p>
        </div>
      </header>

      {/* === ÉTAPES === */}
      <main className="tuto-steps">
        <div className="tuto-steps-inner">
          {STEPS.map((step, i) => (
            <section
              key={i}
              className="tuto-step anim-item"
              style={{ '--delay': `${0.1 * i}s` }}
            >
              {/* Numéro et icône */}
              <div className="tuto-step-header">
                <span className="tuto-step-number">{step.number}</span>
                <div className="tuto-step-icon">{step.icon}</div>
              </div>

              {/* Contenu */}
              <div className="tuto-step-body">
                <h2 className="tuto-step-title">{step.title}</h2>
                <div className="tuto-step-content">
                  {step.content.map((line, j) => (
                    <p key={j}>{line}</p>
                  ))}
                </div>
                {step.tip && (
                  <div className="tuto-step-tip">
                    <span className="tuto-tip-label">Astuce</span>
                    <p>{step.tip}</p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* === FAQ === */}
      <section className="tuto-faq">
        <div className="tuto-faq-inner">
          <h2 className="tuto-faq-title">Questions fréquentes</h2>
          <div className="tuto-faq-list">
            {FAQ.map((item, i) => (
              <FaqItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>

      {/* === CTA === */}
      <section className="tuto-cta">
        <div className="tuto-cta-inner">
          <h2>Prêt à commencer ?</h2>
          <p>Protégez vos PDFs en quelques secondes.</p>
          <button onClick={onStart} className="tuto-cta-btn">
            <span>Lancer ProprioFile</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </button>
        </div>
      </section>

      {/* === FOOTER === */}
      <footer className="tuto-footer">
        <p>ProprioFile © 2026 — Conçu par <strong>SIYANDJI DEV EXPERT</strong></p>
      </footer>
    </div>
  );
}

export default TutoPage;