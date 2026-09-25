/**
 * VintageExercisesLab
 * Laboratorio Gráfico Interactivo para los Ejercicios de M.A.S., Resortes y Péndulo
 * Estilo: Tratado Científico Clásico, Grabado de Época y Pergamino Milimetrado
 */
(function() {
  class VintageExercisesLab {
    constructor(containerSelector) {
      this.container = typeof containerSelector === 'string' 
        ? document.querySelector(containerSelector) 
        : containerSelector;
      if (!this.container) return;

      this.activeTab = 'spring'; // 'spring' | 'pendulum' | 'piston'
      this.isPlaying = true;
      this.simTime = 0;
      this.speed = 1.0;
      this.lastFrameTime = performance.now();
      this.animationId = null;
      this.historyData = [];
      this.maxHistory = 240;

      // Parámetros físicos según enunciados de los ejercicios
      // Ejercicio 1 & 4 (Resorte)
      this.springConfig = {
        mode: 'ej1', // 'ej1' o 'ej4'
        m1: 0.60,      // kg (Ej. 1)
        k1: 130.0,     // N/m (Ej. 1)
        x0_1: 0.13,    // m (Ej. 1)
        m4: 7.00,      // kg (Ej. 4)
        k4: 40.88,     // N/m (Ej. 4)
        T4: 2.60       // s (Ej. 4)
      };

      // Ejercicio 17 (Péndulo)
      this.pendulumConfig = {
        L: 0.559,      // m (55.9 cm)
        g: 9.80,       // m/s^2
        T: 1.50,       // s (120 oscilaciones en 180 s)
        theta0: 0.22,  // rad (~12.6 grados, régimen lineal de pequeñas oscilaciones)
        cycleCount: 0
      };

      // Ejercicio 2 (Pistón)
      this.pistonConfig = {
        f: 60,         // Hz (3600 rpm / 60)
        omega: 376.99, // rad/s
        A: 0.650,      // m (65.00 cm)
        vMax: 245,     // m/s
        aMax: 92400    // m/s^2
      };

      this.initDOM();
      this.initCanvas();
      this.bindEvents();
      this.start();
    }

    initDOM() {
      this.container.innerHTML = `
        <div class="vintage-lab-card">
          <div class="vintage-lab-header">
            <div class="vintage-lab-title-group">
              <div class="vintage-lab-seal">
                <i data-lucide="compass"></i>
              </div>
              <div>
                <h3 class="vintage-lab-title">Laboratorio Gráfico Interactivo de los Ejercicios</h3>
                <p class="vintage-lab-subtitle">Visualización analítica en vivo del oscilador elástico, péndulo isócrono y cinemática armónica</p>
              </div>
            </div>

            <!-- Selector de Modos / Ejercicios -->
            <div class="vintage-lab-tabs" role="tablist">
              <button class="vintage-lab-tab active" data-tab="spring">
                <i data-lucide="activity"></i> Resorte & Ley de Hooke (Ej. 1 & 4)
              </button>
              <button class="vintage-lab-tab" data-tab="pendulum">
                <i data-lucide="clock"></i> Péndulo Simple (Ej. 17)
              </button>
              <button class="vintage-lab-tab" data-tab="piston">
                <i data-lucide="gauge"></i> Cinemática del Pistón (Ej. 2)
              </button>
            </div>
          </div>

          <!-- Lienzo Gráfico Principal -->
          <div class="vintage-lab-canvas-wrapper">
            <canvas id="vintage-lab-canvas" class="vintage-lab-canvas"></canvas>
            <div class="vintage-lab-watermark">CÓDICE GRÁFICO &bull; FÍSICA III</div>
          </div>

          <!-- Barra de Telemetría Dinámica -->
          <div class="vintage-lab-telemetry" id="vintage-lab-telemetry">
            <!-- Rellenado dinámicamente según el modo -->
          </div>

          <!-- Controles de Simulación -->
          <div class="vintage-lab-controls">
            <div class="lab-controls-left">
              <button class="btn-lab-action" id="lab-btn-play" title="Pausar / Reanudar">
                <i data-lucide="pause"></i> <span id="lab-play-text">Pausar</span>
              </button>
              <button class="btn-lab-action" id="lab-btn-reset" title="Reiniciar tiempo a t = 0">
                <i data-lucide="rotate-ccw"></i> Reiniciar
              </button>
              <div class="lab-speed-group">
                <span class="lab-control-label">Velocidad:</span>
                <button class="lab-speed-btn active" data-speed="1.0">1.0x</button>
                <button class="lab-speed-btn" data-speed="0.5">0.5x</button>
                <button class="lab-speed-btn" data-speed="0.2">0.2x (Cámara lenta)</button>
              </div>
            </div>

            <div class="lab-controls-right" id="lab-submode-controls">
              <!-- Botones de submodo opcionales (Ej 1 vs Ej 4) -->
              <span class="lab-control-label">Configuración:</span>
              <button class="lab-submode-btn active" data-submode="ej1">Ej. 1 (m=0.60 kg, k=130 N/m)</button>
              <button class="lab-submode-btn" data-submode="ej4">Ej. 4 (m=7.00 kg, T=2.60 s)</button>
            </div>
          </div>
        </div>
      `;

      if (window.lucide) {
        window.lucide.createIcons({ root: this.container });
      }
    }

    initCanvas() {
      this.canvas = this.container.querySelector('#vintage-lab-canvas');
      this.ctx = this.canvas.getContext('2d');
      this.resize();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = (rect.width || 800) * dpr;
      this.canvas.height = (rect.height || 420) * dpr;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.width = rect.width || 800;
      this.height = rect.height || 420;
    }

    bindEvents() {
      // Pestañas
      const tabBtns = this.container.querySelectorAll('.vintage-lab-tab');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          tabBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.activeTab = btn.dataset.tab;
          this.simTime = 0;
          this.historyData = [];
          
          const submodeControls = this.container.querySelector('#lab-submode-controls');
          if (submodeControls) {
            submodeControls.style.display = (this.activeTab === 'spring') ? 'flex' : 'none';
          }
          this.render();
        });
      });

      // Play / Pause
      const playBtn = this.container.querySelector('#lab-btn-play');
      const playText = this.container.querySelector('#lab-play-text');
      if (playBtn) {
        playBtn.addEventListener('click', () => {
          this.isPlaying = !this.isPlaying;
          if (playBtn.querySelector('i')) {
            playBtn.querySelector('i').setAttribute('data-lucide', this.isPlaying ? 'pause' : 'play');
            if (window.lucide) window.lucide.createIcons({ root: playBtn });
          }
          if (playText) playText.textContent = this.isPlaying ? 'Pausar' : 'Reanudar';
          if (this.isPlaying) {
            this.lastFrameTime = performance.now();
            this.loop();
          }
        });
      }

      // Reiniciar
      const resetBtn = this.container.querySelector('#lab-btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.simTime = 0;
          this.historyData = [];
          if (this.pendulumConfig) this.pendulumConfig.cycleCount = 0;
          this.render();
        });
      }

      // Velocidad
      const speedBtns = this.container.querySelectorAll('.lab-speed-btn');
      speedBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          speedBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.speed = parseFloat(btn.dataset.speed);
        });
      });

      // Submodos (Ej 1 vs Ej 4)
      const submodeBtns = this.container.querySelectorAll('.lab-submode-btn');
      submodeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          submodeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.springConfig.mode = btn.dataset.submode;
          this.simTime = 0;
          this.historyData = [];
          this.render();
        });
      });

      window.addEventListener('resize', () => {
        this.resize();
        this.render();
      });
    }

    start() {
      this.isPlaying = true;
      this.lastFrameTime = performance.now();
      this.loop();
    }

    stop() {
      this.isPlaying = false;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }
    }

    setActive(isActive) {
      if (isActive) {
        if (!this.isPlaying) {
          this.isPlaying = true;
          this.lastFrameTime = performance.now();
          this.loop();
        }
      } else {
        this.stop();
      }
    }

    loop() {
      if (!this.isPlaying) return;
      const now = performance.now();
      const dt = Math.min((now - this.lastFrameTime) / 1000, 0.1) * this.speed;
      this.lastFrameTime = now;

      this.simTime += dt;
      this.updatePhysics(dt);
      this.render();
      this.updateTelemetry();

      this.animationId = requestAnimationFrame(() => this.loop());
    }

    updatePhysics(dt) {
      // Guardar historial para gráficas en vivo
      if (this.activeTab === 'spring') {
        const isEj1 = (this.springConfig.mode === 'ej1');
        const m = isEj1 ? this.springConfig.m1 : this.springConfig.m4;
        const k = isEj1 ? this.springConfig.k1 : this.springConfig.k4;
        const A = isEj1 ? this.springConfig.x0_1 : 0.20; // Amplitud
        const omega = Math.sqrt(k / m);
        const x = A * Math.cos(omega * this.simTime);
        const v = -A * omega * Math.sin(omega * this.simTime);
        const a = -Math.pow(omega, 2) * x;
        const F = -k * x;

        this.historyData.push({ t: this.simTime, x, v, a, F });
        if (this.historyData.length > this.maxHistory) this.historyData.shift();

      } else if (this.activeTab === 'pendulum') {
        const L = this.pendulumConfig.L;
        const g = this.pendulumConfig.g;
        const omega = Math.sqrt(g / L);
        const theta = this.pendulumConfig.theta0 * Math.cos(omega * this.simTime);
        const thetaDot = -this.pendulumConfig.theta0 * omega * Math.sin(omega * this.simTime);
        const aTan = -g * Math.sin(theta);

        // Contar ciclos
        const T = this.pendulumConfig.T;
        this.pendulumConfig.cycleCount = Math.floor(this.simTime / T);

        this.historyData.push({ t: this.simTime, theta, thetaDot, aTan });
        if (this.historyData.length > this.maxHistory) this.historyData.shift();

      } else if (this.activeTab === 'piston') {
        // Simular a escala visual comprensible (1.5 Hz visual para mostrar la forma de onda de 60 Hz)
        const visualFreq = 1.2;
        const omegaVis = 2 * Math.PI * visualFreq;
        const normX = Math.cos(omegaVis * this.simTime);
        const normV = -Math.sin(omegaVis * this.simTime);
        const normA = -Math.cos(omegaVis * this.simTime);

        this.historyData.push({ t: this.simTime, normX, normV, normA });
        if (this.historyData.length > this.maxHistory) this.historyData.shift();
      }
    }

    render() {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const w = this.width;
      const h = this.height;

      // 1. Fondo de pergamino milimetrado
      this.drawParchmentBackground(ctx, w, h);

      // 2. Renderizar según la pestaña activa
      if (this.activeTab === 'spring') {
        this.renderSpringOscillator(ctx, w, h);
      } else if (this.activeTab === 'pendulum') {
        this.renderSimplePendulum(ctx, w, h);
      } else if (this.activeTab === 'piston') {
        this.renderPistonKinematics(ctx, w, h);
      }
    }

    drawParchmentBackground(ctx, w, h) {
      // Color base apergaminado
      ctx.fillStyle = '#faf3e6';
      ctx.fillRect(0, 0, w, h);

      // Cuadrícula milimetrada clásica en sepia suave
      ctx.save();
      ctx.strokeStyle = 'rgba(215, 195, 168, 0.45)';
      ctx.lineWidth = 0.8;
      const gridSize = 24;

      for (let x = 0; x < w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Cuadrícula mayor cada 5 celdas
      ctx.strokeStyle = 'rgba(190, 160, 125, 0.65)';
      ctx.lineWidth = 1.2;
      for (let x = 0; x < w; x += gridSize * 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += gridSize * 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Borde de grabado renacentista
      ctx.strokeStyle = '#8f6727';
      ctx.lineWidth = 2;
      ctx.strokeRect(4, 4, w - 8, h - 8);
      ctx.strokeStyle = '#d4c2a5';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, w - 16, h - 16);
      ctx.restore();
    }

    /**
     * MODO 1: RESORTE Y MASA (Ejercicios 1 y 4)
     */
    renderSpringOscillator(ctx, w, h) {
      const isEj1 = (this.springConfig.mode === 'ej1');
      const m = isEj1 ? this.springConfig.m1 : this.springConfig.m4;
      const k = isEj1 ? this.springConfig.k1 : this.springConfig.k4;
      const A = isEj1 ? this.springConfig.x0_1 : 0.20;
      const omega = Math.sqrt(k / m);
      const T = (2 * Math.PI) / omega;

      const x = A * Math.cos(omega * this.simTime);
      const F = -k * x;
      const a = F / m;

      // Dividir el lienzo: lado izquierdo = simulación física, lado derecho = gráfica x(t)
      const isCompact = w < 650;
      const splitX = isCompact ? w : Math.floor(w * 0.48);

      // --- LADO IZQUIERDO: MECANISMO MASA-RESORTE ---
      ctx.save();
      const wallX = 35;
      const floorY = isCompact ? Math.floor(h * 0.42) : Math.floor(h * 0.58);
      const eqX = wallX + (splitX - wallX) * 0.52;
      const scaleMetersToPx = (splitX - wallX) * 1.5;
      const blockX = eqX + x * scaleMetersToPx;
      const blockSize = Math.min(52, Math.max(38, m * 8 + 30));

      // Línea de suelo
      ctx.strokeStyle = '#6e4c27';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(wallX - 10, floorY);
      ctx.lineTo(splitX - 10, floorY);
      ctx.stroke();

      // Rayado de suelo (anclaje)
      ctx.strokeStyle = 'rgba(110, 76, 39, 0.4)';
      ctx.lineWidth = 1;
      for (let sx = wallX; sx < splitX - 15; sx += 12) {
        ctx.beginPath();
        ctx.moveTo(sx, floorY);
        ctx.lineTo(sx - 8, floorY + 8);
        ctx.stroke();
      }

      // Pared fija
      ctx.fillStyle = '#8f6727';
      ctx.fillRect(wallX - 14, floorY - 90, 14, 90);
      ctx.strokeStyle = '#4a2c13';
      ctx.lineWidth = 2;
      ctx.strokeRect(wallX - 14, floorY - 90, 14, 90);

      // Línea vertical punteada de equilibrio (x = 0)
      ctx.save();
      ctx.strokeStyle = '#8f6727';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(eqX, floorY - 95);
      ctx.lineTo(eqX, floorY + 15);
      ctx.stroke();
      ctx.restore();

      // Etiqueta x = 0
      ctx.font = 'bold 12px "EB Garamond", Georgia, serif';
      ctx.fillStyle = '#8f6727';
      ctx.textAlign = 'center';
      ctx.fillText('Equilibrio (x = 0)', eqX, floorY - 100);

      // Resorte helicoidal
      const springStartY = floorY - blockSize / 2;
      const springLen = blockX - wallX;
      this.drawCoiledSpring(ctx, wallX, springStartY, springLen, 24, 16);

      // Bloque de masa
      ctx.fillStyle = '#f0d9b5';
      ctx.strokeStyle = '#5a3818';
      ctx.lineWidth = 2;
      ctx.fillRect(blockX, floorY - blockSize, blockSize, blockSize);
      ctx.strokeRect(blockX, floorY - blockSize, blockSize, blockSize);

      // Detalle estético del bloque (remaches y etiqueta de masa)
      ctx.fillStyle = '#2c1810';
      ctx.font = 'bold 13px "Cinzel", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${m.toFixed(2)} kg`, blockX + blockSize / 2, floorY - blockSize / 2 + 5);

      // Vector Desplazamiento x (Azul)
      if (Math.abs(x) > 0.005) {
        const arrowY = floorY + 22;
        this.drawVectorArrow(ctx, eqX, arrowY, blockX + blockSize / 2, arrowY, '#1b4965', 2);
        ctx.fillStyle = '#1b4965';
        ctx.font = 'bold 12px "Fira Code", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`x = ${(x >= 0 ? '+' : '')}${x.toFixed(2)} m`, (eqX + blockX + blockSize / 2) / 2, arrowY + 14);
      }

      // Vector Fuerza Restauradora F = -kx (Rojo Cinabrio hacia el equilibrio)
      if (Math.abs(F) > 0.2) {
        const arrowFY = floorY - blockSize - 18;
        const arrowLength = Math.max(-70, Math.min(70, F * 3.5));
        const blockCenterX = blockX + blockSize / 2;
        this.drawVectorArrow(ctx, blockCenterX, arrowFY, blockCenterX + arrowLength, arrowFY, '#8c251e', 3);
        ctx.fillStyle = '#8c251e';
        ctx.font = 'bold 12px "Fira Code", monospace';
        ctx.textAlign = arrowLength < 0 ? 'right' : 'left';
        ctx.fillText(`F_rest = ${F.toFixed(1)} N`, blockCenterX + arrowLength + (arrowLength < 0 ? -6 : 6), arrowFY + 4);
      }

      // Título del Ejercicio en el lienzo
      ctx.font = 'bold 14px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#2b170c';
      ctx.textAlign = 'left';
      ctx.fillText(isEj1 ? 'EJERCICIO 1: Resorte Horizontal (k = 130 N/m)' : 'EJERCICIO 4: Oscilador Vertical (k = 40.9 N/m)', 22, 28);
      ctx.restore();

      // --- LADO DERECHO: GRÁFICA SENOIDAL x(t) EN VIVO ---
      if (!isCompact) {
        ctx.save();
        const plotX = splitX + 25;
        const plotY = 40;
        const plotW = w - plotX - 25;
        const plotH = h - 60;
        const midY = plotY + plotH / 2;

        // Fondo de la gráfica (pergamino con marco dorado)
        ctx.fillStyle = 'rgba(255, 250, 240, 0.7)';
        ctx.fillRect(plotX, plotY, plotW, plotH);
        ctx.strokeStyle = '#b88a38';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(plotX, plotY, plotW, plotH);

        // Ejes cartesianos
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 1.5;
        // Eje horizontal (t)
        ctx.beginPath();
        ctx.moveTo(plotX, midY);
        ctx.lineTo(plotX + plotW, midY);
        ctx.stroke();

        // Eje vertical (x)
        ctx.beginPath();
        ctx.moveTo(plotX + 30, plotY);
        ctx.lineTo(plotX + 30, plotY + plotH);
        ctx.stroke();

        // Rótulos de ejes
        ctx.font = 'bold 12px "EB Garamond", Georgia, serif';
        ctx.fillStyle = '#3d2616';
        ctx.textAlign = 'right';
        ctx.fillText('+A', plotX + 26, plotY + 16);
        ctx.fillText('0', plotX + 26, midY + 4);
        ctx.fillText('-A', plotX + 26, plotY + plotH - 8);
        ctx.textAlign = 'left';
        ctx.fillText('t (s) →', plotX + plotW - 35, midY - 6);
        ctx.fillText('x(t) [m]', plotX + 34, plotY + 14);

        // Curva teórica trazada
        ctx.strokeStyle = '#1b4965';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const timeWindow = 3.5; // segundos en pantalla
        const step = 0.03;
        let first = true;

        for (let t = 0; t <= timeWindow; t += step) {
          const px = plotX + 30 + (t / timeWindow) * (plotW - 40);
          const valX = A * Math.cos(omega * t);
          const py = midY - (valX / A) * (plotH * 0.40);
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Marcador del punto instantáneo t actual
        const curTNorm = (this.simTime % timeWindow);
        const curPx = plotX + 30 + (curTNorm / timeWindow) * (plotW - 40);
        const curPy = midY - (x / A) * (plotH * 0.40);

        ctx.fillStyle = '#8c251e';
        ctx.beginPath();
        ctx.arc(curPx, curPy, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#faf4e8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Línea vertical que escanea
        ctx.strokeStyle = 'rgba(140, 37, 30, 0.35)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(curPx, plotY);
        ctx.lineTo(curPx, plotY + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        // Leyenda
        ctx.font = '11px "Fira Code", monospace';
        ctx.fillStyle = '#1b4965';
        ctx.textAlign = 'right';
        ctx.fillText(`x(t) = ${A.toFixed(2)}·cos(${omega.toFixed(1)}t)`, plotX + plotW - 10, plotY + 18);
        ctx.fillText(`T = ${T.toFixed(2)} s | f = ${(1/T).toFixed(2)} Hz`, plotX + plotW - 10, plotY + 34);

        ctx.restore();
      }
    }

    /**
     * MODO 2: PÉNDULO SIMPLE (Ejercicio 17)
     */
    renderSimplePendulum(ctx, w, h) {
      const cfg = this.pendulumConfig;
      const omega = Math.sqrt(cfg.g / cfg.L);
      const theta = cfg.theta0 * Math.cos(omega * this.simTime);
      const T = cfg.T;

      const isCompact = w < 650;
      const splitX = isCompact ? w : Math.floor(w * 0.48);

      // --- LADO IZQUIERDO: DIBUJO DEL PÉNDULO ---
      ctx.save();
      const pivotX = Math.floor(splitX * 0.50);
      const pivotY = 55;
      const armLengthPx = Math.min(h * 0.62, 230);

      // Soporte de madera y pivote de bronce
      ctx.fillStyle = '#5c381c';
      ctx.fillRect(pivotX - 60, pivotY - 14, 120, 14);
      ctx.strokeStyle = '#3a200d';
      ctx.lineWidth = 2;
      ctx.strokeRect(pivotX - 60, pivotY - 14, 120, 14);

      // Pivote circular
      ctx.fillStyle = '#b48a3c';
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, 7, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#5a3818';
      ctx.stroke();

      // Línea vertical punteada de referencia (theta = 0)
      ctx.strokeStyle = 'rgba(143, 103, 39, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(pivotX, pivotY + armLengthPx + 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arco de oscilación
      ctx.strokeStyle = 'rgba(180, 138, 60, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(pivotX, pivotY, armLengthPx * 0.45, Math.PI / 2 - cfg.theta0, Math.PI / 2 + cfg.theta0);
      ctx.stroke();

      // Posición del extremo de la masa
      const bobX = pivotX + armLengthPx * Math.sin(theta);
      const bobY = pivotY + armLengthPx * Math.cos(theta);

      // Hilo del péndulo
      ctx.strokeStyle = '#3d2616';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pivotX, pivotY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Masa esférica (lenteja de bronce/plomo)
      ctx.fillStyle = 'radial-gradient(circle at 30% 30%, #d4a64f, #6d4715)';
      ctx.beginPath();
      ctx.arc(bobX, bobY, 16, 0, 2 * Math.PI);
      ctx.fillStyle = '#a2682a';
      ctx.fill();
      ctx.strokeStyle = '#3b220d';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Vector Restaurador Tangencial F_t = -mg sin(theta)
      const aTan = -cfg.g * Math.sin(theta);
      if (Math.abs(aTan) > 0.1) {
        const vecScale = 12;
        const normAngle = theta + Math.PI / 2;
        const vX = bobX - Math.cos(theta) * (aTan * vecScale);
        const vY = bobY + Math.sin(theta) * (aTan * vecScale);
        this.drawVectorArrow(ctx, bobX, bobY, vX, vY, '#8c251e', 2.5);
      }

      // Títulos y parámetros anotados
      ctx.font = 'bold 14px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#2b170c';
      ctx.textAlign = 'left';
      ctx.fillText('EJERCICIO 17: Péndulo Simple (120 osc en 3 min)', 22, 28);

      ctx.font = 'bold 12px "EB Garamond", Georgia, serif';
      ctx.fillStyle = '#7c481e';
      ctx.fillText(`L = 0.559 m (55.9 cm)`, pivotX + 16, pivotY + armLengthPx * 0.4);
      ctx.fillText(`T = 1.50 s | g = 9.80 m/s²`, 22, h - 20);

      ctx.restore();

      // --- LADO DERECHO: GRÁFICA ANGULAR theta(t) ---
      if (!isCompact) {
        ctx.save();
        const plotX = splitX + 25;
        const plotY = 40;
        const plotW = w - plotX - 25;
        const plotH = h - 60;
        const midY = plotY + plotH / 2;

        ctx.fillStyle = 'rgba(255, 250, 240, 0.7)';
        ctx.fillRect(plotX, plotY, plotW, plotH);
        ctx.strokeStyle = '#b88a38';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(plotX, plotY, plotW, plotH);

        // Ejes
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plotX, midY);
        ctx.lineTo(plotX + plotW, midY);
        ctx.moveTo(plotX + 30, plotY);
        ctx.lineTo(plotX + 30, plotY + plotH);
        ctx.stroke();

        ctx.font = 'bold 12px "EB Garamond", Georgia, serif';
        ctx.fillStyle = '#3d2616';
        ctx.textAlign = 'right';
        ctx.fillText('+θ₀', plotX + 26, plotY + 16);
        ctx.fillText('0', plotX + 26, midY + 4);
        ctx.fillText('-θ₀', plotX + 26, plotY + plotH - 8);
        ctx.textAlign = 'left';
        ctx.fillText('t (s) →', plotX + plotW - 35, midY - 6);
        ctx.fillText('θ(t) [rad]', plotX + 34, plotY + 14);

        // Curva senoidal
        ctx.strokeStyle = '#8f6727';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const timeWindow = 4.5;
        const step = 0.03;
        let first = true;

        for (let t = 0; t <= timeWindow; t += step) {
          const px = plotX + 30 + (t / timeWindow) * (plotW - 40);
          const valTheta = cfg.theta0 * Math.cos(omega * t);
          const py = midY - (valTheta / cfg.theta0) * (plotH * 0.40);
          if (first) {
            ctx.moveTo(px, py);
            first = false;
          } else {
            ctx.lineTo(px, py);
          }
        }
        ctx.stroke();

        // Cursor del punto actual
        const curTNorm = (this.simTime % timeWindow);
        const curPx = plotX + 30 + (curTNorm / timeWindow) * (plotW - 40);
        const curPy = midY - (theta / cfg.theta0) * (plotH * 0.40);

        ctx.fillStyle = '#1b4965';
        ctx.beginPath();
        ctx.arc(curPx, curPy, 6, 0, 2 * Math.PI);
        ctx.fill();
        ctx.strokeStyle = '#faf4e8';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Info en la gráfica
        ctx.font = '11px "Fira Code", monospace';
        ctx.fillStyle = '#2b170c';
        ctx.textAlign = 'right';
        ctx.fillText(`T = 180 s / 120 osc = 1.50 s`, plotX + plotW - 10, plotY + 18);
        ctx.fillText(`L = gT² / (4π²) = 0.559 m`, plotX + plotW - 10, plotY + 34);
        ctx.fillText(`Oscilaciones completadas: ${cfg.cycleCount} / 120`, plotX + plotW - 10, plotY + 50);

        ctx.restore();
      }
    }

    /**
     * MODO 3: PISTÓN EN M.A.S. (Ejercicio 2)
     */
    renderPistonKinematics(ctx, w, h) {
      const isCompact = w < 650;
      const splitX = isCompact ? w : Math.floor(w * 0.42);

      // --- LADO IZQUIERDO: ESQUEMA DEL MECANISMO CIGÜEÑAL-PISTÓN ---
      ctx.save();
      const crankCenterX = Math.floor(splitX * 0.40);
      const crankCenterY = Math.floor(h * 0.52);
      const crankRadius = Math.min(splitX * 0.22, 54);

      // Frecuencia visual ajustada para apreciación didáctica
      const omegaVis = 2 * Math.PI * 1.0;
      const angle = omegaVis * this.simTime;

      // Cilindro del pistón
      const cylLeft = crankCenterX + crankRadius + 30;
      const cylTop = crankCenterY - 32;
      const cylW = Math.min(splitX - cylLeft - 10, 110);
      const cylH = 64;

      ctx.fillStyle = 'rgba(235, 220, 195, 0.85)';
      ctx.fillRect(cylLeft, cylTop, cylW, cylH);
      ctx.strokeStyle = '#5a3818';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(cylLeft, cylTop, cylW, cylH);

      // Rueda del cigüeñal
      ctx.strokeStyle = '#8f6727';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(crankCenterX, crankCenterY, crankRadius, 0, 2 * Math.PI);
      ctx.stroke();

      // Pin del cigüeñal
      const pinX = crankCenterX + crankRadius * Math.cos(angle);
      const pinY = crankCenterY + crankRadius * Math.sin(angle);

      ctx.fillStyle = '#b48a3c';
      ctx.beginPath();
      ctx.arc(pinX, pinY, 5, 0, 2 * Math.PI);
      ctx.fill();

      // Cabeza del pistón
      const pistonX = cylLeft + 20 + Math.cos(angle) * (crankRadius * 0.65);
      const pistonW = 28;
      const pistonH = cylH - 8;

      ctx.fillStyle = '#a67c52';
      ctx.fillRect(pistonX, crankCenterY - pistonH / 2, pistonW, pistonH);
      ctx.strokeStyle = '#38200d';
      ctx.lineWidth = 2;
      ctx.strokeRect(pistonX, crankCenterY - pistonH / 2, pistonW, pistonH);

      // Biela conectora
      ctx.strokeStyle = '#2b170c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(pinX, pinY);
      ctx.lineTo(pistonX, crankCenterY);
      ctx.stroke();

      // Título
      ctx.font = 'bold 14px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#2b170c';
      ctx.textAlign = 'left';
      ctx.fillText('EJERCICIO 2: Cinemática del Pistón (3600 rpm)', 22, 28);
      ctx.restore();

      // --- LADO DERECHO: LAS 3 CURVAS CINEMÁTICAS SIMULTÁNEAS x, v, a ---
      if (!isCompact) {
        ctx.save();
        const plotX = splitX + 25;
        const plotY = 40;
        const plotW = w - plotX - 25;
        const plotH = h - 60;
        const midY = plotY + plotH / 2;

        ctx.fillStyle = 'rgba(255, 250, 240, 0.7)';
        ctx.fillRect(plotX, plotY, plotW, plotH);
        ctx.strokeStyle = '#b88a38';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(plotX, plotY, plotW, plotH);

        // Ejes
        ctx.strokeStyle = '#5a3818';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(plotX, midY);
        ctx.lineTo(plotX + plotW, midY);
        ctx.moveTo(plotX + 30, plotY);
        ctx.lineTo(plotX + 30, plotY + plotH);
        ctx.stroke();

        const timeWindow = 2.0;
        const step = 0.02;

        // Curva 1: Posición x(t) en Azul
        ctx.strokeStyle = '#1b4965';
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let t = 0; t <= timeWindow; t += step) {
          const px = plotX + 30 + (t / timeWindow) * (plotW - 40);
          const py = midY - Math.cos(2 * Math.PI * t) * (plotH * 0.38);
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();

        // Curva 2: Velocidad v(t) en Verde Cardenillo (Desfase π/2)
        ctx.strokeStyle = '#2d5a3f';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (let t = 0; t <= timeWindow; t += step) {
          const px = plotX + 30 + (t / timeWindow) * (plotW - 40);
          const py = midY - (-Math.sin(2 * Math.PI * t)) * (plotH * 0.38);
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Curva 3: Aceleración a(t) en Rojo Cinabrio (Desfase π)
        ctx.strokeStyle = '#8c251e';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        for (let t = 0; t <= timeWindow; t += step) {
          const px = plotX + 30 + (t / timeWindow) * (plotW - 40);
          const py = midY - (-Math.cos(2 * Math.PI * t)) * (plotH * 0.38);
          if (t === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Leyenda
        ctx.font = '11px "Fira Code", monospace';
        ctx.fillStyle = '#1b4965';
        ctx.fillText('● Elongación x(t) [A = 0.650 m]', plotX + 45, plotY + 20);
        ctx.fillStyle = '#2d5a3f';
        ctx.fillText('--- Velocidad v(t) [v_máx ≈ 245 m/s]', plotX + 45, plotY + 36);
        ctx.fillStyle = '#8c251e';
        ctx.fillText('··· Aceleración a(t) [a_máx ≈ 9.24×10⁴ m/s²]', plotX + 45, plotY + 52);

        ctx.restore();
      }
    }

    /**
     * Utilidades de Dibujo Vectorial
     */
    drawCoiledSpring(ctx, startX, y, len, numCoils, radius) {
      ctx.save();
      ctx.strokeStyle = '#7c481e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(startX, y);

      const leadIn = 14;
      ctx.lineTo(startX + leadIn, y);

      const coilLen = (len - leadIn * 2) / numCoils;
      for (let i = 0; i < numCoils; i++) {
        const cx1 = startX + leadIn + i * coilLen + coilLen * 0.25;
        const cy1 = y - radius;
        const cx2 = startX + leadIn + i * coilLen + coilLen * 0.75;
        const cy2 = y + radius;
        ctx.lineTo(cx1, cy1);
        ctx.lineTo(cx2, cy2);
      }

      ctx.lineTo(startX + len - leadIn, y);
      ctx.lineTo(startX + len, y);
      ctx.stroke();
      ctx.restore();
    }

    drawVectorArrow(ctx, fromX, fromY, toX, toY, color, width) {
      const headLen = 8;
      const angle = Math.atan2(toY - fromY, toX - fromX);

      ctx.save();
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = width;

      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(toX, toY);
      ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    /**
     * Actualizar panel de telemetría en tiempo real
     */
    updateTelemetry() {
      const tel = this.container.querySelector('#vintage-lab-telemetry');
      if (!tel) return;

      if (this.activeTab === 'spring') {
        const isEj1 = (this.springConfig.mode === 'ej1');
        const m = isEj1 ? this.springConfig.m1 : this.springConfig.m4;
        const k = isEj1 ? this.springConfig.k1 : this.springConfig.k4;
        const A = isEj1 ? this.springConfig.x0_1 : 0.20;
        const omega = Math.sqrt(k / m);
        const x = A * Math.cos(omega * this.simTime);
        const F = -k * x;
        const a = F / m;

        tel.innerHTML = `
          <div class="telemetry-item">
            <span class="telemetry-label">Tiempo (t):</span>
            <span class="telemetry-val">${this.simTime.toFixed(2)} s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Elongación (x):</span>
            <span class="telemetry-val" style="color:var(--color-dato-azul);">${x.toFixed(3)} m</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Fuerza Hooke (F):</span>
            <span class="telemetry-val" style="color:var(--color-incognita-rojo);">${F.toFixed(1)} N</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Aceleración (a):</span>
            <span class="telemetry-val" style="color:var(--color-calculado-naranja);">${Math.abs(a).toFixed(1)} m/s²</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Constante k:</span>
            <span class="telemetry-val">${k.toFixed(1)} N/m</span>
          </div>
        `;
      } else if (this.activeTab === 'pendulum') {
        const cfg = this.pendulumConfig;
        const omega = Math.sqrt(cfg.g / cfg.L);
        const theta = cfg.theta0 * Math.cos(omega * this.simTime);
        const thetaDeg = (theta * 180 / Math.PI).toFixed(1);

        tel.innerHTML = `
          <div class="telemetry-item">
            <span class="telemetry-label">Tiempo (t):</span>
            <span class="telemetry-val">${this.simTime.toFixed(2)} s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Ángulo (θ):</span>
            <span class="telemetry-val" style="color:var(--color-dato-azul);">${thetaDeg}° (${theta.toFixed(3)} rad)</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Período (T):</span>
            <span class="telemetry-val" style="color:var(--color-calculado-naranja);">${cfg.T.toFixed(2)} s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Longitud (L):</span>
            <span class="telemetry-val">${(cfg.L * 100).toFixed(1)} cm</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Oscilaciones:</span>
            <span class="telemetry-val" style="color:var(--color-success);">${cfg.cycleCount} de 120</span>
          </div>
        `;
      } else if (this.activeTab === 'piston') {
        const cfg = this.pistonConfig;
        tel.innerHTML = `
          <div class="telemetry-item">
            <span class="telemetry-label">Régimen motor:</span>
            <span class="telemetry-val">3600 rpm</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Frecuencia (f):</span>
            <span class="telemetry-val">60 Hz</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Frec. Angular (ω):</span>
            <span class="telemetry-val">376.99 rad/s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Velocidad Máx:</span>
            <span class="telemetry-val" style="color:var(--color-calculado-naranja);">${cfg.vMax} m/s</span>
          </div>
          <div class="telemetry-item">
            <span class="telemetry-label">Aceleración Máx:</span>
            <span class="telemetry-val" style="color:var(--color-incognita-rojo);">9.24 × 10⁴ m/s²</span>
          </div>
        `;
      }
    }
  }

  window.VintageExercisesLab = VintageExercisesLab;
})();
