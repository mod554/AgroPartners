import * as THREE from 'three';

const GOLD = 0xe9c35e;
const GREEN = 0x1d7a58;

/** Sprite circulaire doux généré en canvas (pour les particules). */
function makeGlowSprite() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 244, 214, 1)');
  g.addColorStop(0.4, 'rgba(233, 195, 94, 0.55)');
  g.addColorStop(1, 'rgba(233, 195, 94, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Contenu 3D de la scène : poussière dorée en suspension,
 * jalons géométriques le long du parcours, et portail BMPA-CI
 * (le point d'ancrage 3D du bouton HTML).
 */
export class World {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.scene.add(this.group);

    this._buildLights();
    this._buildParticles();
    this._buildMilestones();
    this._buildPortal();
  }

  _buildLights() {
    this.group.add(new THREE.AmbientLight(0xdfe8d9, 0.55));

    const sun = new THREE.DirectionalLight(0xfff3d0, 1.1);
    sun.position.set(6, 12, 4);
    this.group.add(sun);

    // Lueur dorée émanant du portail BMPA.
    this.portalLight = new THREE.PointLight(GOLD, 40, 30, 2);
    this.portalLight.position.set(16, 2.6, -44);
    this.group.add(this.portalLight);
  }

  _buildParticles() {
    const count = 1300;
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = THREE.MathUtils.randFloatSpread(46) + 2; // x
      positions[i * 3 + 1] = THREE.MathUtils.randFloat(0.2, 9);      // y
      positions[i * 3 + 2] = THREE.MathUtils.randFloat(-52, 22);     // z
      seeds[i] = Math.random() * Math.PI * 2;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this._particleSeeds = seeds;
    this._particleBase = positions.slice();

    const material = new THREE.PointsMaterial({
      size: 0.22,
      map: makeGlowSprite(),
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      color: GOLD
    });

    this.particles = new THREE.Points(geometry, material);
    this.group.add(this.particles);
  }

  _buildMilestones() {
    // Jalons géométriques "agro-tech" qui rythment la descente.
    this.milestones = [];

    const defs = [
      { geo: new THREE.IcosahedronGeometry(1.1, 0), pos: [-5.5, 3.2, 2], speed: 0.25 },
      { geo: new THREE.TorusKnotGeometry(0.8, 0.22, 96, 12), pos: [5.8, 2.6, -7], speed: 0.18 },
      { geo: new THREE.OctahedronGeometry(1.2, 0), pos: [-5.2, 2.2, -17], speed: 0.3 },
      { geo: new THREE.DodecahedronGeometry(1.0, 0), pos: [6.2, 3.4, -26], speed: 0.22 }
    ];

    const wireMat = new THREE.MeshBasicMaterial({
      color: GOLD,
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const coreMat = new THREE.MeshStandardMaterial({
      color: GREEN,
      emissive: GREEN,
      emissiveIntensity: 0.35,
      roughness: 0.3,
      metalness: 0.6,
      transparent: true,
      opacity: 0.55
    });

    for (const def of defs) {
      const holder = new THREE.Group();
      holder.position.set(...def.pos);

      const wire = new THREE.Mesh(def.geo, wireMat);
      const core = new THREE.Mesh(def.geo, coreMat);
      core.scale.setScalar(0.55);
      holder.add(wire, core);

      holder.userData.speed = def.speed;
      holder.userData.baseY = def.pos[1];
      this.milestones.push(holder);
      this.group.add(holder);
    }
  }

  _buildPortal() {
    // Le portail doré : point d'ancrage 3D du bouton "Accéder à la BMPA-CI".
    this.portal = new THREE.Group();
    this.portal.position.set(16, 2.6, -44);

    const ringMat = new THREE.MeshStandardMaterial({
      color: GOLD,
      emissive: GOLD,
      emissiveIntensity: 1.6,
      roughness: 0.25,
      metalness: 0.85
    });

    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.07, 24, 96), ringMat);
    const innerRing = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.03, 16, 96), ringMat);
    innerRing.rotation.x = Math.PI / 14;

    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(2.5, 64),
      new THREE.MeshBasicMaterial({
        color: GOLD,
        transparent: true,
        opacity: 0.08,
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );

    this.portal.add(ring, innerRing, halo);

    // Le portail fait toujours face au voyageur.
    this.portal.lookAt(10.5, 2.6, -37);
    this.group.add(this.portal);

    /** Point 3D exposé au UI-Locking du bouton HTML. */
    this.portalAnchor = this.portal.position.clone();

    this._ring = ring;
    this._innerRing = innerRing;
  }

  update(elapsed) {
    // Scintillement vertical léger des particules (pas de réallocation).
    const pos = this.particles.geometry.attributes.position;
    const arr = pos.array;
    const base = this._particleBase;
    const seeds = this._particleSeeds;
    for (let i = 0; i < seeds.length; i++) {
      arr[i * 3 + 1] = base[i * 3 + 1] + Math.sin(elapsed * 0.55 + seeds[i]) * 0.35;
    }
    pos.needsUpdate = true;

    for (const m of this.milestones) {
      m.rotation.y = elapsed * m.userData.speed;
      m.rotation.x = elapsed * m.userData.speed * 0.6;
      m.position.y = m.userData.baseY + Math.sin(elapsed * 0.5 + m.userData.baseY) * 0.25;
    }

    this._ring.rotation.z = elapsed * 0.22;
    this._innerRing.rotation.z = -elapsed * 0.3;
    this.portalLight.intensity = 34 + Math.sin(elapsed * 2.1) * 8;
  }
}
