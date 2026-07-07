import * as THREE from 'three';

/**
 * Arrière-plan vidéo de la scène Three.js, piloté par le scroll.
 *
 * La vidéo est projetée en VideoTexture sur `scene.background` avec un
 * cadrage "cover" (recalculé au resize). Elle ne joue jamais toute seule :
 * sa tête de lecture est asservie à la progression du scroll via
 * `scrub(t)` → `video.currentTime = t * durée`.
 *
 * Pour un scrubbing parfaitement fluide dans les deux sens :
 *  - le fichier est encodé avec une image-clé toutes les 6 frames ;
 *  - la source compatible est choisie via canPlayType puis téléchargée
 *    en Blob : toutes les données sont en mémoire, chaque seek est
 *    instantané (aucune dépendance aux requêtes réseau partielles).
 */
export class VideoBackground {
  /**
   * @param {THREE.Scene} scene
   * @param {{src: string, type: string}[]} sources  Ordre = priorité
   */
  constructor(scene, sources) {
    this.scene = scene;
    this.duration = 0;

    this.video = document.createElement('video');
    this.video.muted = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    this.video.preload = 'auto';

    this.texture = new THREE.VideoTexture(this.video);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.scene.background = this.texture;

    this.video.addEventListener('loadedmetadata', () => {
      this.duration = this.video.duration || 0;
      this.updateCoverFit();
    });

    this._load(sources);
  }

  /** Choisit la première source décodable puis la charge en Blob. */
  async _load(sources) {
    let chosen = sources[0];
    for (const s of sources) {
      if (this.video.canPlayType(s.type)) {
        chosen = s;
        break;
      }
    }

    try {
      const response = await fetch(chosen.src);
      const blob = await response.blob();
      this.video.src = URL.createObjectURL(blob);
    } catch {
      // Réseau indisponible pour le fetch : lecture directe en flux.
      this.video.src = chosen.src;
    }

    this.video.load();
    this.video.pause();
  }

  /**
   * Asservit la tête de lecture à la progression du scroll (lissée).
   * Appelé à chaque frame de rendu.
   * @param {number} t Progression dans [0, 1]
   */
  scrub(t) {
    if (!this.duration) return;

    // On s'arrête un peu avant la fin pour éviter l'état "ended".
    const target = Math.min(Math.max(t, 0), 1) * Math.max(this.duration - 0.08, 0);

    // Un seul seek à la fois ; le RAF suivant rattrape la cible.
    if (this.video.seeking) return;

    // Seuil d'une frame (24 fps) : évite les seeks redondants.
    if (Math.abs(this.video.currentTime - target) > 1 / 24) {
      this.video.currentTime = target;
    }
  }

  /** Recadre la texture façon `object-fit: cover`. */
  updateCoverFit() {
    const vw = this.video.videoWidth;
    const vh = this.video.videoHeight;
    if (!vw || !vh) return;

    const videoAspect = vw / vh;
    const screenAspect = window.innerWidth / window.innerHeight;

    if (screenAspect > videoAspect) {
      // Écran plus large que la vidéo : on rogne le haut/bas.
      const r = videoAspect / screenAspect;
      this.texture.repeat.set(1, r);
      this.texture.offset.set(0, (1 - r) / 2);
    } else {
      // Écran plus haut que la vidéo : on rogne les côtés.
      const r = screenAspect / videoAspect;
      this.texture.repeat.set(r, 1);
      this.texture.offset.set((1 - r) / 2, 0);
    }
  }

  onResize() {
    this.updateCoverFit();
  }

  /** Promesse résolue dès que la vidéo peut être affichée. */
  ready(timeoutMs = 8000) {
    return new Promise((resolve) => {
      if (this.video.readyState >= 2) return resolve();
      const done = () => resolve();
      this.video.addEventListener('loadeddata', done, { once: true });
      this.video.addEventListener('error', done, { once: true });
      setTimeout(done, timeoutMs);
    });
  }
}
