import * as THREE from 'three';

/**
 * Caméra guidée au scroll.
 * Deux courbes THREE.CatmullRomCurve3 : l'une pour la position,
 * l'autre pour la cible du regard. La progression de scroll
 * (lissée) donne le paramètre t, lu via curve.getPoint(t).
 */
export class CameraRig {
  constructor(camera) {
    this.camera = camera;

    // Trajet : une traversée du domaine agricole qui bifurque,
    // sur le dernier tiers, vers le portail doré de la BMPA-CI.
    this.positionCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.0, 2.4, 18),
        new THREE.Vector3(2.6, 2.0, 8),
        new THREE.Vector3(-3.2, 2.6, -2),
        new THREE.Vector3(2.8, 1.8, -12),
        new THREE.Vector3(-1.6, 2.4, -22),
        new THREE.Vector3(4.0, 2.2, -30),
        new THREE.Vector3(10.5, 2.6, -37),
        // Finale : la caméra traverse le portail doré (16, 2.6, -44).
        // Une fois franchi, le point d'ancrage passe derrière la caméra
        // et le bouton BMPA disparaît naturellement (display: none).
        new THREE.Vector3(16.0, 2.6, -44),
        new THREE.Vector3(20.0, 2.6, -48.5)
      ],
      false,
      'catmullrom',
      0.5
    );

    this.lookAtCurve = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(0.0, 2.1, 6),
        new THREE.Vector3(0.0, 1.9, -4),
        new THREE.Vector3(0.0, 2.1, -14),
        new THREE.Vector3(0.5, 1.9, -24),
        new THREE.Vector3(4.0, 2.2, -34),
        new THREE.Vector3(11.0, 2.5, -41),
        new THREE.Vector3(16.0, 2.6, -44),
        new THREE.Vector3(21.0, 2.6, -49),
        new THREE.Vector3(25.0, 2.6, -53)
      ],
      false,
      'catmullrom',
      0.5
    );

    // Vecteurs réutilisés à chaque frame (zéro allocation dans la boucle).
    this._position = new THREE.Vector3();
    this._target = new THREE.Vector3();
    this._sway = new THREE.Vector3();
  }

  /**
   * @param {number} t        Progression de scroll lissée, dans [0, 1]
   * @param {number} elapsed  Temps écoulé (s), pour la dérive organique
   */
  update(t, elapsed) {
    const clamped = THREE.MathUtils.clamp(t, 0, 1);

    this.positionCurve.getPoint(clamped, this._position);
    this.lookAtCurve.getPoint(clamped, this._target);

    // Légère respiration de la caméra pour un rendu vivant.
    this._sway.set(
      Math.sin(elapsed * 0.32) * 0.12,
      Math.sin(elapsed * 0.43) * 0.08,
      0
    );

    this.camera.position.copy(this._position).add(this._sway);
    this.camera.lookAt(this._target);
  }
}
