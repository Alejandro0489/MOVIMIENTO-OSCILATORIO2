/**
 * NotebookApp
 * Controlador principal de navegación SPA, inicialización de componentes,
 * accesibilidad, atajos de teclado, ciclo de vida de lienzos y registro PWA.
 */
document.addEventListener('DOMContentLoaded', () => {
  const pages = document.querySelectorAll('.notebook-page');
  const totalPages = pages.length - 1; // Página 0 a Página 11 (12 páginas en total)
  let currentPage = 0;

  // Elementos de navegación
  const prevBtn = document.getElementById('nav-btn-prev');
  const nextBtn = document.getElementById('nav-btn-next');
  const homeBtn = document.getElementById('nav-btn-home');
  const pageSelect = document.getElementById('nav-page-select');
  const pageCurrentSpan = document.getElementById('nav-page-current');
  const pageTotalSpan = document.getElementById('nav-page-total');
  const progressBar = document.getElementById('reading-progress-bar');
  const teamModal = document.getElementById('team-modal');
  const openTeamBtn = document.getElementById('btn-open-team');
  const closeTeamBtn = document.getElementById('btn-close-team');
  const btnFullscreen = document.getElementById('btn-toggle-fullscreen');

  // Inicializar selector de páginas en el footer
  if (pageSelect) {
    pageSelect.innerHTML = '';
    pages.forEach((p, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      const title = p.dataset.title || `Página ${idx}`;
      opt.textContent = idx === 0 ? 'Portada' : `Pág. ${idx}: ${title}`;
      pageSelect.appendChild(opt);
    });
    pageSelect.addEventListener('change', (e) => {
      goToPage(parseInt(e.target.value, 10));
    });
  }

  function renderMath(element) {
    if (window.renderMathInElement && element) {
      window.renderMathInElement(element, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  function updateNavState() {
    pages.forEach((p, idx) => {
      p.classList.toggle('active', idx === currentPage);
    });

    if (prevBtn) prevBtn.disabled = (currentPage === 0);
    if (nextBtn) nextBtn.disabled = (currentPage === totalPages);
    if (pageSelect) pageSelect.value = currentPage;
    if (pageCurrentSpan) pageCurrentSpan.textContent = currentPage === 0 ? 'Portada' : `Pág. ${currentPage}`;
    if (pageTotalSpan) pageTotalSpan.textContent = `/ ${totalPages}`;

    // Actualizar barra superior de progreso
    if (progressBar) {
      const progressPercent = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
      progressBar.style.width = `${progressPercent}%`;
    }

    // Desplazar al inicio de la página activa
    const activePage = pages[currentPage];
    if (activePage) {
      const scrollable = activePage.querySelector('.page-content-scroll');
      if (scrollable) scrollable.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Renderizar fórmulas KaTeX en la página activa
    renderMath(activePage);

    // Inicializaciones y sincronización bajo demanda para páginas interactivas
    triggerPageSpecificComponents(currentPage);
  }

  function goToPage(target) {
    if (target < 0 || target > totalPages) return;
    currentPage = target;
    updateNavState();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
  if (homeBtn) homeBtn.addEventListener('click', () => goToPage(0));

  // Botón "Abrir Cuaderno" en portada
  const btnOpenBook = document.getElementById('btn-open-book');
  if (btnOpenBook) {
    btnOpenBook.addEventListener('click', () => goToPage(1));
  }

  // Atajos de Teclado Multiplataforma (PC, Mac, ChromeOS)
  window.addEventListener('keydown', (e) => {
    // Si el usuario está escribiendo en un input o select, no capturar
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) {
      if (e.key === ' ') e.preventDefault();
      goToPage(currentPage + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) {
      if (e.key === ' ') e.preventDefault();
      goToPage(currentPage - 1);
    } else if (e.key === 'Home') {
      goToPage(0);
    } else if (e.key === 'End') {
      goToPage(totalPages);
    }
  });

  // Gestos Táctiles (Swipe Gesture) para iPhone, iPad, Android y Tablets
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  const bookViewport = document.querySelector('.notebook-book') || document.querySelector('.notebook-viewport');
  if (bookViewport) {
    bookViewport.addEventListener('touchstart', (e) => {
      // No interferir con lienzos interactivos de dibujo/arrastre ni controles de formulario
      if (e.target.closest('canvas, input, select, button, .geogebra-container, #mas-simulation-lab, #mindmap-interactive-container')) {
        return;
      }
      if (e.touches && e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = Date.now();
      }
    }, { passive: true });

    bookViewport.addEventListener('touchend', (e) => {
      if (e.target.closest('canvas, input, select, button, .geogebra-container, #mas-simulation-lab, #mindmap-interactive-container')) {
        return;
      }
      if (e.changedTouches && e.changedTouches.length === 1) {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        const deltaTime = Date.now() - touchStartTime;

        // Umbral de swipe: recorrido horizontal > 50px, vertical < 70px, en menos de 500ms
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 70 && deltaTime < 500) {
          if (deltaX < 0) {
            // Deslizar hacia la izquierda -> avanzar página
            goToPage(currentPage + 1);
          } else {
            // Deslizar hacia la derecha -> retroceder página
            goToPage(currentPage - 1);
          }
        }
      }
    }, { passive: true });
  }

  // Soporte de rotación de pantalla en móviles y tablets (Portrait <-> Landscape)
  window.addEventListener('resize', () => {
    triggerPageSpecificComponents(currentPage);
  });
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      triggerPageSpecificComponents(currentPage);
    }, 150);
  });

  // Modal de Equipo Multidisciplinar
  if (openTeamBtn && teamModal) {
    openTeamBtn.addEventListener('click', () => teamModal.classList.add('active'));
  }
  if (closeTeamBtn && teamModal) {
    closeTeamBtn.addEventListener('click', () => teamModal.classList.remove('active'));
  }
  if (teamModal) {
    teamModal.addEventListener('click', (e) => {
      if (e.target === teamModal) teamModal.classList.remove('active');
    });
  }

  // Pantalla Completa y sincronización de icono
  if (btnFullscreen) {
    btnFullscreen.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    });

    document.addEventListener('fullscreenchange', () => {
      const isFs = !!document.fullscreenElement;
      const icon = btnFullscreen.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', isFs ? 'minimize' : 'maximize');
        if (window.lucide) window.lucide.createIcons({ root: btnFullscreen });
      }
    });
  }

  // Enlaces de salto directo desde el Índice (Página 1)
  document.querySelectorAll('.toc-jump-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const pageNum = parseInt(link.dataset.page, 10);
      goToPage(pageNum);
    });
  });

  // Buscador de Glosario (Página 10)
  const glossarySearch = document.getElementById('glossary-search-input');
  if (glossarySearch) {
    glossarySearch.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      document.querySelectorAll('.glossary-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? 'block' : 'none';
      });
    });
  }

  // Componentes interactivos por página
  let mindMapInstance = null;
  let geogebraKinematicsPlane = null;
  let masLabInstance = null;
  let vintageExercisesLabInstance = null;

  function triggerPageSpecificComponents(pageIdx) {
    // Página 2: Mapa Mental
    if (pageIdx === 2) {
      if (!mindMapInstance && window.InteractiveMindMap) {
        mindMapInstance = new window.InteractiveMindMap('#mindmap-interactive-container');
      }
    }

    // Página 6: Plano GeoGebra de Funciones Cinemáticas
    if (pageIdx === 6) {
      if (!geogebraKinematicsPlane && window.GeoGebraCartesianPlane) {
        const el = document.getElementById('geogebra-kinematics-plane');
        if (el) {
          geogebraKinematicsPlane = new window.GeoGebraCartesianPlane(el, {
            scaleX: 55,
            scaleY: 55,
            xLabel: 't (s)',
            yLabel: 'x, v, a (u)',
            strokeColor: '#0284c7',
            strokeWidth: 3
          });

          // Graficar x(t) = 2 cos(2t)
          geogebraKinematicsPlane.addCurve(t => 2 * Math.cos(2 * t), 'Elongación x(t)', '#0284c7', 3);
          // Graficar v(t) = -4 sin(2t)
          geogebraKinematicsPlane.addCurve(t => -4 * Math.sin(2 * t), 'Velocidad v(t)', '#059669', 2, [6, 6]);
          // Graficar a(t) = -8 cos(2t) (escalada a 0.5 para visibilidad)
          geogebraKinematicsPlane.addCurve(t => -4 * Math.cos(2 * t), 'Aceleración a(t)/2', '#dc2626', 2, [3, 4]);

          // Conectar botones de leyenda interactiva
          const legendToggles = document.getElementById('geogebra-legend-toggles');
          if (legendToggles) {
            legendToggles.querySelectorAll('.curve-legend-badge').forEach(btn => {
              btn.addEventListener('click', () => {
                const curveIdx = parseInt(btn.dataset.curveIndex, 10);
                const isActive = geogebraKinematicsPlane.toggleCurve(curveIdx);
                btn.classList.toggle('active', isActive);
              });
            });
          }
        }
      } else if (geogebraKinematicsPlane) {
        setTimeout(() => {
          geogebraKinematicsPlane.resize();
          geogebraKinematicsPlane.render();
        }, 50);
      }
    }

    // Página 7: Laboratorio Completo MAS + Fasor
    if (pageIdx === 7) {
      if (!masLabInstance && window.MASSimulationLab) {
        masLabInstance = new window.MASSimulationLab('#mas-simulation-lab');
      } else if (masLabInstance && masLabInstance.setActive) {
        masLabInstance.setActive(true);
      }
    } else {
      // Pausar simulación en segundo plano si estamos en otra página para ahorrar recursos
      if (masLabInstance && masLabInstance.setActive) {
        masLabInstance.setActive(false);
      }
    }

    // Página 10: Colección de Ejercicios Prácticos y Laboratorio Gráfico
    if (pageIdx === 10) {
      if (!vintageExercisesLabInstance && window.VintageExercisesLab) {
        vintageExercisesLabInstance = new window.VintageExercisesLab('#vintage-exercises-lab');
      } else if (vintageExercisesLabInstance && vintageExercisesLabInstance.setActive) {
        vintageExercisesLabInstance.setActive(true);
        setTimeout(() => {
          vintageExercisesLabInstance.resize();
          vintageExercisesLabInstance.render();
        }, 50);
      }
    } else {
      if (vintageExercisesLabInstance && vintageExercisesLabInstance.setActive) {
        vintageExercisesLabInstance.setActive(false);
      }
    }
  }

  // Control de Explicaciones Paso a Paso en Ejercicios
  document.querySelectorAll('.btn-step-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const box = document.getElementById(targetId);
      if (box) {
        const isCurrentlyActive = box.classList.contains('active');
        box.classList.toggle('active', !isCurrentlyActive);
        btn.classList.toggle('active', !isCurrentlyActive);
        const spanText = btn.querySelector('span');
        if (spanText) {
          spanText.textContent = !isCurrentlyActive ? 'Ocultar Explicación' : 'Ver Explicación Paso a Paso';
        }
      }
    });
  });

  // Botón Global: Desplegar/Ocultar todos los pasos a paso
  const btnToggleAll = document.getElementById('btn-toggle-all-steps');
  if (btnToggleAll) {
    let allExpanded = false;
    btnToggleAll.addEventListener('click', () => {
      allExpanded = !allExpanded;
      document.querySelectorAll('.step-explanation-box').forEach(box => {
        box.classList.toggle('active', allExpanded);
      });
      document.querySelectorAll('.btn-step-toggle').forEach(btn => {
        btn.classList.toggle('active', allExpanded);
        const spanText = btn.querySelector('span');
        if (spanText) {
          spanText.textContent = allExpanded ? 'Ocultar Explicación' : 'Ver Explicación Paso a Paso';
        }
      });
      const textSpan = document.getElementById('text-toggle-all-steps');
      if (textSpan) {
        textSpan.textContent = allExpanded ? 'Ocultar todos los Pasos a Paso' : 'Desplegar todos los Pasos a Paso';
      }
    });
  }

  // Inicializar iconos de Lucide
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Asegurar renderizado KaTeX cuando los scripts diferidos terminen de cargar
  window.addEventListener('load', () => {
    updateNavState();
  });

  // Registrar Service Worker para PWA
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.log('SW registration note:', err);
    });
  }

  // Primera carga
  updateNavState();
});

