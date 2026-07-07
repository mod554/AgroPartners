# Africa Agro Partners — Expérience Web 3D Immersive

Single Page Application immersive pour **Africa Agro Partners®**, filiale du groupe
**ARCHETYP AFRICA®** — négoce agricole en Côte d'Ivoire (maïs, noix de cajou, cola)
et intermédiation sur la **BMPA-CI** (Bourse des Matières Premières Agricoles).

> *Bâtir aujourd'hui, semer l'avenir, récolter la valeur de demain.*

## Démarrage

```bash
npm install
npm run dev      # serveur de développement (http://localhost:5173)
npm run build    # build de production → dist/
npm run preview  # prévisualisation du build
```

## Architecture technique

| Brique | Rôle |
|---|---|
| `src/experience/Experience.js` | Orchestrateur WebGL : renderer, scène, boucle de rendu, resize |
| `src/experience/VideoBackground.js` | Vidéo en `THREE.VideoTexture` sur `scene.background`, cadrage *cover* |
| `src/experience/CameraRig.js` | Caméra guidée au scroll via `THREE.CatmullRomCurve3` + `curve.getPoint(t)` |
| `src/experience/World.js` | Contenu 3D : particules dorées, jalons géométriques, portail BMPA-CI |
| `src/experience/UIAnchor.js` | UI-Locking : projection 3D → 2D du bouton « Accéder à la BMPA-CI » |
| `src/ui/ScrollManager.js` | Progression de scroll normalisée et lissée (exponentielle, framerate-safe) |
| `src/ui/Reveal.js` | Apparitions au scroll (IntersectionObserver) + titre héros masqué mot à mot |

### UI-Locking — formule de projection

Le bouton HTML est verrouillé sur le point 3D du portail doré. À chaque frame :

```js
v.copy(point3D).project(camera);          // NDC, de -1 à 1
x = (v.x * 0.5 + 0.5) * window.innerWidth;
y = (-v.y * 0.5 + 0.5) * window.innerHeight;
// display: none si le point passe derrière la caméra (NDC z > 1)
```

Le hover du bouton (scale + lueur `box-shadow`) est géré à 100 % en CSS
avec une transition `ease-out`, sans conflit avec le positionnement JS.

### Performances

- Pixel ratio plafonné à 2, `powerPreference: 'high-performance'`
- Zéro allocation dans la boucle de rendu (vecteurs réutilisés)
- Boucle suspendue quand l'onglet est masqué (`visibilitychange`)
- Particules en un seul `BufferGeometry` / draw call
- `prefers-reduced-motion` respecté

## Design

Corporate « Agro-Tech » : vert profond (primaire) & or (accent), glassmorphism,
typographies Fraunces (display) / Sora (texte), animations d'apparition en cascade.
