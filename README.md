# MDD Explora

Plataforma web para la promoción y gestión de servicios de turismo sostenible en la región de Madre de Dios.

- **Empresa desarrolladora:** Amazonía Digital S.A.C. (simulada)
- **Empresas caso de estudio (fase piloto, simuladas):** Expediciones Garza Real (agencia de tours), Lodge Castaña Azul (hospedaje) y Botes Martín Pescador (transporte fluvial)
- **Curso:** Desarrollo Web I, Universidad Nacional Amazónica de Madre de Dios (UNAMAD)

## Integrantes

- Alexzandro Edison Diaz Condori
- Luis Emanuel Willian Soplin Jimenez
- Elias Benjamin Lara Mercado

## Páginas

| Página | Contenido |
| --- | --- |
| `index.html` | Portada, planificador por presupuesto, destinos, operadores afiliados, mapa interactivo, proceso de reserva, reseñas y llamado a la afiliación |
| `servicios.html` | Catálogo con buscador, filtros por tipo y orden por precio o calificación |
| `reservar.html` | Formulario de reserva con validación y resumen del total en vivo |

## Responsive Web Design

El sitio sigue el enfoque **Mobile First** (Luke Wroblewski, 2011): los estilos base son para celular y las media queries con `min-width` añaden complejidad a medida que crece la pantalla.

| Breakpoint | Dispositivo | Qué cambia |
| --- | --- | --- |
| Base (< 600px) | Móviles | Una columna, menú hamburguesa, botones táctiles de 44px de alto |
| `min-width: 600px` | Tablets | Rejillas de 2 columnas, Media Object en fila, formulario en 2 columnas |
| `min-width: 1024px` | Laptops y desktops | Menú horizontal, rejillas de 3 o 4 columnas, resumen de reserva fijo (sticky), estados hover |
| `min-width: 1440px` | Ultra-wide | Contenedor con `max-width` para evitar líneas de texto infinitas |

Técnicas aplicadas:

- `<meta name="viewport" content="width=device-width, initial-scale=1">` en todas las páginas
- Rejillas fluidas con **CSS Grid** y **Flexbox**
- Imágenes fluidas: `img { max-width: 100%; height: auto; }` y `object-fit: cover`
- Unidades relativas (`rem`, `%`, `vw`) y tipografía fluida con `clamp()`
- Propiedades CSS3: `border-radius`, `box-shadow`, `linear-gradient`, `radial-gradient`, `transition`, `transform`, `aspect-ratio`, variables CSS (`--color-forest`), `backdrop-filter` y `:has()`

## Metodologías CSS3: OOCSS + BEM

### OOCSS (Object-Oriented CSS)

Se aplican los dos principios de Nicole Sullivan:

1. **Separar estructura y piel.** La estructura (tamaños, márgenes, display) está en la clase base y la apariencia (colores, fondos) en modificadores y variables del tema:
   ```css
   .button          { display: inline-flex; padding: ...; border-radius: ...; } /* estructura */
   .button--primary { background-color: var(--color-macaw); color: #fff; }     /* piel */
   ```
   Todos los colores, sombras y radios viven en `css/themes/_amazonia.css`, así que cambiar el tema no rompe el layout.
2. **Separar contenedor y contenido.** Ningún componente depende de dónde se coloca. No se usan selectores descendientes de contexto (`.sidebar h2`), ni ids como selectores, ni `div.header`, ni `!important` (solo dentro de `prefers-reduced-motion`, por accesibilidad).

Objetos reutilizables: `.container`, `.grid`, `.button`, `.badge`, `.card`, `.alert` y el **Media Object** (`.media`), el patrón clásico de OOCSS que se usa para las empresas afiliadas.

### BEM (Block, Element, Modifier)

Todas las clases siguen la convención `bloque__elemento--modificador`, en minúsculas y con guiones:

```html
<article class="card card--featured">
  <div class="card__media">
    <img class="card__image" src="img/lago.svg" alt="">
  </div>
  <div class="card__body">
    <h3 class="card__title">Tour al Lago Sandoval</h3>
    <p class="card__price">S/ 120</p>
    <a class="button button--primary button--small" href="#">Reservar</a>
  </div>
</article>
```

### Arquitectura modular de carpetas

```
css/
├── main.css              → importa todo en orden
├── themes/_amazonia.css  → colores, tipografía, sombras (variables)
├── base/                 → reset y estilos globales
├── layout/               → container, grid, section, header, footer
├── modules/              → componentes BEM: button, nav, hero, card, media, planner, form…
└── utilities/            → clases rápidas (u-visually-hidden, u-text-center…)
js/
├── data.js               → catálogo de servicios de las 3 empresas
└── main.js               → menú, filtros, planificador, mapa y reserva
img/                      → ilustraciones SVG
```

## Tecnologías

- HTML5 semántico y accesible (landmarks, `aria-*`, enlace para saltar al contenido)
- CSS3 sin frameworks, con OOCSS + BEM
- JavaScript (vanilla)
- Leaflet 1.9.4 + OpenStreetMap para el mapa

## Cómo ejecutarlo

Abre `index.html` en el navegador, o levanta un servidor local:

```bash
python -m http.server 5500
```

Luego entra a <http://localhost:5500>.

## Publicación (GitHub Pages)

1. Sube el repositorio a GitHub.
2. En **Settings → Pages**, elige la rama `main` y la carpeta `/ (root)`.
3. El sitio queda publicado en `https://<usuario>.github.io/mdd-explora/`.

## Alcance

Esta entrega es el **frontend** de la fase piloto. Las reservas son una demostración y no se envían a un servidor. En la fase 2 se agregarán el backend (Node.js/Express, PHP o Flask), la base de datos (MySQL), el panel del operador, los pagos en línea y la ampliación a Manu y Tahuamanu.

> Las empresas, los precios y las reseñas son simulados con fines académicos.
