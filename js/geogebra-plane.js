/**
 * GeoGebraCartesianPlane
 * Motor de plano cartesiano interactivo de alta fidelidad estilo GeoGebra
 * con papel milimetrado (cuadrícula mayor y menor), ticks, marcas numéricas,
 * panel de herramientas flotante, reescalamiento de ejes y paleta gráfica.
 */
class GeoGebraCartesianPlane {
  constructor(containerElement, options = {}) {
    this.container = typeof containerElement === 'string' 
      ? document.querySelector(containerElement) 
      : containerElement;

    if (!this.container) return;

    this.options = Object.assign({
      originX: null,
      originY: null,
      scaleX: 60, // píxeles por unidad en X
      scaleY: 60, // píxeles por unidad en Y
      minScale: 10,
      maxScale: 600,
      showMinorGrid: true,
      xLabel: 't (s)',
      yLabel: 'x (m)',
      strokeColor: '#0284c7',
      strokeWidth: 3,
      lineDash: [], // [] = sólida, [6, 6] = segmentada, [2, 4] = punteada
      arrowVectors: false
    }, options);

    this.scaleX = this.options.scaleX;
    this.scaleY = this.options.scaleY;
    this.offsetX = 0;
    this.offsetY = 0;
    this.initialScaleX = this.scaleX;
    this.initialScaleY = this.scaleY;

    this.mode = 'pan'; // 'pan', 'select', 'rescale-x', 'rescale-y'
    this.isDragging = false;
    this.lastMouse = { x: 0, y: 0 };
    this.hoverCoord = { x: 0, y: 0, active: false };

    // Lista de funciones o curvas a graficar
    this.curves = [];

    this.initDOM();
    this.initEvents();
    this.resize();
    this.render();
  }

  initDOM() {
    this.container.classList.add('geogebra-container');
    this.container.innerHTML = `
      <canvas class="geogebra-canvas mode-pan"></canvas>
      
      <!-- Barra de herramientas flotante -->
      <div class="geo-toolbar">
        <button class="geo-tool-btn" data-action="select" title="Seleccionar e Inspeccionar Puntos">
          <i data-lucide="mouse-pointer"></i>
        </button>
        <button class="geo-tool-btn active" data-action="pan" title="Arrastrar Lienzo">
          <i data-lucide="hand"></i>
        </button>
        <button class="geo-tool-btn" data-action="rescale" title="Modo Reescalamiento de Ejes">
          <i data-lucide="move"></i>
        </button>
        <div class="geo-divider"></div>
        <button class="geo-tool-btn" data-action="zoom-in" title="Acercar (Zoom In)">
          <i data-lucide="zoom-in"></i>
        </button>
        <button class="geo-tool-btn" data-action="zoom-out" title="Alejar (Zoom Out)">
          <i data-lucide="zoom-out"></i>
        </button>
        <button class="geo-tool-btn" data-action="reset" title="Restablecer Vista Original">
          <i data-lucide="rotate-ccw"></i>
        </button>
        <div class="geo-divider"></div>
        <button class="geo-tool-btn" data-action="palette" title="Paleta de Estilos Gráficos">
          <i data-lucide="palette"></i>
        </button>
      </div>

      <!-- Menú emergente de la paleta gráfica -->
      <div class="geo-palette-menu">
        <div class="geo-palette-section">
          <div class="geo-palette-title">Color de Trazo</div>
          <div class="color-swatches-row">
            <button class="swatch-color active" data-color="#0284c7" style="background:#0284c7;"></button>
            <button class="swatch-color" data-color="#059669" style="background:#059669;"></button>
            <button class="swatch-color" data-color="#dc2626" style="background:#dc2626;"></button>
            <button class="swatch-color" data-color="#7c3aed" style="background:#7c3aed;"></button>
            <button class="swatch-color" data-color="#ea580c" style="background:#ea580c;"></button>
            <button class="swatch-color" data-color="#0891b2" style="background:#0891b2;"></button>
          </div>
        </div>
        <div class="geo-palette-section">
          <div class="geo-palette-title">Grosor de Línea</div>
          <div class="stroke-width-group">
            <button class="stroke-width-btn" data-width="1.5">Fino</button>
            <button class="stroke-width-btn active" data-width="3">Medio</button>
            <button class="stroke-width-btn" data-width="5">Grueso</button>
          </div>
        </div>
        <div class="geo-palette-section">
          <div class="geo-palette-title">Estilo de Línea</div>
          <div class="dash-style-group">
            <button class="dash-style-btn active" data-style="solid" title="Línea Continua">
              <span class="dash-line-preview"></span>
            </button>
            <button class="dash-style-btn" data-style="dashed" title="Línea Segmentada">
              <span class="dash-line-preview dashed"></span>
            </button>
            <button class="dash-style-btn" data-style="dotted" title="Línea Punteada">
              <span class="dash-line-preview dotted"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- Insignia de Coordenadas -->
      <div class="geo-coords-badge">
        <span>X: <strong class="geo-coord-x">0.00</strong></span>
        <span>Y: <strong class="geo-coord-y">0.00</strong></span>
      </div>

      <!-- Escala Actual -->
      <div class="geo-scale-indicator">
        Escala: <span class="geo-scale-val">1:1</span>
      </div>
    `;

    this.canvas = this.container.querySelector('.geogebra-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.coordsBadgeX = this.container.querySelector('.geo-coord-x');
    this.coordsBadgeY = this.container.querySelector('.geo-coord-y');
    this.scaleVal = this.container.querySelector('.geo-scale-val');
    this.paletteMenu = this.container.querySelector('.geo-palette-menu');

    // Inicializar iconos de Lucide
    if (window.lucide) {
      window.lucide.createIcons({ root: this.container });
    }
  }

  resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width > 0 ? rect.width : (this.width || 600);
    this.height = rect.height > 0 ? rect.height : (this.height || 360);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    } else {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    this.ctx.scale(dpr, dpr);

    if (this.offsetX === 0 && this.offsetY === 0) {
      // Origen en el tercio izquierdo para representar el tiempo t >= 0 cómodamente
      this.offsetX = this.options.originX !== null ? this.options.originX : this.width * 0.18;
      this.offsetY = this.options.originY !== null ? this.options.originY : this.height * 0.5;
    }
  }

  initEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.render();
    });

    // Eventos de botones de herramientas
    this.container.querySelectorAll('.geo-tool-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = btn.dataset.action;
        this.handleToolAction(action, btn);
      });
    });

    // Eventos de paleta
    this.container.querySelectorAll('.swatch-color').forEach(swatch => {
      swatch.addEventListener('click', () => {
        this.container.querySelectorAll('.swatch-color').forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        this.options.strokeColor = swatch.dataset.color;
        this.render();
      });
    });

    this.container.querySelectorAll('.stroke-width-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.stroke-width-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.options.strokeWidth = parseFloat(btn.dataset.width);
        this.render();
      });
    });

    this.container.querySelectorAll('.dash-style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.dash-style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const style = btn.dataset.style;
        if (style === 'solid') this.options.lineDash = [];
        else if (style === 'dashed') this.options.lineDash = [6, 6];
        else if (style === 'dotted') this.options.lineDash = [3, 4];
        this.render();
      });
    });

    // Interacciones del ratón sobre el lienzo
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    window.addEventListener('mousemove', (e) => this.onMouseMove(e));
    window.addEventListener('mouseup', (e) => this.onMouseUp(e));
    this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

    // Touch events para móviles
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
  }

  handleToolAction(action, btn) {
    if (action === 'palette') {
      this.paletteMenu.classList.toggle('show');
      return;
    }

    this.paletteMenu.classList.remove('show');

    if (action === 'zoom-in') {
      this.zoom(1.2, this.width / 2, this.height / 2);
    } else if (action === 'zoom-out') {
      this.zoom(1 / 1.2, this.width / 2, this.height / 2);
    } else if (action === 'reset') {
      this.scaleX = this.initialScaleX;
      this.scaleY = this.initialScaleY;
      this.offsetX = this.width * 0.18;
      this.offsetY = this.height * 0.5;
      this.render();
    } else if (['pan', 'select', 'rescale'].includes(action)) {
      this.container.querySelectorAll('.geo-tool-btn').forEach(b => {
        if (['pan', 'select', 'rescale'].includes(b.dataset.action)) b.classList.remove('active');
      });
      btn.classList.add('active');
      this.mode = action;
      this.canvas.className = `geogebra-canvas mode-${action}`;
    }
  }

  screenToWorld(sx, sy) {
    return {
      x: (sx - this.offsetX) / this.scaleX,
      y: (this.offsetY - sy) / this.scaleY
    };
  }

  worldToScreen(wx, wy) {
    return {
      x: this.offsetX + wx * this.scaleX,
      y: this.offsetY - wy * this.scaleY
    };
  }

  onMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    this.isDragging = true;
    this.lastMouse = { x, y };

    if (this.mode === 'rescale') {
      // Si está cerca del eje X o Y
      const distToAxisX = Math.abs(y - this.offsetY);
      const distToAxisY = Math.abs(x - this.offsetX);
      if (distToAxisX < 25) this.rescaleAxis = 'y';
      else if (distToAxisY < 25) this.rescaleAxis = 'x';
      else this.rescaleAxis = 'both';
    }
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Actualizar coordenadas bajo el puntero
    const world = this.screenToWorld(x, y);
    this.hoverCoord = { x: world.x, y: world.y, active: (x >= 0 && x <= this.width && y >= 0 && y <= this.height) };
    
    if (this.coordsBadgeX && this.coordsBadgeY) {
      this.coordsBadgeX.textContent = world.x.toFixed(2);
      this.coordsBadgeY.textContent = world.y.toFixed(2);
    }

    if (!this.isDragging) {
      if (this.mode === 'select') this.render();
      return;
    }

    const dx = x - this.lastMouse.x;
    const dy = y - this.lastMouse.y;

    if (this.mode === 'pan') {
      this.offsetX += dx;
      this.offsetY += dy;
    } else if (this.mode === 'rescale') {
      const factorX = 1 + (dx / 200);
      const factorY = 1 - (dy / 200);
      if (this.rescaleAxis === 'x' || this.rescaleAxis === 'both') {
        this.scaleX = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleX * factorX));
      }
      if (this.rescaleAxis === 'y' || this.rescaleAxis === 'both') {
        this.scaleY = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleY * factorY));
      }
    }

    this.lastMouse = { x, y };
    this.render();
  }

  onMouseUp() {
    this.isDragging = false;
  }

  onWheel(e) {
    e.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    this.zoom(zoomFactor, mouseX, mouseY);
  }

  zoom(factor, pivotX, pivotY) {
    const newScaleX = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleX * factor));
    const newScaleY = Math.max(this.options.minScale, Math.min(this.options.maxScale, this.scaleY * factor));

    // Ajustar el offset para centrar el zoom en pivot
    this.offsetX = pivotX - (pivotX - this.offsetX) * (newScaleX / this.scaleX);
    this.offsetY = pivotY - (pivotY - this.offsetY) * (newScaleY / this.scaleY);

    this.scaleX = newScaleX;
    this.scaleY = newScaleY;

    if (this.scaleVal) {
      this.scaleVal.textContent = (this.scaleX / this.initialScaleX).toFixed(1) + 'x';
    }

    this.render();
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      this.isDragging = true;
      this.lastMouse = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
  }

  onTouchMove(e) {
    if (this.isDragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this.canvas.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const dx = x - this.lastMouse.x;
      const dy = y - this.lastMouse.y;
      this.offsetX += dx;
      this.offsetY += dy;
      this.lastMouse = { x, y };
      this.render();
    }
  }

  onTouchEnd() {
    this.isDragging = false;
  }

  // Añadir función matemática para graficar
  addCurve(func, label = 'Curva', color = null, width = null, dash = null) {
    this.curves.push({
      func,
      label,
      color: color || this.options.strokeColor,
      width: width || this.options.strokeWidth,
      dash: dash || this.options.lineDash,
      active: true
    });
    this.render();
  }

  clearCurves() {
    this.curves = [];
    this.render();
  }

  toggleCurve(index) {
    if (this.curves[index]) {
      this.curves[index].active = !this.curves[index].active;
      this.render();
      return this.curves[index].active;
    }
    return false;
  }

  setCurveVisibility(index, visible) {
    if (this.curves[index]) {
      this.curves[index].active = !!visible;
      this.render();
    }
  }

  // Calcular paso de cuadrícula óptimo (1, 2, 5 * 10^n)
  getOptimalStep(scale) {
    const rawStep = 60 / scale; // Queremos unos 60px entre marcas mayores
    const exponent = Math.floor(Math.log10(rawStep));
    const fraction = rawStep / Math.pow(10, exponent);
    let niceFraction;
    if (fraction < 1.5) niceFraction = 1;
    else if (fraction < 3.5) niceFraction = 2;
    else if (fraction < 7.5) niceFraction = 5;
    else niceFraction = 10;
    return niceFraction * Math.pow(10, exponent);
  }

  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // 1. Dibujar Papel Milimetrado (Cuadrícula Menor y Mayor)
    const stepX = this.getOptimalStep(this.scaleX);
    const stepY = this.getOptimalStep(this.scaleY);
    const subDivisions = 5; // Papel milimetrado 5 subintervalos
    const minorStepX = stepX / subDivisions;
    const minorStepY = stepY / subDivisions;

    // Rango visible en coordenadas de mundo
    const minWorld = this.screenToWorld(0, h);
    const maxWorld = this.screenToWorld(w, 0);

    // Cuadrícula Menor (Líneas finas milimetradas)
    if (this.options.showMinorGrid) {
      ctx.beginPath();
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([]);

      const startMinorX = Math.floor(minWorld.x / minorStepX) * minorStepX;
      for (let x = startMinorX; x <= maxWorld.x; x += minorStepX) {
        const sx = this.worldToScreen(x, 0).x;
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, h);
      }

      const startMinorY = Math.floor(minWorld.y / minorStepY) * minorStepY;
      for (let y = startMinorY; y <= maxWorld.y; y += minorStepY) {
        const sy = this.worldToScreen(0, y).y;
        ctx.moveTo(0, sy);
        ctx.lineTo(w, sy);
      }
      ctx.stroke();
    }

    // Cuadrícula Mayor
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([]);

    const startMajorX = Math.floor(minWorld.x / stepX) * stepX;
    for (let x = startMajorX; x <= maxWorld.x; x += stepX) {
      const sx = this.worldToScreen(x, 0).x;
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, h);
    }

    const startMajorY = Math.floor(minWorld.y / stepY) * stepY;
    for (let y = startMajorY; y <= maxWorld.y; y += stepY) {
      const sy = this.worldToScreen(0, y).y;
      ctx.moveTo(0, sy);
      ctx.lineTo(w, sy);
    }
    ctx.stroke();

    // 2. Ejes Coordenados Principales
    const originScreen = this.worldToScreen(0, 0);

    ctx.beginPath();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.8;

    // Eje X
    ctx.moveTo(0, originScreen.y);
    ctx.lineTo(w, originScreen.y);

    // Eje Y
    ctx.moveTo(originScreen.x, 0);
    ctx.lineTo(originScreen.x, h);
    ctx.stroke();

    // Flechas en los extremos de los ejes
    this.drawArrow(w - 12, originScreen.y, w, originScreen.y, '#334155');
    this.drawArrow(originScreen.x, 12, originScreen.x, 0, '#334155');

    // Etiquetas de los ejes
    ctx.font = 'bold 12px "Outfit", sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(this.options.xLabel, w - 45, originScreen.y > h - 25 ? originScreen.y - 10 : originScreen.y + 18);
    ctx.fillText(this.options.yLabel, originScreen.x < 50 ? originScreen.x + 10 : originScreen.x - 45, 18);

    // 3. Marcas (Ticks) y Números sobre los ejes
    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    // Ticks sobre Eje X
    for (let x = startMajorX; x <= maxWorld.x; x += stepX) {
      if (Math.abs(x) < stepX * 0.001) continue; // Saltar el 0
      const sx = this.worldToScreen(x, 0).x;
      const sy = originScreen.y;

      ctx.beginPath();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.moveTo(sx, sy - 4);
      ctx.lineTo(sx, sy + 4);
      ctx.stroke();

      const numLabel = Math.abs(x) >= 10 || Number.isInteger(x) ? x.toFixed(0) : x.toFixed(1);
      ctx.fillText(numLabel, sx, sy + 6);
    }

    // Ticks sobre Eje Y
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = startMajorY; y <= maxWorld.y; y += stepY) {
      if (Math.abs(y) < stepY * 0.001) continue; // Saltar el 0
      const sx = originScreen.x;
      const sy = this.worldToScreen(0, y).y;

      ctx.beginPath();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.2;
      ctx.moveTo(sx - 4, sy);
      ctx.lineTo(sx + 4, sy);
      ctx.stroke();

      const numLabel = Math.abs(y) >= 10 || Number.isInteger(y) ? y.toFixed(0) : y.toFixed(1);
      ctx.fillText(numLabel, sx - 6, sy);
    }

    // Origen (0,0)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText('0', originScreen.x - 4, originScreen.y + 4);

    // 4. Dibujar Curvas registradas
    for (const curve of this.curves) {
      if (!curve.active) continue;
      this.drawPlotCurve(curve);
    }

    // 5. Si está en modo Selección/Inspección, mostrar cursor inspector
    if (this.mode === 'select' && this.hoverCoord.active) {
      this.drawInspectorPoint();
    }
  }

  drawPlotCurve(curve) {
    const ctx = this.ctx;
    const w = this.width;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = curve.color || this.options.strokeColor;
    ctx.lineWidth = curve.width || this.options.strokeWidth;
    ctx.setLineDash(curve.dash || this.options.lineDash);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    let firstPoint = true;
    // Paso de muestreo en pantalla (cada 2 píxeles para máxima suavidad)
    for (let sx = 0; sx <= w; sx += 2) {
      const world = this.screenToWorld(sx, 0);
      const wy = curve.func(world.x);

      if (isNaN(wy) || !isFinite(wy)) {
        firstPoint = true;
        continue;
      }

      const sy = this.worldToScreen(0, wy).y;

      if (firstPoint) {
        ctx.moveTo(sx, sy);
        firstPoint = false;
      } else {
        ctx.lineTo(sx, sy);
      }
    }
    ctx.stroke();
    ctx.restore();
  }

  drawInspectorPoint() {
    if (this.curves.length === 0) return;
    const curve = this.curves[0];
    const wx = this.hoverCoord.x;
    const wy = curve.func(wx);
    const screen = this.worldToScreen(wx, wy);

    const ctx = this.ctx;
    // Líneas guías punteadas hacia los ejes
    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(screen.x, screen.y);
    ctx.lineTo(screen.x, this.worldToScreen(0, 0).y);
    ctx.moveTo(screen.x, screen.y);
    ctx.lineTo(this.worldToScreen(0, 0).x, screen.y);
    ctx.stroke();

    // Punto resaltado
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Tooltip flotante con coordenadas
    const label = `(${wx.toFixed(2)}, ${wy.toFixed(2)})`;
    ctx.font = 'bold 11px "Fira Code", monospace';
    const textWidth = ctx.measureText(label).width;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.fillRect(screen.x + 10, screen.y - 25, textWidth + 14, 20);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, screen.x + 17 + textWidth, screen.y - 12);
    ctx.restore();
  }

  drawArrow(fromX, fromY, toX, toY, color) {
    const ctx = this.ctx;
    const headlen = 8;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headlen * Math.cos(angle - Math.PI / 6), toY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headlen * Math.cos(angle + Math.PI / 6), toY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

// Exportar al objeto window para acceso global
window.GeoGebraCartesianPlane = GeoGebraCartesianPlane;
