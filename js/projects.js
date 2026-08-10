/* ============================================================
   PROJECTS.JS
   ------------------------------------------------------------
   Wordt enkel geladen op pagina's die projecten tonen:
   home (index.html), nieuwbouw/ en renovatie/.
   Vereist dat data/data-loader.js hiervóór is ingeladen.

   Op home/index.html wordt vóór dit script ook
   `VIEWER_RETURN_URL` gedefinieerd — daarmee weet closeViewer()
   dat "Terug" een echte navigatie naar /nieuwbouw/ of /renovatie/
   moet zijn (net als in de oude 1-pagina-site: vanaf de
   homepage ga je bij het sluiten van de viewer naar het volledige
   overzicht van die categorie). Op nieuwbouw/ en renovatie/ zelf
   is dat niet nodig: daar sluit de viewer gewoon terug naar de
   grid op diezelfde pagina.
   ============================================================ */

// ── DATA ──
let nieuwbouwProjecten = [];
let renovatieProjecten = [];

// ── Viewer state ──
let currentProject = null;
let currentPhotoIndex = 0;
let viewerSourcePage = 'nieuwbouw';

// ── Rustige, op volgorde ladende image-queue ──────────────────
// In plaats van alle afbeeldingen tegelijk aan te vragen (wat de
// site doet haperen), worden ze hiermee ství per stap ingeladen:
// max. `concurrency` tegelijk, in de volgorde waarin ze worden
// toegevoegd. `onLoaded(item)` wordt aangeroepen zodra een
// afbeelding echt geladen is (of faalt), zodat de UI kan updaten.
function createImageQueue(concurrency) {
  const wachtrij = [];
  let actief = 0;

  function verwerkVolgende() {
    while (actief < concurrency && wachtrij.length) {
      const taak = wachtrij.shift();
      actief++;
      const preload = new Image();
      const klaar = () => { actief--; verwerkVolgende(); };
      preload.onload = () => { taak.onLoaded(true); klaar(); };
      preload.onerror = () => { taak.onLoaded(false); klaar(); };
      preload.src = taak.src;
    }
  }

  return {
    add(src, onLoaded) {
      wachtrij.push({ src, onLoaded });
      verwerkVolgende();
    }
  };
}

// ── Lazy loading van coverfoto's: pas laden als item bijna in beeld komt ──
function initLazyGridBackgrounds(grid) {
  const targets = grid.querySelectorAll('.photo-item-bg.lazy-bg[data-bg]');
  if (!targets.length) return;

  const queue = createImageQueue(2);

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      obs.unobserve(el);
      const src = el.dataset.bg;
      if (!src) return;
      queue.add(src, (ok) => {
        if (ok) {
          el.style.backgroundImage = `url('${src}')`;
        }
        el.classList.add('loaded');
        el.removeAttribute('data-bg');
      });
    });
  }, { root: null, rootMargin: '250px 0px', threshold: 0.01 });

  targets.forEach(el => observer.observe(el));
}

// ── Render photo grids ──
function renderGrid(containerId, projecten, sourcePage) {
  const grid = document.getElementById(containerId);
  grid.innerHTML = '';
  projecten.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'photo-item reveal';

    const coverSrc = p.cover ? p.cover : (p.images && p.images[0] ? p.images[0] : null);

    item.innerHTML = `
      <div class="photo-item-bg ${coverSrc ? 'lazy-bg' : p.ph}" ${coverSrc ? `data-bg="${coverSrc}"` : ''}></div>
      <div class="photo-item-overlay">
        <div class="photo-item-label">
          <h4>${p.naam}</h4>
          <p>${p.locatie}</p>
        </div>
      </div>
    `;
    item.addEventListener('click', () => openViewer(p, sourcePage));
    grid.appendChild(item);
    setTimeout(() => item.classList.add('visible'), 100 + i * 60);
  });

  // Coverfoto's pas laden zodra ze in (of net buiten) beeld scrollen
  initLazyGridBackgrounds(grid);
}

// ── Render home projects (mix nieuwbouw + renovatie, enkel home:true) ──
function renderHomeProjects() {
  const grid = document.getElementById('homeProjectsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const selection = [...nieuwbouwProjecten, ...renovatieProjecten].filter(p => p.home === true);
  selection.forEach((p, i) => {
    const sourcePage = nieuwbouwProjecten.includes(p) ? 'nieuwbouw' : 'renovatie';
    const card = document.createElement('div');
    card.className = 'home-project-card reveal';
    const coverSrc = p.cover ? p.cover : (p.images && p.images[0] ? p.images[0] : null);
    card.innerHTML = `
      <div class="home-project-card-img">
        ${coverSrc
          ? `<img src="${coverSrc}" alt="${p.naam}" loading="lazy" onerror="this.parentNode.style.background='#ddd'">`
          : `<div style="width:100%;height:100%;background:var(--grey);display:flex;align-items:center;justify-content:center;color:var(--text-light);font-size:12px;letter-spacing:2px;text-transform:uppercase;">${p.naam}</div>`
        }
      </div>
      <div class="home-project-card-label">
        <h4>${p.naam}</h4>
        <p>${p.locatie}</p>
      </div>
    `;
    card.addEventListener('click', () => openViewer(p, sourcePage));
    grid.appendChild(card);
    setTimeout(() => card.classList.add('visible'), 100 + i * 80);
  });
}

// ── Build thumbnail strip ──
function buildViewerStrip(project) {
  const strip = document.getElementById('viewerStrip');
  strip.innerHTML = '';
  const viewerThumbImgsInOrder = [];
  for (let i = 0; i < project.images.length; i++) {
    const thumb = document.createElement('div');
    thumb.className = 'viewer-thumb' + (i === 0 ? ' active' : '');
    thumb.dataset.index = i;

    const imgSrc = project.images && project.images[i] ? project.images[i] : null;
    if (imgSrc) {
      const img = document.createElement('img');
      img.alt = project.naam + ' foto ' + (i + 1);
      img.dataset.src = imgSrc; // src bewust nog niet zetten: laadt nadien in volgorde
      thumb.appendChild(img);
      viewerThumbImgsInOrder.push(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'viewer-thumb-placeholder';
      ph.textContent = (i + 1);
      thumb.appendChild(ph);
    }

    const num = document.createElement('span');
    num.className = 'viewer-thumb-num';
    num.textContent = (i + 1);
    thumb.appendChild(num);

    thumb.addEventListener('click', () => viewerGoTo(i));
    strip.appendChild(thumb);
  }

  // Thumbnails rustig en in volgorde (01, 02, 03…) laten inladen,
  // in plaats van alles tegelijk aan te vragen.
  loadImagesInOrder(viewerThumbImgsInOrder);
}

// ── Afbeeldingen strikt in volgorde laden (max. 2 tegelijk) ──
function loadImagesInOrder(imgElementen) {
  if (!imgElementen.length) return;
  const queue = createImageQueue(2);
  imgElementen.forEach(img => {
    const src = img.dataset.src;
    if (!src) return;
    queue.add(src, (ok) => {
      if (ok) img.src = src;
      img.classList.add('loaded');
      img.removeAttribute('data-src');
    });
  });
}

// ── Update main image ──
function updateViewerMain() {
  const project = currentProject;
  const i = currentPhotoIndex;
  const imgEl = document.getElementById('viewerImg');
  const phEl = document.getElementById('viewerImgPlaceholder');
  const label = document.getElementById('viewerPlaceholderLabel');
  const counter = document.getElementById('viewerCounter');

  counter.textContent = (i + 1) + ' / ' + project.images.length;

  const imgSrc = project.images && project.images[i] ? project.images[i] : null;
  if (imgSrc) {
    imgEl.src = imgSrc;
    imgEl.alt = project.naam + ' – foto ' + (i + 1);
    imgEl.style.display = 'block';
    phEl.style.display = 'none';
  } else {
    imgEl.style.display = 'none';
    phEl.style.display = 'flex';
    label.textContent = 'Foto ' + (i + 1) + ' — ' + project.naam;
  }

  document.querySelectorAll('.viewer-thumb').forEach((t, idx) => {
    t.classList.toggle('active', idx === i);
  });

  const activeThumb = document.querySelector('.viewer-thumb.active');
  if (activeThumb) activeThumb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ── Open viewer (blijft een in-pagina overlay: geen aparte URL per project) ──
function openViewer(project, sourcePage) {
  currentProject = project;
  currentPhotoIndex = 0;
  viewerSourcePage = sourcePage || 'nieuwbouw';

  // Update terug-knop tekst
  const backBtn = document.getElementById('viewerBackTop');
  if (sourcePage === 'renovatie') {
    backBtn.textContent = ' Terug naar renovatie';
  } else if (sourcePage === 'nieuwbouw') {
    backBtn.textContent = ' Terug naar nieuwbouw';
  } else {
    backBtn.textContent = ' Terug naar projecten';
  }
  backBtn.style.paddingLeft = '0';

  document.getElementById('viewerTitle').textContent = project.naam;
  document.getElementById('viewerLoc').textContent = project.locatie;

  buildViewerStrip(project);
  updateViewerMain();

  // Verberg de normale paginainhoud, toon de viewer erover
  const main = document.getElementById('mainContent');
  if (main) main.style.display = 'none';
  document.getElementById('projectViewer').classList.add('open');
  window.scrollTo(0, 0);
}

// ── Sluit viewer ──
function closeViewer() {
  document.getElementById('projectViewer').classList.remove('open');

  // Op de homepage: echt terugnavigeren naar /nieuwbouw/ of /renovatie/
  if (typeof VIEWER_RETURN_URL !== 'undefined' && VIEWER_RETURN_URL && VIEWER_RETURN_URL[viewerSourcePage]) {
    window.location.href = VIEWER_RETURN_URL[viewerSourcePage];
    return;
  }

  // Op nieuwbouw/renovatie zelf: gewoon terug naar de grid op deze pagina
  const main = document.getElementById('mainContent');
  if (main) main.style.display = '';
  window.scrollTo(0, 0);
}

function viewerGoTo(n) {
  currentPhotoIndex = n;
  updateViewerMain();
}

function viewerNext() {
  viewerGoTo((currentPhotoIndex + 1) % currentProject.images.length);
}

function viewerPrev() {
  viewerGoTo((currentPhotoIndex - 1 + currentProject.images.length) % currentProject.images.length);
}

document.addEventListener('keydown', e => {
  if (!document.getElementById('projectViewer').classList.contains('open')) return;
  if (e.key === 'ArrowRight') viewerNext();
  if (e.key === 'ArrowLeft') viewerPrev();
  if (e.key === 'Escape') closeViewer();
});

// ── Fix viewer back button (remove ::before, use text directly) ──
(function patchViewerBack() {
  const btn = document.getElementById('viewerBackTop');
  if (btn) {
    btn.style.cssText += '; display:inline-flex; align-items:center; gap:0;';
  }
})();

// ── Init: data inladen, en enkel renderen wat op déze pagina nodig is ──
(async function initProjectsData() {
  try {
    const projecten = await laadEnBouwProjecten('data/projects.json');
    nieuwbouwProjecten = projecten.nieuwbouw;
    renovatieProjecten = projecten.renovatie;
  } catch (err) {
    console.error('Projectdata kon niet geladen worden:', err);
  }
  if (document.getElementById('homeProjectsGrid')) renderHomeProjects();
  if (document.getElementById('nieuwbouwGrid')) renderGrid('nieuwbouwGrid', nieuwbouwProjecten, 'nieuwbouw');
  if (document.getElementById('renovatieGrid')) renderGrid('renovatieGrid', renovatieProjecten, 'renovatie');
  initReveal();
})();
