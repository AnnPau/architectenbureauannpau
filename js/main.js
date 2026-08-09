/* ============================================================
   MAIN.JS
   ------------------------------------------------------------
   Gedeelde functionaliteit voor ALLE pagina's:
   - mobiel hamburgermenu open/dicht
   - schaduw onder de navbar bij scrollen
   - "reveal" scroll-animatie (elementen laten invloeien)

   Wordt op elke pagina ingeladen. Pagina's die ook projects.js
   laden (home, nieuwbouw, renovatie) zetten voor het inladen
   `window.PROJECTS_PAGE = true;` — op die pagina's roept
   projects.js zelf initReveal() aan (nadat de projectdata en
   de grid zijn ingeladen), dus hoeft dat hier niet nogmaals.
   ============================================================ */

// ── Mobile nav ──
function toggleMobileNav() {
  const nav = document.getElementById('mobileNav');
  const btn = document.getElementById('hamburger');
  const isOpen = nav.classList.toggle('open');
  btn.classList.toggle('open', isOpen);
}

function closeMobileNav() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('hamburger').classList.remove('open');
}

// ── Navbar scroll schaduw ──
window.addEventListener('scroll', () => {
  const nav = document.getElementById('navbar');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 10);
});

// ── Scroll reveal ──
function initReveal() {
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.12 });
  reveals.forEach(el => observer.observe(el));
  reveals.forEach(el => {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.9) el.classList.add('visible');
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (!window.PROJECTS_PAGE) {
    setTimeout(initReveal, 50);
  }
});
