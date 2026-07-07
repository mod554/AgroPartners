/**
 * Progression de scroll normalisée [0, 1] avec lissage exponentiel
 * (indépendant du framerate) — c'est la valeur lissée qui pilote
 * la caméra, pour une trajectoire sans à-coups.
 */
export class ScrollManager {
  constructor({ progressBar = null, damping = 4.2 } = {}) {
    this.raw = 0;
    this.smooth = 0;
    this.damping = damping;
    this.progressBar = progressBar;

    this._measure = this._measure.bind(this);
    window.addEventListener('scroll', this._measure, { passive: true });
    window.addEventListener('resize', this._measure);
    this._measure();
  }

  _measure() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    this.raw = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
  }

  /** @param {number} dt Delta temps en secondes */
  update(dt) {
    // Lissage exponentiel : stable quel que soit le framerate.
    const a = 1 - Math.exp(-this.damping * dt);
    this.smooth += (this.raw - this.smooth) * a;
    if (Math.abs(this.raw - this.smooth) < 0.0001) this.smooth = this.raw;

    if (this.progressBar) {
      this.progressBar.style.transform = `scaleX(${this.raw})`;
    }
  }
}
