import * as THREE from 'three';

/**
 * UI-Locking : verrouille un élément HTML sur un point 3D de la scène.
 *
 * À chaque frame, le point est projeté en coordonnées NDC via
 * `v.project(camera)` (valeurs de -1 à 1), puis converti en pixels :
 *
 *   x = (v.x *  0.5 + 0.5) * window.innerWidth
 *   y = (-v.y * 0.5 + 0.5) * window.innerHeight
 *
 * Si le point passe derrière la caméra, l'élément est masqué
 * (display: none).
 */
export class UIAnchor {
  /**
   * @param {HTMLElement} element   Wrapper HTML à positionner
   * @param {THREE.Vector3} point3D Point de la scène à suivre
   */
  constructor(element, point3D) {
    this.element = element;
    this.point3D = point3D;
    this._v = new THREE.Vector3();
    this._visible = null; // état mémorisé pour éviter les écritures DOM inutiles
  }

  update(camera) {
    // Coordonnées NDC : v.project(camera) → [-1, 1]
    this._v.copy(this.point3D).project(camera);

    // Derrière la caméra, la division perspective (w négatif) projette
    // le point au-delà du plan far : NDC z > 1.
    const behind = this._v.z > 1;

    if (behind) {
      if (this._visible !== false) {
        this.element.style.display = 'none';
        this._visible = false;
      }
      return;
    }

    if (this._visible !== true) {
      this.element.style.display = '';
      this._visible = true;
    }

    // Conversion NDC → pixels (formule stricte).
    const x = (this._v.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-this._v.y * 0.5 + 0.5) * window.innerHeight;

    // Le wrapper est positionné via left/top ; le transform de centrage
    // vit en CSS et le hover (scale + lueur) reste 100 % CSS sur le
    // bouton interne, sans conflit.
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
  }
}
