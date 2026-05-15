# Requirements Document

## Introduction

paper-view es un fork de paged.js que renderiza contenido paginado en el navegador. Actualmente, el sistema asigna clases CSS `pagedjs_left_page` / `pagedjs_right_page` a las páginas según su posición par/impar, y el módulo `AtPage` procesa las reglas CSS `@page :left` y `@page :right` para aplicar márgenes y estilos diferenciados por lado. Esto produce un layout de tipo libro (spread/facing pages).

Esta feature introduce un **modo de visualización de página única centrada** (`single-page-centered-view`): cada página se muestra de forma independiente, centrada horizontalmente en el viewport, sin distinción izquierda/derecha ni layout de libro. El modo se activa mediante una opción de configuración en el `Previewer` y puede coexistir con el comportamiento existente (que permanece como modo por defecto).

## Glossary

- **Previewer**: Clase principal (`src/polyfill/previewer.js`) que orquesta el `Chunker` y el `Polisher` para renderizar contenido paginado.
- **Chunker**: Clase (`src/chunker/chunker.js`) responsable de dividir el contenido en páginas y gestionar el layout.
- **Page**: Clase (`src/chunker/page.js`) que representa una página individual renderizada en el DOM.
- **AtPage**: Módulo handler (`src/modules/paged-media/atpage.js`) que procesa las reglas CSS `@page` incluyendo `:left` y `:right`.
- **Breaks**: Módulo handler (`src/modules/paged-media/breaks.js`) que gestiona los saltos de página `break-before: left/right`.
- **PagesArea**: Elemento DOM con clase `pagedjs_pages` que contiene todas las páginas renderizadas.
- **PageElement**: Elemento DOM con clase `pagedjs_page` que representa una página individual en el DOM.
- **Left_Page_Class**: Clase CSS `pagedjs_left_page` asignada a páginas en posición par.
- **Right_Page_Class**: Clase CSS `pagedjs_right_page` asignada a páginas en posición impar.
- **Single_Page_Mode**: Modo de visualización donde cada página se muestra individualmente centrada, sin distinción izquierda/derecha.
- **Spread_Mode**: Modo de visualización por defecto donde las páginas tienen clases izquierda/derecha para layouts de libro.
- **ViewMode**: Opción de configuración que determina si el `Previewer` usa `Single_Page_Mode` o `Spread_Mode`.
- **CSS_Variable**: Variable CSS personalizada con prefijo `--pagedjs-` usada para controlar el layout.

## Requirements

### Requirement 1: Opción de configuración del modo de visualización

**User Story:** Como desarrollador que usa paper-view, quiero poder configurar el modo de visualización al instanciar el `Previewer`, para que pueda elegir entre página única centrada o el layout de libro existente.

#### Acceptance Criteria

1. THE `Previewer` SHALL aceptar una opción `viewMode` en su constructor con los valores `"single"` y `"spread"`.
2. WHEN el constructor del `Previewer` es invocado sin la opción `viewMode`, THE `Previewer` SHALL usar `"spread"` como valor por defecto.
3. WHEN el constructor del `Previewer` es invocado con `viewMode: "single"`, THE `Previewer` SHALL activar el `Single_Page_Mode` para toda la sesión de renderizado.
4. WHEN el constructor del `Previewer` es invocado con `viewMode: "spread"`, THE `Previewer` SHALL activar el `Spread_Mode` y mantener el comportamiento existente sin modificaciones.
5. IF el constructor del `Previewer` recibe un valor de `viewMode` distinto de `"single"` o `"spread"`, THEN THE `Previewer` SHALL emitir una advertencia en consola y usar `"spread"` como valor de respaldo.

---

### Requirement 2: Supresión de clases izquierda/derecha en Single_Page_Mode

**User Story:** Como desarrollador, quiero que en `Single_Page_Mode` las páginas no reciban las clases `pagedjs_left_page` ni `pagedjs_right_page`, para que no se apliquen estilos diferenciados por posición par/impar.

#### Acceptance Criteria

1. WHILE el `Previewer` opera en `Single_Page_Mode`, THE `Chunker` SHALL omitir la asignación de `Left_Page_Class` y `Right_Page_Class` a cada `PageElement`.
2. WHILE el `Previewer` opera en `Single_Page_Mode`, THE `Chunker` SHALL omitir la inserción de páginas en blanco generadas por saltos `break-before: left`, `break-before: right`, `break-before: verso` y `break-before: recto`.
3. WHILE el `Previewer` opera en `Spread_Mode`, THE `Chunker` SHALL mantener el comportamiento actual de asignación de `Left_Page_Class` y `Right_Page_Class`.
4. THE `Page` SHALL exponer el `ViewMode` activo como propiedad accesible para que los módulos handler puedan consultarlo.

---

### Requirement 3: Supresión de reglas CSS @page :left y @page :right en Single_Page_Mode

**User Story:** Como desarrollador, quiero que en `Single_Page_Mode` las reglas CSS `@page :left` y `@page :right` no se apliquen, para que todos los márgenes y estilos de página sean uniformes.

#### Acceptance Criteria

1. WHILE el `Previewer` opera en `Single_Page_Mode`, THE `AtPage` SHALL ignorar las reglas CSS `@page :left` y `@page :right` durante el procesamiento del árbol CSS.
2. WHILE el `Previewer` opera en `Single_Page_Mode`, THE `AtPage` SHALL aplicar únicamente las reglas `@page` sin pseudo-selector (selector `*`) y las reglas `@page :first` y `@page :blank`.
3. WHILE el `Previewer` opera en `Spread_Mode`, THE `AtPage` SHALL mantener el procesamiento actual de todas las reglas `@page` incluyendo `:left` y `:right`.
4. WHEN el `AtPage` ignora una regla `@page :left` o `@page :right` en `Single_Page_Mode`, THE `AtPage` SHALL omitir la regla sin emitir errores ni advertencias en consola.

---

### Requirement 4: Centrado horizontal de páginas en Single_Page_Mode

**User Story:** Como usuario final, quiero que cada página se muestre centrada horizontalmente en el viewport, para que la lectura sea cómoda independientemente del ancho de la ventana.

#### Acceptance Criteria

1. WHILE el `Previewer` opera en `Single_Page_Mode`, THE `Previewer` SHALL añadir la clase CSS `pagedjs_single_page_mode` al `PagesArea` durante la inicialización del renderizado.
2. WHILE la clase `pagedjs_single_page_mode` está presente en el `PagesArea`, THE `Previewer` SHALL aplicar estilos CSS que centren horizontalmente cada `PageElement` dentro del `PagesArea`.
3. THE `Previewer` SHALL implementar el centrado horizontal mediante `display: flex`, `flex-direction: column` y `align-items: center` en el `PagesArea` cuando `pagedjs_single_page_mode` está activo.
4. WHILE el `Previewer` opera en `Spread_Mode`, THE `Previewer` SHALL omitir la adición de la clase `pagedjs_single_page_mode` al `PagesArea`.
5. WHEN el `Previewer` es destruido o reiniciado, THE `Previewer` SHALL eliminar la clase `pagedjs_single_page_mode` del `PagesArea` si estaba presente.

---

### Requirement 5: Compatibilidad con el modo Spread existente

**User Story:** Como desarrollador que ya usa paper-view, quiero que el comportamiento existente de layout de libro no se vea afectado por esta nueva feature, para que mis integraciones actuales sigan funcionando sin cambios.

#### Acceptance Criteria

1. WHEN el `Previewer` es instanciado sin opciones, THE `Previewer` SHALL producir un resultado de renderizado idéntico al comportamiento anterior a esta feature.
2. WHEN el `Previewer` es instanciado con `viewMode: "spread"`, THE `Previewer` SHALL producir un resultado de renderizado idéntico al comportamiento anterior a esta feature.
3. THE `Chunker` SHALL mantener la lógica de `handleBreaks` para saltos `left`, `right`, `verso` y `recto` sin modificaciones cuando opera en `Spread_Mode`.
4. THE `AtPage` SHALL mantener el procesamiento de `addPageClasses` para `:left` y `:right` sin modificaciones cuando opera en `Spread_Mode`.

---

### Requirement 6: API pública del Previewer para consulta del modo activo

**User Story:** Como desarrollador, quiero poder consultar el modo de visualización activo en una instancia del `Previewer`, para que pueda adaptar la lógica de mi aplicación según el modo en uso.

#### Acceptance Criteria

1. THE `Previewer` SHALL exponer una propiedad de solo lectura `viewMode` que retorne el `ViewMode` activo (`"single"` o `"spread"`).
2. WHEN el `Previewer` emite el evento `rendered`, THE `Previewer` SHALL incluir el `ViewMode` activo en el objeto `flow` retornado por el método `preview`.
3. THE `Previewer` SHALL emitir un evento `viewModeChanged` con el nuevo valor de `ViewMode` si el modo es modificado después de la construcción de la instancia.
