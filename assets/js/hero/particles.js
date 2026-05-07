/* ==========================================================================
   Hero Particles — Canvas 2D Particle System

   A self-contained particle engine that renders animated particles with
   optional connection lines and mouse interaction inside a hero container.

   Configuration is read from the hero element's data-* attributes:
     data-particles-count           Number of particles (default 80)
     data-particles-color           Primary color (default #2f7f93)
     data-particles-color-secondary Secondary color (default #52adc8)
     data-particles-speed           Speed multiplier (default 0.5)
     data-particles-connect         Draw connecting lines (default true)
     data-particles-max-distance    Max connection distance px (default 120)
     data-particles-mouse           Mouse interaction strength (default 1.0)
     data-particles-trail           Trail opacity 0-1 (default 0.3)
   ========================================================================== */

var Particles = (function () {
  "use strict";

  console.log('[HERO-DIAG] Particles module loading...');

  var SPATIAL_CELL_SIZE = 80; // grid cell size for spatial hash

  function Particles(container) {
    console.log('[HERO-DIAG] Particles constructor called, container:', container.id);
    this.container = container;
    this.canvas = null;
    this.ctx = null;
    this.particles = [];
    this.mouse = { x: -9999, y: -9999, active: false };
    this.animFrame = null;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = 0;
    this.height = 0;
    this.running = true;
    this.lastTime = 0;

    this._readConfig();
    this._createCanvas();
    this._spawnParticles();
    this._bindEvents();
    this._loop();
  }

  Particles.prototype._readConfig = function () {
    var el = this.container;
    this.config = {
      count: parseInt(el.dataset.particlesCount) || 80,
      color: el.dataset.particlesColor || "#2f7f93",
      colorSecondary: el.dataset.particlesColorSecondary || "#52adc8",
      speed: parseFloat(el.dataset.particlesSpeed) || 0.5,
      connect: el.dataset.particlesConnect !== "false",
      maxDistance: parseInt(el.dataset.particlesMaxDistance) || 120,
      mouse: parseFloat(el.dataset.particlesMouse) || 1.0,
      trail: parseFloat(el.dataset.particlesTrail) || 0.3
    };

    // Reduce count on mobile
    if (window.innerWidth < 768) {
      this.config.count = Math.floor(this.config.count * 0.5);
    }

    // Parse colors
    this.colors = [this._hexToRgb(this.config.color)];
    if (this.config.colorSecondary) {
      this.colors.push(this._hexToRgb(this.config.colorSecondary));
    }
  };

  Particles.prototype._hexToRgb = function (hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        }
      : { r: 47, g: 127, b: 147 };
  };

  Particles.prototype._createCanvas = function () {
    this.canvas = document.createElement("canvas");
    this.canvas.style.display = "block";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext("2d");
    console.log('[HERO-DIAG] Canvas created, ctx:', !!this.ctx, ', getContext("2d"):', this.ctx);
    this._resize();
    console.log('[HERO-DIAG] After resize - canvas dims:', this.canvas.width + 'x' + this.canvas.height);
  };

  Particles.prototype._resize = function () {
    var rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Rebuild spatial grid for new dimensions
    this.gridCols = Math.ceil(this.width / SPATIAL_CELL_SIZE);
    this.gridRows = Math.ceil(this.height / SPATIAL_CELL_SIZE);
  };

  Particles.prototype._spawnParticles = function () {
    for (var i = 0; i < this.config.count; i++) {
      this.particles.push(this._createParticle());
    }
  };

  Particles.prototype._createParticle = function () {
    var color = this.colors[Math.floor(Math.random() * this.colors.length)];
    var baseSpeed = 0.3 * this.config.speed;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vx: (Math.random() - 0.5) * baseSpeed,
      vy: (Math.random() - 0.5) * baseSpeed,
      radius: 1.2 + Math.random() * 1.8,
      color: color,
      alpha: 0.3 + Math.random() * 0.5
    };
  };

  Particles.prototype._bindEvents = function () {
    var self = this;

    // Resize
    var resizeTimeout;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        self._resize();
      }, 150);
    });

    // Mouse tracking
    this.container.addEventListener("mousemove", function (e) {
      var rect = self.container.getBoundingClientRect();
      self.mouse.x = e.clientX - rect.left;
      self.mouse.y = e.clientY - rect.top;
      self.mouse.active = true;
    });

    this.container.addEventListener("mouseleave", function () {
      self.mouse.active = false;
    });

    // Pause when off-screen
    document.addEventListener("visibilitychange", function () {
      self.running = !document.hidden;
      if (self.running) {
        self.lastTime = 0;
        self._loop();
      }
    });

    // Reduced motion
    var motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    motionQuery.addEventListener("change", function (e) {
      if (e.matches) {
        self.destroy();
      }
    });
  };

  /* ====================================================================
     Spatial Hash — grid-based neighbor lookup for O(n) connection checks
     ==================================================================== */

  Particles.prototype._buildGrid = function () {
    var grid = new Array(this.gridCols * this.gridRows);
    for (var i = 0; i < this.particles.length; i++) {
      var p = this.particles[i];
      var col = Math.min(Math.max(Math.floor(p.x / SPATIAL_CELL_SIZE), 0), this.gridCols - 1);
      var row = Math.min(Math.max(Math.floor(p.y / SPATIAL_CELL_SIZE), 0), this.gridRows - 1);
      var idx = row * this.gridCols + col;
      if (!grid[idx]) grid[idx] = [];
      grid[idx].push(i);
    }
    return grid;
  };

  Particles.prototype._getNeighbors = function (grid, col, row) {
    var neighbors = [];
    for (var dr = -1; dr <= 1; dr++) {
      for (var dc = -1; dc <= 1; dc++) {
        var r = row + dr;
        var c = col + dc;
        if (r >= 0 && r < this.gridRows && c >= 0 && c < this.gridCols) {
          var cell = grid[r * this.gridCols + c];
          if (cell) {
            for (var i = 0; i < cell.length; i++) {
              neighbors.push(cell[i]);
            }
          }
        }
      }
    }
    return neighbors;
  };

  /* ====================================================================
     Main Render Loop
     ==================================================================== */

  Particles.prototype._loop = function () {
    if (!this.running) return;

    var self = this;
    this.animFrame = requestAnimationFrame(function (ts) {
      self._update();
      self._draw();
      self._loop();
    });
    if (!this._loopLogged) {
      console.log('[HERO-DIAG] Render loop started, particles:', self.particles.length);
      this._loopLogged = true;
    }
  };

  Particles.prototype._update = function () {
    var particles = this.particles;
    var count = particles.length;
    var config = this.config;
    var w = this.width;
    var h = this.height;
    var mouse = this.mouse;
    var speed = config.speed;

    for (var i = 0; i < count; i++) {
      var p = particles[i];

      // Update position
      p.x += p.vx * speed;
      p.y += p.vy * speed;

      // Boundary bounce with slight damping
      if (p.x < 0) { p.x = 0; p.vx *= -1; }
      if (p.x > w) { p.x = w; p.vx *= -1; }
      if (p.y < 0) { p.y = 0; p.vy *= -1; }
      if (p.y > h) { p.y = h; p.vy *= -1; }

      // Mouse interaction
      if (mouse.active && config.mouse !== 0) {
        var dx = mouse.x - p.x;
        var dy = mouse.y - p.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var radius = 120;

        if (dist < radius) {
          var force = (1 - dist / radius) * config.mouse * 0.03;
          p.vx += dx * force;
          p.vy += dy * force;

          // Clamp velocity
          var maxV = 1.5 * speed;
          var vMag = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
          if (vMag > maxV) {
            p.vx = (p.vx / vMag) * maxV;
            p.vy = (p.vy / vMag) * maxV;
          }
        }
      }
    }
  };

  Particles.prototype._draw = function () {
    var ctx = this.ctx;
    var particles = this.particles;
    var count = particles.length;
    var config = this.config;
    var w = this.width;
    var h = this.height;

    // Trail effect: semi-transparent background overlay
    if (config.trail > 0) {
      ctx.fillStyle = "rgba(255, 255, 255, " + (1 - config.trail) + ")";
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.clearRect(0, 0, w, h);
    }

    // Draw connection lines first (behind particles)
    if (config.connect) {
      var grid = this._buildGrid();
      var drawn = {}; // Track drawn pairs to avoid double-drawing

      for (var i = 0; i < count; i++) {
        var p = particles[i];
        var col = Math.min(Math.max(Math.floor(p.x / SPATIAL_CELL_SIZE), 0), this.gridCols - 1);
        var row = Math.min(Math.max(Math.floor(p.y / SPATIAL_CELL_SIZE), 0), this.gridRows - 1);
        var neighbors = this._getNeighbors(grid, col, row);

        for (var n = 0; n < neighbors.length; n++) {
          var j = neighbors[n];
          if (j <= i) continue; // Skip self and already-drawn pairs

          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < config.maxDistance) {
            var alpha = (1 - dist / config.maxDistance) * 0.35;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle =
              "rgba(" +
              p.color.r + "," + p.color.g + "," + p.color.b + "," +
              alpha.toFixed(3) + ")";
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    // Draw particles
    for (var i = 0; i < count; i++) {
      var p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle =
        "rgba(" +
        p.color.r + "," + p.color.g + "," + p.color.b + "," +
        p.alpha.toFixed(3) + ")";
      ctx.fill();
    }
  };

  /* ====================================================================
     Public API
     ==================================================================== */

  Particles.prototype.destroy = function () {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.particles.length = 0;
  };

  Particles.prototype.resize = function () {
    this._resize();
  };

  return Particles;
})();
