import './styles/main.css';
import { Experience } from './experience/Experience.js';
import { ScrollManager } from './ui/ScrollManager.js';
import { initReveals, splitHeroTitle } from './ui/Reveal.js';

import videoUrl from './assets/agro-bg.mp4';

// --- Préparation de l'UI -------------------------------------------------
splitHeroTitle('#hero-title');
initReveals();

// --- Expérience WebGL ----------------------------------------------------
const scroll = new ScrollManager({
  progressBar: document.getElementById('progress-bar')
});

const experience = new Experience({
  canvas: document.getElementById('webgl'),
  videoUrl,
  anchorElement: document.getElementById('bmpa-anchor'),
  scroll
});

experience.start();

// --- Écran de chargement -------------------------------------------------
const loader = document.getElementById('loader');
const loaderBar = loader.querySelector('.loader__bar span');

loaderBar.style.transform = 'scaleX(0.4)';

experience.ready().then(() => {
  loaderBar.style.transform = 'scaleX(1)';

  setTimeout(() => {
    loader.classList.add('is-done');
    document.body.classList.add('is-loaded'); // déclenche la révélation du titre héros
  }, 450);
});
