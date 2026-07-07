import * as THREE from 'three';

/**
 * Arrière-plan vidéo de la scène Three.js.
 * La vidéo est projetée en VideoTexture sur `scene.background`,
 * avec un cadrage "cover" (recalculé au resize) pour couvrir
 * l'écran sans déformation quel que soit le ratio.
 */
export class VideoBackground {
  constructor(scene, url) {
    this.scene = scene;

    this.video = document.createElement('video');
    this.video.src = url;
    this.video.muted = true;
    this.video.loop = true;
    this.video.autoplay = true;
    this.video.playsInline = true;
    this.video.setAttribute('playsinline', '');
    this.video.crossOrigin = 'anonymous';
    this.video.preload = 'auto';

    this.texture = new THREE.VideoTexture(this.video);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.generateMipmaps = false;

    this.scene.background = this.texture;

    this.video.addEventListener('loadedmetadata', () => this.updateCoverFit());

    // L'autoplay muet est normalement autorisé ; on couvre le cas
    // où le navigateur exige malgré tout un geste utilisateur.
    const tryPlay = () => {
      this.video.play().catch(() => {
        const resume = () => {
          this.video.play().catch(() => {});
          window.removeEventListener('pointerdown', resume);
          window.removeEventListener('keydown', resume);
        };
        window.addEventListener('pointerdown', resume);
        window.addEventListener('keydown', resume);
      });
    };
    tryPlay();
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
  ready(timeoutMs = 5000) {
    return new Promise((resolve) => {
      if (this.video.readyState >= 2) return resolve();
      const done = () => resolve();
      this.video.addEventListener('loadeddata', done, { once: true });
      this.video.addEventListener('error', done, { once: true });
      setTimeout(done, timeoutMs);
    });
  }
}
