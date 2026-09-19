/**
 * MASSimulationLab
 * Laboratorio dinámico acoplado: Masa-Resorte interactivo,
 * Círculo de referencia fasorial y curvas cinemáticas en vivo.
 */
class MASSimulationLab {
  constructor(containerId) {
    this.container = typeof containerId === 'string'
      ? document.querySelector(containerId)
      : containerId;

    if (!this.container) return;

    // Parámetros físicos (en unidades S.I.)
    this.params = {
      A: 0.15,      // Amplitud en metros (15 cm)
      m: 0.5,       // Masa en kg
      k: 20.0,      // Constante del resorte en N/m
      phi0: 0,      // Fase inicial en rad
      speed: 1.0    // Multiplicador de velocidad
    };

    // Estado dinámico
    this.state = {
      t: 0,
      isPlaying: true,
      isDraggingMass: false,
      lastTimestamp: null
    };
    this.isActive = true;

    // Curvas cinemáticas visibles
    this.visibleCurves = {
      pos: true,
      vel: true,
      acc: true
    };

    // Historial para el trazado en vivo
    this.history = [];
    this.maxHistoryTime = 8; // Mostrar últimos 8 segundos

    this.initDOM();
    this.initCanvases();
    this.initEvents();
    this.updatePhysicsDerived();

    // Iniciar bucle de animación
    this.animationLoop = this.animationLoop.bind(this);
    requestAnimationFrame(this.animationLoop);
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="sim-lab-wrapper">
        <!-- Telemetría Física en Vivo -->
        <div class="sim-telemetry-bar">
          <div class="telemetry-item">
            <span class="telemetry-label">Tiempo (t)</span>
            <span class="telemetry-value telemetry-t">0.00 s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label" style="color:var(--color-dato-azul);">Elongación x(t)</span>
            <span class="telemetry-value telemetry-x" style="color:var(--color-dato-azul);">0.00 m</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label" style="color:#059669;">Velocidad v(t)</span>
            <span class="telemetry-value telemetry-v" style="color:#059669;">0.00 m/s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label" style="color:#dc2626;">Aceleración a(t)</span>
            <span class="telemetry-value telemetry-a" style="color:#dc2626;">0.00 m/s²</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Frecuencia Angular (ω)</span>
            <span class="telemetry-value telemetry-omega">6.32 rad/s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Período (T)</span>
            <span class="telemetry-value telemetry-t-period">0.99 s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Frecuencia (f)</span>
            <span class="telemetry-value telemetry-freq">1.01 Hz</span>
          </div>
        </div>

        <!-- Escenarios Visuales (Canvas Dual) -->
        <div class="sim-stage-grid">
          <!-- Escenario Físico: Masa-Resorte y Fasor de Referencia -->
          <div class="sim-box">
            <div class="sim-box-header">
              <span>Oscilador Masa-Resorte & Fasor de Referencia</span>
              <span style="font-size:0.75rem; color:#64748b;">(Arrastra la masa para alterar x)</span>
            </div>
            <div class="sim-box-body">
              <canvas class="sim-box-canvas canvas-physics"></canvas>
            </div>
          </div>

          <!-- Escenario Gráfico GeoGebra: Curvas x(t), v(t), a(t) -->
          <div class="sim-box">
            <div class="sim-box-header">
              <span>Cinemática Sincronizada en Tiempo Real</span>
              <div class="curve-toggle-pills">
                <button class="curve-pill pill-pos active" data-curve="pos">x(t)</button>
                <button class="curve-pill pill-vel active" data-curve="vel">v(t)</button>
                <button class="curve-pill pill-acc active" data-curve="acc">a(t)</button>
              </div>
            </div>
            <div class="sim-box-body">
              <canvas class="sim-box-canvas canvas-kinematics"></canvas>
            </div>
          </div>
        </div>

        <!-- Panel de Deslizadores de Parámetros -->
        <div class="sim-controls-panel">
          <div class="control-group">
            <div class="control-label-row">
              <span>Amplitud (A)</span>
              <strong class="label-val-A">0.15 m</strong>
            </div>
            <input type="range" class="control-slider slider-A" min="0.05" max="0.25" step="0.01" value="0.15">
          </div>

          <div class="control-group">
            <div class="control-label-row">
              <span>Masa (m)</span>
              <strong class="label-val-m">0.50 kg</strong>
            </div>
            <input type="range" class="control-slider slider-m" min="0.1" max="2.0" step="0.05" value="0.5">
          </div>

          <div class="control-group">
            <div class="control-label-row">
              <span>Constante Elástica (k)</span>
              <strong class="label-val-k">20.0 N/m</strong>
            </div>
            <input type="range" class="control-slider slider-k" min="5" max="60" step="1" value="20">
          </div>

          <div class="control-group">
            <div class="control-label-row">
              <span>Fase Inicial (ϕ₀)</span>
              <strong class="label-val-phi">0.00 rad (0°)</strong>
            </div>
            <input type="range" class="control-slider slider-phi" min="0" max="6.283" step="0.1" value="0">
          </div>

          <!-- Preajustes Rápidos de Laboratorio -->
          <div class="sim-presets-bar">
            <span class="sim-preset-label"><i data-lucide="sliders" style="width:12px;height:12px;display:inline-block;vertical-align:middle;"></i> Preajustes:</span>
            <button class="sim-preset-btn" data-preset="default">Predeterminado</button>
            <button class="sim-preset-btn" data-preset="high-freq">Alta Frecuencia (k↑)</button>
            <button class="sim-preset-btn" data-preset="heavy-mass">Masa Pesada (m↑)</button>
            <button class="sim-preset-btn" data-preset="max-amp">Amplitud Máxima</button>
          </div>
        </div>

        <!-- Barra de Reproducción y Velocidad -->
        <div class="sim-playback-strip">
          <div class="playback-actions">
            <button class="sim-play-btn btn-play-pause">
              <i data-lucide="pause"></i>
              <span class="play-btn-text">Pausar</span>
            </button>
            <button class="sim-btn-secondary btn-step" title="Avanzar un paso (0.05s)">
              <i data-lucide="step-forward"></i> Paso
            </button>
            <button class="sim-btn-secondary btn-reset" title="Restablecer tiempo t=0">
              <i data-lucide="rotate-ccw"></i> Reiniciar
            </button>
          </div>

          <div class="speed-selector-group">
            <span style="font-size:0.75rem; color:#64748b; font-weight:600; margin:0 4px;">Velocidad:</span>
            <button class="speed-btn" data-speed="0.25">0.25×</button>
            <button class="speed-btn" data-speed="0.5">0.5×</button>
            <button class="speed-btn active" data-speed="1.0">1×</button>
            <button class="speed-btn" data-speed="2.0">2×</button>
          </div>
        </div>
      </div>
    `;

    // Bindings de elementos de la interfaz
    this.canvasPhysics = this.container.querySelector('.canvas-physics');
    this.canvasKinematics = this.container.querySelector('.canvas-kinematics');
    this.ctxPhysics = this.canvasPhysics.getContext('2d');
    this.ctxKinematics = this.canvasKinematics.getContext('2d');

    this.elT = this.container.querySelector('.telemetry-t');
    this.elX = this.container.querySelector('.telemetry-x');
    this.elV = this.container.querySelector('.telemetry-v');
    this.elA = this.container.querySelector('.telemetry-a');
    this.elOmega = this.container.querySelector('.telemetry-omega');
    this.elTPeriod = this.container.querySelector('.telemetry-t-period');
    this.elFreq = this.container.querySelector('.telemetry-freq');

    this.playBtn = this.container.querySelector('.btn-play-pause');
    this.playBtnText = this.container.querySelector('.play-btn-text');

    if (window.lucide) {
      window.lucide.createIcons({ root: this.container });
    }
  }

  initCanvases() {
    this.handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      [this.canvasPhysics, this.canvasKinematics].forEach(c => {
        if (!c || !c.parentElement) return;
        const rect = c.parentElement.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        c.width = rect.width * dpr;
        c.height = rect.height * dpr;
        const ctx = c.getContext('2d');
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
        c.styleWidth = rect.width;
        c.styleHeight = rect.height;
      });
    };

    window.addEventListener('resize', this.handleResize);
    setTimeout(this.handleResize, 60);
  }

  updatePhysicsDerived() {
    // ω = sqrt(k / m)
    this.omega = Math.sqrt(this.params.k / this.params.m);
    // T = 2π / ω
    this.period = (2 * Math.PI) / this.omega;
    // f = 1 / T
    this.freq = 1 / this.period;

    // Actualizar etiquetas fijas de telemetría
    this.elOmega.textContent = `${this.omega.toFixed(2)} rad/s`;
    this.elTPeriod.textContent = `${this.period.toFixed(2)} s`;
    this.elFreq.textContent = `${this.freq.toFixed(2)} Hz`;
  }

  initEvents() {
    // Sliders
    const sA = this.container.querySelector('.slider-A');
    const sM = this.container.querySelector('.slider-m');
    const sK = this.container.querySelector('.slider-k');
    const sPhi = this.container.querySelector('.slider-phi');

    sA.addEventListener('input', (e) => {
      this.params.A = parseFloat(e.target.value);
      this.container.querySelector('.label-val-A').textContent = `${this.params.A.toFixed(2)} m`;
    });

    sM.addEventListener('input', (e) => {
      this.params.m = parseFloat(e.target.value);
      this.container.querySelector('.label-val-m').textContent = `${this.params.m.toFixed(2)} kg`;
      this.updatePhysicsDerived();
    });

    sK.addEventListener('input', (e) => {
      this.params.k = parseFloat(e.target.value);
      this.container.querySelector('.label-val-k').textContent = `${this.params.k.toFixed(1)} N/m`;
      this.updatePhysicsDerived();
    });

    sPhi.addEventListener('input', (e) => {
      this.params.phi0 = parseFloat(e.target.value);
      const deg = Math.round((this.params.phi0 * 180) / Math.PI);
      this.container.querySelector('.label-val-phi').textContent = `${this.params.phi0.toFixed(2)} rad (${deg}°)`;
    });

    // Botón Play / Pause
    this.playBtn.addEventListener('click', () => {
      this.state.isPlaying = !this.state.isPlaying;
      this.playBtnText.textContent = this.state.isPlaying ? 'Pausar' : 'Reanudar';
      this.playBtn.querySelector('i').setAttribute('data-lucide', this.state.isPlaying ? 'pause' : 'play');
      if (window.lucide) window.lucide.createIcons({ root: this.playBtn });
    });

    // Botón Step
    this.container.querySelector('.btn-step').addEventListener('click', () => {
      this.state.isPlaying = false;
      this.playBtnText.textContent = 'Reanudar';
      this.playBtn.querySelector('i').setAttribute('data-lucide', 'play');
      if (window.lucide) window.lucide.createIcons({ root: this.playBtn });
      this.stepPhysics(0.04);
    });

    // Botón Reset
    this.container.querySelector('.btn-reset').addEventListener('click', () => {
      this.state.t = 0;
      this.history = [];
      this.updatePhysicsDerived();
    });

    // Botones de velocidad
    this.container.querySelectorAll('.speed-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.container.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.params.speed = parseFloat(btn.dataset.speed);
      });
    });

    // Toggles de curvas
    this.container.querySelectorAll('.curve-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const curve = pill.dataset.curve;
        this.visibleCurves[curve] = !this.visibleCurves[curve];
        pill.classList.toggle('active', this.visibleCurves[curve]);
      });
    });

    // Arrastre interactivo de la masa con el ratón o táctil
    const onDragStart = (clientX) => {
      const rect = this.canvasPhysics.getBoundingClientRect();
      const x = clientX - rect.left;
      const centerY = rect.height / 2;
      const centerX = rect.width * 0.58;
      const currentMassX = centerX + (this.currentX / this.params.A) * (rect.width * 0.28);
      
      if (Math.abs(x - currentMassX) < 40) {
        this.state.isDraggingMass = true;
        this.state.isPlaying = false;
        this.playBtnText.textContent = 'Reanudar';
      }
    };

    const onDragMove = (clientX) => {
      if (!this.state.isDraggingMass) return;
      const rect = this.canvasPhysics.getBoundingClientRect();
      const x = clientX - rect.left;
      const centerX = rect.width * 0.58;
      const maxDispPx = rect.width * 0.28;
      let ratio = (x - centerX) / maxDispPx;
      ratio = Math.max(-1, Math.min(1, ratio));
      
      // Ajustar la fase inicial para que coincida con el desplazamiento manual
      this.params.phi0 = Math.acos(ratio);
      this.state.t = 0;
      this.history = [];
    };

    const onDragEnd = () => {
      if (this.state.isDraggingMass) {
        this.state.isDraggingMass = false;
        this.state.isPlaying = true;
        this.playBtnText.textContent = 'Pausar';
      }
    };

    this.canvasPhysics.addEventListener('mousedown', (e) => onDragStart(e.clientX));
    window.addEventListener('mousemove', (e) => onDragMove(e.clientX));
    window.addEventListener('mouseup', onDragEnd);

    this.canvasPhysics.addEventListener('touchstart', (e) => onDragStart(e.touches[0].clientX), { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (this.state.isDraggingMass) onDragMove(e.touches[0].clientX);
    }, { passive: true });
    window.addEventListener('touchend', onDragEnd);

    // Eventos de botones de preajustes
    this.container.querySelectorAll('.sim-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyPreset(btn.dataset.preset);
      });
    });
  }

  applyPreset(preset) {
    if (preset === 'default') {
      this.params.A = 0.15;
      this.params.m = 0.50;
      this.params.k = 20.0;
      this.params.phi0 = 0;
    } else if (preset === 'high-freq') {
      this.params.A = 0.12;
      this.params.m = 0.20;
      this.params.k = 50.0;
      this.params.phi0 = 0;
    } else if (preset === 'heavy-mass') {
      this.params.A = 0.18;
      this.params.m = 1.80;
      this.params.k = 15.0;
      this.params.phi0 = Math.PI / 4;
    } else if (preset === 'max-amp') {
      this.params.A = 0.25;
      this.params.m = 0.60;
      this.params.k = 30.0;
      this.params.phi0 = Math.PI / 2;
    }

    this.updateControlsUI();
    this.updatePhysicsDerived();
    this.state.t = 0;
    this.history = [];
  }

  updateControlsUI() {
    const sA = this.container.querySelector('.slider-A');
    const sM = this.container.querySelector('.slider-m');
    const sK = this.container.querySelector('.slider-k');
    const sPhi = this.container.querySelector('.slider-phi');
    if (sA) { sA.value = this.params.A; this.container.querySelector('.label-val-A').textContent = `${this.params.A.toFixed(2)} m`; }
    if (sM) { sM.value = this.params.m; this.container.querySelector('.label-val-m').textContent = `${this.params.m.toFixed(2)} kg`; }
    if (sK) { sK.value = this.params.k; this.container.querySelector('.label-val-k').textContent = `${this.params.k.toFixed(1)} N/m`; }
    if (sPhi) { 
      sPhi.value = this.params.phi0; 
      const deg = Math.round((this.params.phi0 * 180) / Math.PI);
      this.container.querySelector('.label-val-phi').textContent = `${this.params.phi0.toFixed(2)} rad (${deg}°)`;
    }
  }

  setActive(active) {
    this.isActive = active;
    if (active) {
      this.state.lastTimestamp = null;
      if (this.handleResize) {
        setTimeout(this.handleResize, 50);
      }
    }
  }

  stepPhysics(dt) {
    this.state.t += dt * this.params.speed;

    const t = this.state.t;
    const w = this.omega;
    const A = this.params.A;
    const phi = this.params.phi0;

    // Ecuaciones analíticas canónicas del M.A.S.
    // x(t) = A * cos(w*t + phi)
    const x = A * Math.cos(w * t + phi);
    // v(t) = -A * w * sin(w*t + phi)
    const v = -A * w * Math.sin(w * t + phi);
    // a(t) = -A * w^2 * cos(w*t + phi) = -w^2 * x
    const a = -w * w * x;

    this.currentX = x;
    this.currentV = v;
    this.currentA = a;

    // Guardar en historial para la gráfica en vivo
    this.history.push({ t, x, v, a });
    // Mantener sólo el tiempo máximo establecido
    const minT = t - this.maxHistoryTime;
    while (this.history.length > 0 && this.history[0].t < minT) {
      this.history.shift();
    }

    // Actualizar lecturas en pantalla
    this.elT.textContent = `${t.toFixed(2)} s`;
    this.elX.textContent = `${x >= 0 ? '+' : ''}${x.toFixed(3)} m`;
    this.elV.textContent = `${v >= 0 ? '+' : ''}${v.toFixed(3)} m/s`;
    this.elA.textContent = `${a >= 0 ? '+' : ''}${a.toFixed(2)} m/s²`;
  }

  animationLoop(timestamp) {
    if (this.isActive === false) {
      this.animId = requestAnimationFrame(this.animationLoop);
      return;
    }

    if (!this.state.lastTimestamp) this.state.lastTimestamp = timestamp;
    const delta = Math.min((timestamp - this.state.lastTimestamp) / 1000, 0.1);
    this.state.lastTimestamp = timestamp;

    if (this.state.isPlaying) {
      this.stepPhysics(delta);
    }

    this.renderPhysicsStage();
    this.renderKinematicsStage();

    this.animId = requestAnimationFrame(this.animationLoop);
  }

  renderPhysicsStage() {
    const ctx = this.ctxPhysics;
    const w = this.canvasPhysics.styleWidth || 400;
    const h = this.canvasPhysics.styleHeight || 300;

    ctx.clearRect(0, 0, w, h);

    // Dividir escenario: Izquierda = Fasor (Círculo de referencia), Derecha = Masa-Resorte
    const phasorCenterX = w * 0.22;
    const phasorCenterY = h * 0.52;
    const phasorRadius = Math.min(w * 0.16, h * 0.35);

    const springAnchorX = w * 0.46;
    const springCenterY = h * 0.52;
    const eqX = w * 0.72; // Posición de equilibrio (x = 0)
    const dispScale = (w * 0.22) / this.params.A; // Escala en píxeles

    const massX = eqX + this.currentX * dispScale;
    const massY = springCenterY;
    const massWidth = 44;
    const massHeight = 44;

    // 1. DIBUJAR CÍRCULO FASORIAL DE REFERENCIA
    ctx.save();
    // Círculo base
    ctx.beginPath();
    ctx.arc(phasorCenterX, phasorCenterY, phasorRadius, 0, Math.PI * 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = 'rgba(241, 245, 249, 0.5)';
    ctx.fill();

    // Ejes fasoriales
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.setLineDash([3, 3]);
    ctx.moveTo(phasorCenterX - phasorRadius - 8, phasorCenterY);
    ctx.lineTo(phasorCenterX + phasorRadius + 8, phasorCenterY);
    ctx.moveTo(phasorCenterX, phasorCenterY - phasorRadius - 8);
    ctx.lineTo(phasorCenterX, phasorCenterY + phasorRadius + 8);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vector fasor A rotatorio: ángulo theta = w*t + phi0
    const theta = -(this.omega * this.state.t + this.params.phi0); // Sentido antihorario (canvas invertido en Y)
    const tipX = phasorCenterX + phasorRadius * Math.cos(theta);
    const tipY = phasorCenterY + phasorRadius * Math.sin(theta);

    // Vector A (flecha indigo)
    ctx.beginPath();
    ctx.strokeStyle = '#4f46e5';
    ctx.lineWidth = 2.5;
    ctx.moveTo(phasorCenterX, phasorCenterY);
    ctx.lineTo(tipX, tipY);
    ctx.stroke();

    // Punta de flecha fasor
    this.drawArrowTip(ctx, phasorCenterX, phasorCenterY, tipX, tipY, '#4f46e5');

    // Punto en la punta del fasor
    ctx.beginPath();
    ctx.arc(tipX, tipY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#4f46e5';
    ctx.fill();

    // Etiqueta del fasor A
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.fillStyle = '#312e81';
    ctx.fillText('A (Fasor)', phasorCenterX - 24, phasorCenterY - phasorRadius - 12);

    // Línea de proyección fasor -> masa oscilante
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX, phasorCenterY); // proyección vertical al eje x fasorial
    ctx.lineTo(massX, massY);        // enlace a la masa
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // 2. DIBUJAR SISTEMA MASA-RESORTE
    // Pared de anclaje
    ctx.save();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(springAnchorX - 10, massY - 35, 10, 70);

    // Rayado de pared
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    for (let py = massY - 32; py <= massY + 32; py += 8) {
      ctx.beginPath();
      ctx.moveTo(springAnchorX - 10, py);
      ctx.lineTo(springAnchorX - 16, py + 6);
      ctx.stroke();
    }

    // Suelo horizontal de deslizamiento
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.8;
    ctx.moveTo(springAnchorX, massY + massHeight / 2);
    ctx.lineTo(w - 10, massY + massHeight / 2);
    ctx.stroke();

    // Línea de equilibrio x = 0
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.moveTo(eqX, massY - 50);
    ctx.lineTo(eqX, massY + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px "Fira Code", monospace';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('x = 0', eqX, massY + 62);
    ctx.fillText('-A', eqX - this.params.A * dispScale, massY + 62);
    ctx.fillText('+A', eqX + this.params.A * dispScale, massY + 62);

    // Resorte con espiras físicas
    this.drawSpring(ctx, springAnchorX, massY, massX - massWidth / 2, massY, 14, 16);

    // Masa bloque
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(massX - massWidth / 2, massY - massHeight / 2, massWidth, massHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Texto sobre la masa
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "Outfit", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.params.m} kg`, massX, massY);

    // Vector Fuerza Restauradora F = -kx
    const forceLength = -this.currentX * 120;
    if (Math.abs(forceLength) > 4) {
      ctx.beginPath();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      ctx.moveTo(massX, massY - 28);
      ctx.lineTo(massX + forceLength, massY - 28);
      ctx.stroke();
      this.drawArrowTip(ctx, massX, massY - 28, massX + forceLength, massY - 28, '#ea580c');

      ctx.font = '9px "Fira Code", monospace';
      ctx.fillStyle = '#ea580c';
      ctx.fillText('F', massX + forceLength / 2, massY - 36);
    }

    ctx.restore();
  }

  drawSpring(ctx, x1, y1, x2, y2, coils, radius) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const leadIn = 16;
    const leadOut = 16;
    const coilLength = dist - leadIn - leadOut;

    ctx.moveTo(0, 0);
    ctx.lineTo(leadIn, 0);

    const step = coilLength / coils;
    for (let i = 0; i < coils; i++) {
      const cx1 = leadIn + i * step + step * 0.25;
      const cy1 = -radius;
      const cx2 = leadIn + i * step + step * 0.75;
      const cy2 = radius;
      ctx.lineTo(cx1, cy1);
      ctx.lineTo(cx2, cy2);
    }

    ctx.lineTo(dist - leadOut, 0);
    ctx.lineTo(dist, 0);
    ctx.stroke();
    ctx.restore();
  }

  drawArrowTip(ctx, fromX, fromY, toX, toY, color) {
    const headlen = 7;
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

  renderKinematicsStage() {
    const ctx = this.ctxKinematics;
    const w = this.canvasKinematics.styleWidth || 400;
    const h = this.canvasKinematics.styleHeight || 300;

    ctx.clearRect(0, 0, w, h);

    const originX = 40;
    const originY = h * 0.5;
    const plotWidth = w - 50;

    // Cuadrícula milimetrada de fondo
    ctx.save();
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = originX; x <= w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Eje Horizontal (t) y Vertical (magnitudes)
    ctx.beginPath();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.moveTo(originX, originY);
    ctx.lineTo(w, originY);
    ctx.moveTo(originX, 10);
    ctx.lineTo(originX, h - 10);
    ctx.stroke();

    ctx.font = '10px "Outfit", sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText('t (s)', w - 24, originY - 8);
    ctx.fillText('Valores Normalizados', originX + 6, 20);

    // Si no hay historial suficiente
    if (this.history.length < 2) {
      ctx.restore();
      return;
    }

    const currentT = this.state.t;
    const startT = currentT - this.maxHistoryTime;
    const timeScale = plotWidth / this.maxHistoryTime;

    // Factores de normalización visual para comparar en el mismo gráfico
    const scaleX = (h * 0.38) / this.params.A;
    const vMax = this.params.A * this.omega || 1;
    const scaleV = (h * 0.38) / vMax;
    const aMax = this.params.A * this.omega * this.omega || 1;
    const scaleA = (h * 0.38) / aMax;

    // Curva x(t) (Azul)
    if (this.visibleCurves.pos) {
      ctx.beginPath();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2.5;
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        const sx = originX + (pt.t - startT) * timeScale;
        const sy = originY - pt.x * scaleX;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
    }

    // Curva v(t) (Verde)
    if (this.visibleCurves.vel) {
      ctx.beginPath();
      ctx.strokeStyle = '#059669';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        const sx = originX + (pt.t - startT) * timeScale;
        const sy = originY - pt.v * scaleV;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Curva a(t) (Rojo)
    if (this.visibleCurves.acc) {
      ctx.beginPath();
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([2, 3]);
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        const sx = originX + (pt.t - startT) * timeScale;
        const sy = originY - pt.a * scaleA;
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Cursor vertical en el punto actual (extremo derecho)
    const currentScreenX = originX + (currentT - startT) * timeScale;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.4)';
    ctx.lineWidth = 1;
    ctx.moveTo(currentScreenX, 10);
    ctx.lineTo(currentScreenX, h - 10);
    ctx.stroke();

    ctx.restore();
  }
}

// Exponer globalmente
window.MASSimulationLab = MASSimulationLab;
