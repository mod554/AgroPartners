import * as THREE from 'three';
import { VideoBackground } from './VideoBackground.js';
import { CameraRig } from './CameraRig.js';
import { World } from './World.js';
import { UIAnchor } from './UIAnchor.js';

/**
 * Orchestrateur de l'expérience WebGL : renderer, scène, caméra,
 * boucle de rendu optimisée et gestion du redimensionnement.
 */
export class Experience {
  /**
   * @param {Object} options
   * @param {HTMLCanvasElement} options.canvas
   * @param {{src: string, type: string}[]} options.videoSources
   * @param {HTMLElement} options.anchorElement  Wrapper du bouton BMPA
   * @param {import('../ui/ScrollManager.js').ScrollManager} options.scroll
   */
  constructor({ canvas, videoSources, anchorElement, scroll }) {
    this.canvas = canvas;
    this.scroll = scroll;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      120
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Plafonner le pixel ratio : au-delà de 2, coût GPU sans gain visuel.
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.videoBackground = new VideoBackground(this.scene, videoSources);
    // La vidéo source est lumineuse : on l'atténue côté WebGL pour
    // garantir la lisibilité du contenu superposé (voir aussi .scene-veil).
    this.scene.backgroundIntensity = 0.7;
    this.world = new World(this.scene);
    this.cameraRig = new CameraRig(this.camera);
    this.uiAnchor = new UIAnchor(anchorElement, this.world.portalAnchor);

    this.clock = new THREE.Clock();
    this._running = false;
    this._tick = this._tick.bind(this);

    window.addEventListener('resize', () => this.onResize());

    // Économie GPU : boucle suspendue quand l'onglet est masqué.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.stop();
      else this.start();
    });
  }

  onResize() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.videoBackground.onResize();
  }

  start() {
    if (this._running) return;
    this._running = true;
    this.clock.start();
    this.renderer.setAnimationLoop(this._tick);
  }

  stop() {
    this._running = false;
    this.renderer.setAnimationLoop(null);
  }

  _tick() {
    const dt = Math.min(this.clock.getDelta(), 1 / 20);
    const elapsed = this.clock.elapsedTime;

    // 1. Progression de scroll lissée → paramètre t de la courbe.
    this.scroll.update(dt);

    // 2. La vidéo d'arrière-plan avance avec le scroll (scrubbing).
    this.videoBackground.scrub(this.scroll.smooth);

    // 3. Caméra sur sa trajectoire CatmullRom.
    this.cameraRig.update(this.scroll.smooth, elapsed);

    // 4. Vie du monde (particules, jalons, portail).
    this.world.update(elapsed);

    // 5. Verrouillage du bouton HTML sur le point 3D du portail.
    this.uiAnchor.update(this.camera);

    this.renderer.render(this.scene, this.camera);
  }

  /** Prêt quand la vidéo d'arrière-plan peut s'afficher. */
  ready() {
    return this.videoBackground.ready();
  }
}
