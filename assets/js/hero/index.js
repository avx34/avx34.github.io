/* ==========================================================================
   Hero Banner — Entry Point
   Reads the hero banner element data attributes and initializes the
   appropriate content source module.
   ========================================================================== */

(function () {
  console.log('[HERO-DIAG] index.js IIFE starting...');
  const heroEl = document.getElementById("hero-banner");
  console.log('[HERO-DIAG] heroEl found:', !!heroEl);
  if (!heroEl) return;

  const type = heroEl.dataset.heroType || "particles";
  console.log('[HERO-DIAG] hero type:', type);

  // Check for reduced motion preference
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  console.log('[HERO-DIAG] prefersReducedMotion:', prefersReducedMotion);
  if (prefersReducedMotion) {
    console.log('[HERO-DIAG] Aborting due to reduced motion preference');
    return;
  }

  // Apply height from data attributes
  const height = heroEl.dataset.heroHeight || "40vh";
  const minHeight = heroEl.dataset.heroMinHeight || "250px";
  heroEl.style.height = height;
  heroEl.style.minHeight = minHeight;
  console.log('[HERO-DIAG] Height set:', height, 'minHeight:', minHeight);

  // Dispatch to the appropriate content source loader
  switch (type) {
    case "particles":
      loadParticles(heroEl);
      break;
    case "video":
      loadVideo(heroEl);
      break;
    case "image":
      loadImage(heroEl);
      break;
    case "threejs":
      loadThreeJS(heroEl);
      break;
    case "custom":
      loadCustom(heroEl);
      break;
    default:
      console.warn("Hero: unknown type '" + type + "', falling back to particles");
      loadParticles(heroEl);
  }

  // Handle masthead overlay scroll behavior
  setupMastheadOverlay();
})();

/* ========================================================================
   Content Source Loaders
   ======================================================================== */

function loadParticles(heroEl) {
  console.log('[HERO-DIAG] loadParticles called, Particles type:', typeof Particles);
  if (typeof Particles === "function") {
    console.log('[HERO-DIAG] Creating Particles instance...');
    new Particles(heroEl);
    console.log('[HERO-DIAG] Particles instance created');
  } else {
    console.warn("[HERO-DIAG] Particles module not loaded. Include particles.js before hero/index.js.");
  }
}

function loadVideo(heroEl) {
  // Placeholder for video module
  console.log("Hero: video type not yet implemented, falling back to particles");
  loadParticles(heroEl);
}

function loadImage(heroEl) {
  const src = heroEl.dataset.imageSrc;
  if (src) {
    heroEl.style.backgroundImage = "url(" + src + ")";
    heroEl.style.backgroundSize = "cover";
    heroEl.style.backgroundPosition = "center";
  }
}

function loadThreeJS(heroEl) {
  console.log("Hero: threejs type not yet implemented, falling back to particles");
  loadParticles(heroEl);
}

function loadCustom(heroEl) {
  const html = heroEl.dataset.customHtml;
  const script = heroEl.dataset.customScript;
  if (html) {
    heroEl.innerHTML = decodeURIComponent(html);
  }
  if (script) {
    const s = document.createElement("script");
    s.textContent = decodeURIComponent(script);
    heroEl.appendChild(s);
  }
}

/* ========================================================================
   Masthead Overlay Scroll Behavior
   ======================================================================== */

function setupMastheadOverlay() {
  const body = document.body;
  if (!body.classList.contains("has-hero-overlay")) return;

  const masthead = document.querySelector(".masthead");
  const heroEl = document.getElementById("hero-banner");
  if (!masthead || !heroEl) return;

  const heroBottom = () => heroEl.offsetTop + heroEl.offsetHeight;

  function onScroll() {
    if (window.scrollY > heroBottom() - masthead.offsetHeight) {
      masthead.classList.add("masthead--scrolled");
    } else {
      masthead.classList.remove("masthead--scrolled");
    }
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // Initial check
}
