/**
 * Interactive Mind Map Component
 * Renderiza el Mapa Mental Interactivo con SVG, nodos dinámicos
 * y tarjetas explicativas desplegables al interactuar.
 */
class InteractiveMindMap {
  constructor(containerId) {
    this.container = typeof containerId === 'string'
      ? document.querySelector(containerId)
      : containerId;

    if (!this.container) return;

    this.nodesData = {
      id: 'root',
      label: 'Movimiento Periódico',
      desc: 'Movimiento que se repite idénticamente a intervalos regulares de tiempo $T$. Es la base general de todos los fenómenos cíclicos.',
      color: '#4f46e5',
      children: [
        {
          id: 'oscilatorio',
          label: 'Movimiento Oscilatorio',
          desc: 'Movimiento periódico en torno a una posición de equilibrio estable bajo la acción de una fuerza restauradora.',
          color: '#0284c7',
          children: [
            {
              id: 'mas',
              label: 'M.A.S. (Armónico Simple)',
              desc: 'Oscilación rectilínea ideal donde la fuerza restauradora es directamente proporcional al desplazamiento ($F = -kx$).',
              color: '#059669',
              children: [
                {
                  id: 'dinamica',
                  label: 'Dinámica: Ley de Hooke',
                  desc: '$\\Sigma F = m a \\implies -kx = m \\frac{d^2x}{dt^2} \\implies \\frac{d^2x}{dt^2} + \\omega^2 x = 0$.',
                  color: '#ea580c'
                },
                {
                  id: 'cinematica',
                  label: 'Cinemática Armónica',
                  desc: 'Ecuaciones de estado: $x(t) = A\\cos(\\omega t + \\phi_0)$, $v(t) = -A\\omega\\sin(\\omega t + \\phi_0)$, $a(t) = -\\omega^2 x$.',
                  color: '#7c3aed'
                },
                {
                  id: 'energia',
                  label: 'Conservación Energética',
                  desc: 'Transformación continua entre energía cinética y potencial elástica: $E_{\\text{mec}} = \\frac{1}{2} k A^2 = \\text{constante}$.',
                  color: '#16a34a'
                }
              ]
            }
          ]
        },
        {
          id: 'magnitudes',
          label: 'Magnitudes Físicas',
          desc: 'Conjunto de parámetros escalares y angulares que cuantifican un oscilador armónico.',
          color: '#0891b2',
          children: [
            {
              id: 't-f',
              label: 'Período (T) & Frecuencia (f)',
              desc: '$T = \\frac{1}{f}$, medido en segundos (s). La frecuencia $f = \\frac{1}{T}$ en Hertz (Hz = $\\text{s}^{-1}$).',
              color: '#2563eb'
            },
            {
              id: 'omega',
              label: 'Frecuencia Angular (ω)',
              desc: '$\\omega = 2\\pi f = \\frac{2\\pi}{T} = \\sqrt{\\frac{k}{m}}$, en radianes por segundo (rad/s).',
              color: '#4338ca'
            },
            {
              id: 'amplitud-fase',
              label: 'Amplitud (A) & Fase (ϕ₀)',
              desc: '$A$: máxima elongación desde el equilibrio. $\\phi_0$: estado inicial de oscilación en $t=0$.',
              color: '#d97706'
            }
          ]
        },
        {
          id: 'fasor',
          label: 'Círculo Fasorial',
          desc: 'Representación geométrica donde el M.A.S. se obtiene como la proyección ortogonal de un vector rotatorio $\\vec{A}$ con velocidad angular $\\omega$.',
          color: '#9333ea',
          children: [
            {
              id: 'desfase',
              label: 'Desfase Relativo (Δϕ)',
              desc: 'La velocidad adelanta a la posición en $\\pi/2$ rad ($90^\\circ$). La aceleración está en oposición de fase ($\\pi$ rad, $180^\\circ$).',
              color: '#c026d3'
            }
          ]
        }
      ]
    };

    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="mindmap-wrapper" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:var(--radius-lg); padding:20px; box-shadow:var(--shadow-card); position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid #e2e8f0; padding-bottom:10px;">
          <div>
            <h4 style="font-size:1.1rem; font-weight:700; color:#0f172a;">Mapa Conceptual Jerárquico: Cinemática & Dinámica Oscilatoria</h4>
            <p style="font-size:0.82rem; color:#64748b;">Haz clic en cualquier nodo para inspeccionar sus fundamentos físicos y fórmulas.</p>
          </div>
          <span style="font-size:0.75rem; background:#f1f5f9; padding:4px 10px; border-radius:var(--radius-full); font-weight:600; color:#475569;">
            Interactivo
          </span>
        </div>

        <div class="mindmap-svg-container" style="width:100%; position:relative; overflow-x:auto; padding:4px 0;">
          <svg class="mindmap-svg" viewBox="0 0 980 440" style="width:100%; height:auto; min-height:360px; max-width:980px; display:block; margin:0 auto;"></svg>
        </div>

        <!-- Panel emergente de detalles -->
        <div class="mindmap-detail-card" style="display:none; margin-top:16px; background:#f8fafc; border-left:4px solid #4f46e5; border-radius:0 var(--radius-md) var(--radius-md) 0; padding:16px 20px; box-shadow:0 2px 8px rgba(0,0,0,0.04); animation:pageFadeIn 0.25s ease;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <h5 class="node-detail-title" style="font-size:1rem; font-weight:700; color:#1e293b;"></h5>
            <button class="node-close-btn" style="background:none; border:none; color:#94a3b8; cursor:pointer; font-size:1.1rem;">&times;</button>
          </div>
          <p class="node-detail-desc" style="font-size:0.92rem; color:#475569; line-height:1.5;"></p>
        </div>
      </div>
    `;

    this.svg = this.container.querySelector('.mindmap-svg');
    this.detailCard = this.container.querySelector('.mindmap-detail-card');
    this.detailTitle = this.container.querySelector('.node-detail-title');
    this.detailDesc = this.container.querySelector('.node-detail-desc');

    this.container.querySelector('.node-close-btn').addEventListener('click', () => {
      this.detailCard.style.display = 'none';
    });

    this.drawTree();
  }

  drawTree() {
    const svg = this.svg;
    svg.innerHTML = '';

    // Coordenadas calculadas de los nodos
    const nodes = [
      // Raíz
      { id: 'root', x: 120, y: 220, label: 'Movimiento Periódico', color: '#312e81', desc: 'Movimiento que se repite idénticamente a intervalos regulares de tiempo T.', parent: null },
      
      // Nivel 1
      { id: 'oscilatorio', x: 340, y: 110, label: 'Movimiento Oscilatorio', color: '#0369a1', desc: 'Oscilación en torno a una posición de equilibrio estable bajo fuerza restauradora.', parent: 'root' },
      { id: 'magnitudes', x: 340, y: 220, label: 'Magnitudes Físicas', color: '#0e7490', desc: 'Parámetros cuantitativos del oscilador: T, f, ω, A, ϕ.', parent: 'root' },
      { id: 'fasor', x: 340, y: 340, label: 'Círculo Fasorial', color: '#7e22ce', desc: 'Proyección geométrica de un vector rotatorio de amplitud A.', parent: 'root' },
      
      // Nivel 2
      { id: 'mas', x: 570, y: 110, label: 'M.A.S. (Armónico Simple)', color: '#047857', desc: 'Fuerza restauradora lineal F = -kx sin disipación.', parent: 'oscilatorio' },
      { id: 't-f', x: 570, y: 180, label: 'Período (T) & Frecuencia (f)', color: '#1d4ed8', desc: 'T = 1/f en segundos; frecuencia f en Hertz (Hz = 1/s).', parent: 'magnitudes' },
      { id: 'omega', x: 570, y: 240, label: 'Frecuencia Angular (ω)', color: '#4338ca', desc: 'ω = 2π/T = √(k/m) en rad/s.', parent: 'magnitudes' },
      { id: 'amplitud-fase', x: 570, y: 290, label: 'Amplitud (A) & Fase (ϕ₀)', color: '#b45309', desc: 'Elongación máxima y desfase inicial en t=0.', parent: 'magnitudes' },
      { id: 'desfase', x: 570, y: 360, label: 'Relaciones de Fase (Δϕ)', color: '#a21caf', desc: 'Velocidad adelantada π/2 rad; aceleración en oposición π rad.', parent: 'fasor' },

      // Nivel 3 (Derivados de M.A.S.)
      { id: 'dinamica', x: 810, y: 55, label: 'Dinámica: Ley de Hooke', color: '#c2410c', desc: 'ΣF = -kx = m(d²x/dt²) => d²x/dt² + ω²x = 0.', parent: 'mas' },
      { id: 'cinematica', x: 810, y: 110, label: 'Cinemática Armónica', color: '#6d28d9', desc: 'Ecuaciones diferenciales integradas: x(t), v(t), a(t).', parent: 'mas' },
      { id: 'energia', x: 810, y: 165, label: 'Conservación Energética', color: '#15803d', desc: 'Emec = (1/2)kA² = Ec + Ep = Constante en oscilador ideal.', parent: 'mas' }
    ];

    const nodeMap = {};
    nodes.forEach(n => { nodeMap[n.id] = n; });

    // 1. Dibujar Líneas Conectoras (Curvas de Bézier)
    nodes.forEach(node => {
      if (!node.parent) return;
      const parent = nodeMap[node.parent];
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      
      const p1x = parent.x + 80;
      const p1y = parent.y;
      const p2x = node.x - 70;
      const p2y = node.y;
      const c1x = (p1x + p2x) / 2;
      const c1y = p1y;
      const c2x = (p1x + p2x) / 2;
      const c2y = p2y;

      path.setAttribute('d', `M ${p1x} ${p1y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2x} ${p2y}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#cbd5e1');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-dasharray', 'none');
      svg.appendChild(path);
    });

    // 2. Dibujar Nodos Rectangulares Elegantes
    nodes.forEach(node => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('cursor', 'pointer');
      g.setAttribute('transform', `translate(${node.x}, ${node.y})`);

      const rectWidth = 150;
      const rectHeight = 36;

      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', -rectWidth / 2);
      rect.setAttribute('y', -rectHeight / 2);
      rect.setAttribute('width', rectWidth);
      rect.setAttribute('height', rectHeight);
      rect.setAttribute('rx', '8');
      rect.setAttribute('fill', '#ffffff');
      rect.setAttribute('stroke', node.color);
      rect.setAttribute('stroke-width', '2');
      rect.setAttribute('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.06))');

      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', '4');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('font-family', '"Outfit", sans-serif');
      text.setAttribute('font-size', '11');
      text.setAttribute('font-weight', '600');
      text.setAttribute('fill', node.color);
      text.textContent = node.label;

      g.appendChild(rect);
      g.appendChild(text);

      // Evento Click para mostrar información
      g.addEventListener('click', () => {
        this.detailCard.style.display = 'block';
        this.detailCard.style.borderLeftColor = node.color;
        this.detailTitle.textContent = node.label;
        this.detailTitle.style.color = node.color;
        this.detailDesc.textContent = node.desc;

        // Si KaTeX está disponible, renderizar fórmulas
        if (window.renderMathInElement) {
          window.renderMathInElement(this.detailDesc, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ]
          });
        }
      });

      // Hover
      g.addEventListener('mouseenter', () => {
        rect.setAttribute('fill', '#f8fafc');
        rect.setAttribute('stroke-width', '3');
      });
      g.addEventListener('mouseleave', () => {
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('stroke-width', '2');
      });

      svg.appendChild(g);
    });
  }
}

window.InteractiveMindMap = InteractiveMindMap;
