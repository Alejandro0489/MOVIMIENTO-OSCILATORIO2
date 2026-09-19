# Cuaderno Interactivo de Física III: Movimiento Armónico Simple (M.A.S.)
### *Códice Digital Clásico de Cátedra e Investigación*

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/es/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/es/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/es/docs/Web/JavaScript)
[![KaTeX](https://img.shields.io/badge/KaTeX-005A9C?style=for-the-badge&logo=latex&logoColor=white)](https://katex.org/)
[![PWA Ready](https://img.shields.io/badge/PWA-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](https://web.dev/progressive-web-apps/)
[![Multiplatform](https://img.shields.io/badge/Cross--Platform-PC%20%7C%20Mac%20%7C%20iPhone%20%7C%20Android%20%7C%20Tablet-8f6727?style=for-the-badge)](https://github.com)

---

## 📜 Descripción del Proyecto

Este proyecto es un **cuaderno digital interactivo de nivel universitario** diseñado para el estudio riguroso, formal y didáctico del **Movimiento Oscilatorio** y el **Movimiento Armónico Simple (M.A.S.)**.

Combina una estética de **manuscrito renacentista / códice de física clásica** (inspirado en los cuadernos de notas de **Leonardo Da Vinci**, **Galileo Galilei** e **Isaac Newton**) con tecnología web moderna:
- Grabados a pluma y tinta sepia sobre textura de papiro y vellum.
- Demostraciones matemáticas analíticas renderizadas a alta velocidad con **KaTeX**.
- Motor de plano cartesiano interactivo estilo **GeoGebra**.
- Laboratorio de simulación física en tiempo real (oscilador masa-resorte, vector fasorial y balance energético).
- Protocolo didáctico formal en 5 fases para la resolución rigurosa de problemas de ingeniería.

---

## 📱 Compatibilidad Multiplataforma (100% Responsivo)

La aplicación ha sido optimizada y verificada para funcionar sin fricción en cualquier dispositivo y sistema operativo:

| Dispositivo / Plataforma | Características Adaptativas y Optimizaciones |
| :--- | :--- |
| **PC & Laptops (Windows / Linux / ChromeOS)** | Pantalla completa con tecla `F` o botón superior, navegación por teclado (`←`, `→`, `Inicio`, `Fin`, `Espacio`), renderizado fluido en monitores de alta resolución. |
| **Mac (macOS / Safari / Chrome / Firefox)** | Suavizado tipográfico subpíxel para pantallas Retina, atajos ergonómicos de teclado, compatibilidad con gestos de trackpad y barras de desplazamiento finas. |
| **iPhone (iOS Safari & Chrome)** | Soporte para *Safe Area Insets* (recortes de pantalla, Dynamic Island y barra de inicio inferior), **gestos táctiles *Swipe*** (deslizar a izquierda/derecha para cambiar página), tamaño mínimo táctil de 44px e instalación PWA en pantalla de inicio. |
| **Android (Smartphones Samsung, Pixel, Xiaomi, etc.)** | Adaptabilidad fluida desde pantallas compactas (360px) hasta phablets, navegación táctil *swipe*, soporte PWA con Service Worker para funcionamiento sin conexión (*Offline*). |
| **iPads & Tablets (iPadOS / Android Tablets / Surface)** | Detección automática de orientación (Vertical y Horizontal / *Portrait & Landscape*), redimensionamiento de lienzos interactivos en tiempo real con `ResizeObserver` y rejillas de contenido fluidas. |

---

## 🚀 Estructura de Contenidos (11 Páginas Temáticas)

1. **Página 0 — Portada del Códice**: Grabados de física clásica (Péndulo de Galileo, Muelle helicoidal con contrapeso de bronce, Engranajes y relojería para el período $T$, Esfera armilar de órbitas celestes y compás de proporción).
2. **Página 1 — Sumario Editorial & Índice Interactivo**: Enlaces de salto directo a cada sección del cuaderno.
3. **Página 2 — Mapa Mental Cognitivo**: Estructura conceptual navegable con nodos interactivos sobre cinemática, dinámica y energía oscilatoria.
4. **Página 3 — Reseña Histórica & Cronología**: Evolución del estudio oscilatorio (Galileo, Hooke, Huygens, Newton y Fourier).
5. **Página 4 — Conceptos Fundamentales & Magnitudes**: Elongación, amplitud, frecuencia angular, período, frecuencia ordinaria y unidades del S.I.
6. **Página 5 — Ecuación Diferencial del M.A.S.**: Deducción newtoniana formal paso a paso y solución por polinomio característico en el campo complejo:
   $$\frac{d^2x}{dt^2} + \omega^2 x = 0 \quad \Longrightarrow \quad x(t) = A \cos(\omega t + \phi_0)$$
7. **Página 6 — Cinemática Analítica & Plano GeoGebra**: Demostraciones de $x(t)$, $v(t)$, $a(t)$, desfases de $\pi/2$ y $\pi$ radianes con plano cartesiano interactivo milimetrado y conmutadores de curvas.
8. **Página 7 — Laboratorio Interactivo Masa-Resorte & Fasor**: Simulación física en vivo con arrastre de masa, muelle deformable, círculo de referencia fasorial, telemetría dinámica ($E_c$, $E_p$, $E_m$) y control de parámetros ($A, m, k, \phi_0$).
9. **Página 8 — Taller de Problemas Resueltos I (Cinemática)**: Problema resuelto con protocolo de colores:
   - 🔵 **Fase 1**: Datos identificados
   - 🔴 **Fase 2**: Incógnitas delimitadas
   - 🟡 **Fase 3**: Modelos matemáticos formales
   - 🟠 **Fase 4**: Sustitución, despeje y cálculo con unidades
   - 🟢 **Fase 5**: Validación dimensional y conclusiones físicas
10. **Página 9 — Taller de Problemas Resueltos II (Dinámica)**: Determinación de masa, rigidez del muelle y condiciones iniciales con protocolo estricto.
11. **Página 10 — Glosario Científico con Buscador en Vivo**: Filtro instantáneo de términos clave en física oscilatoria.

---

## ⌨️ Guía de Navegación y Atajos

- **Botones en Pantalla**:
  - `Anterior` / `Siguiente`: Cambio secuencial de páginas.
  - `Portada`: Salto directo a la página de inicio.
  - `Selector desplegable`: Acceso inmediato a cualquier página del cuaderno.
- **Teclado (PC & Mac)**:
  - `Flecha Derecha` / `Page Down` / `Barra Espaciadora`: Página siguiente.
  - `Flecha Izquierda` / `Page Up` / `Shift + Barra Espaciadora`: Página anterior.
  - `Inicio` (`Home`): Ir a la Portada (Página 0).
  - `Fin` (`End`): Ir a la última página.
  - `F`: Alternar modo pantalla completa.
- **Pantalla Táctil (iPhone, iPad, Android)**:
  - `Deslizar a la izquierda` ($\leftarrow$): Siguiente página.
  - `Deslizar a la derecha` ($\rightarrow$): Página anterior.

---

## 🛠️ Ejecución Local y Despliegue

La aplicación es estática y autocontenida (HTML, CSS y JavaScript Vanilla). No requiere compiladores externos ni dependencias pesadas.

### Opción 1: Abrir directamente en el navegador
Haz doble clic sobre el archivo `index.html` o arrástralo a tu navegador web favorito (Chrome, Edge, Safari, Firefox).

### Opción 2: Servidor local con Node.js (Recomendado para Service Worker PWA)
```bash
# Iniciar servidor estático local en el puerto 8080
npx serve -l 8080
```
Luego abre tu navegador en `http://localhost:8080`.

### Opción 3: Servidor local con Python
```bash
# Python 3
python -m http.server 8080
```

---

## 📦 Estructura del Código

```
FISICA 3/
├── index.html              # Estructura editorial semántica y contenido científico
├── manifest.json           # Manifiesto PWA (Web App instalable en móviles y PC)
├── sw.js                   # Service Worker para almacenamiento en caché offline (v3)
├── README.md               # Documentación y especificaciones del proyecto
├── css/
│   ├── notebook.css        # Sistema de diseño de códice renacentista y responsividad
│   ├── geogebra.css        # Estilos del plano cartesiano interactivo y herramientas
│   └── simulation.css      # Estilos del laboratorio dinámico masa-resorte y fasor
├── js/
│   ├── notebook-app.js     # Controlador principal SPA, atajos, swipe y ciclo de vida
│   ├── geogebra-plane.js   # Motor de graficación matemática vectorial en Canvas
│   ├── mas-simulation.js   # Motor de física dinámica, integrador temporal y energía
│   └── mindmap.js          # Motor del mapa mental interactivo
└── Imagenes/
    ├── Portada-vintage.jpg # Grabado clásico de física renacentista para la portada
    ├── Hojas-vintage.jpg   # Textura de pergamino de alta definición para páginas
    ├── Portada.webp        # Portada alternativa
    └── Hojas.webp          # Textura alternativa
```

---

## 👥 Autores y Equipo Editorial

**Estudiantes de Ingeniería &bull; Departamento de Física**
- **Darlyn Dayana Zapata**
- **Jorge Alejandro Giraldo**
- **Sara Vélez Alzate**

*Desarrollado en colaboración con el Equipo Multidisciplinar de IA (Física, Matemáticas, Diseño y Arquitectura Web).*
*Normas APA 7ª Edición &bull; Edición Digital Interactiva v3.0.*
