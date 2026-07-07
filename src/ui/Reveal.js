/**
 * Animations d'apparition au scroll.
 * Chaque section observée reçoit la classe `.in-view` : ses éléments
 * `.reveal` s'animent alors en cascade (délai piloté par --d en CSS).
 */
export function initReveals() {
  const sections = document.querySelectorAll('[data-section]');

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target); // une seule apparition, pas de replay
        }
      }
    },
    { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
  );

  sections.forEach((s) => observer.observe(s));
}

/**
 * Découpe le titre héros en mots masqués, révélés un à un
 * (translation + rotation) façon "Awwwards".
 */
export function splitHeroTitle(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  el.setAttribute('aria-label', words.join(' '));

  words.forEach((word, i) => {
    const mask = document.createElement('span');
    mask.className = 'w';
    mask.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('span');
    inner.style.setProperty('--w', i);
    inner.textContent = word;

    mask.appendChild(inner);
    el.appendChild(mask);
    if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
  });
}
