/* ==========================================================================
   Hero Banner — Entry Point
   Reads the hero banner element data attributes and initializes the
   appropriate content source module.
   ========================================================================== */

(function () {
  var heroEl = document.getElementById("hero-banner");
  if (!heroEl) return;

  var type = heroEl.dataset.heroType || "particles";

  // Apply height from data attributes
  var height = heroEl.dataset.heroHeight || "40vh";
  var minHeight = heroEl.dataset.heroMinHeight || "250px";
  heroEl.style.height = height;
  heroEl.style.minHeight = minHeight;

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
