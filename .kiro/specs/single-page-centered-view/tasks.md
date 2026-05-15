# Implementation Plan: single-page-centered-view

## Overview

Implementación incremental del modo de visualización de página única centrada. El flag `viewMode` fluye desde `Previewer` → `Chunker` → `Page`, condicionando la asignación de clases left/right, la inserción de blank pages y el procesamiento de reglas `@page :left/:right`. El CSS de centrado se inyecta en `base.js`. Los tests unitarios y property-based tests (fast-check) se añaden junto a cada componente modificado.

## Tasks

- [x] 1. Instalar fast-check y verificar entorno de tests
  - Ejecutar `npm install --save-dev fast-check@^3` para añadir la dependencia de property-based testing
  - Verificar que `tests/jest.config.js` ya cubre el patrón `**/*.test.js` (no requiere cambios)
  - Confirmar que `babel.config.js` transforma correctamente los módulos ES para Jest
  - _Requirements: Testing Strategy (design.md)_

- [x] 2. Modificar `Previewer` para aceptar y exponer `viewMode`
  - [x] 2.1 Actualizar constructor de `Previewer` en `src/polyfill/previewer.js`
    - Cambiar firma a `constructor(options = {})` y extraer `viewMode` de `options`
    - Validar que `viewMode` sea `"single"` o `"spread"`; si no, emitir `console.warn` y usar `"spread"`
    - Almacenar en `this._viewMode`
    - Añadir getter `get viewMode()` que retorne `this._viewMode`
    - Añadir setter `set viewMode(v)` que valide, actualice `this._viewMode` y emita evento `viewModeChanged`
    - En `preview()`, asignar `this.chunker.viewMode = this._viewMode` antes de llamar a `this.chunker.flow()`
    - Incluir `viewMode: this._viewMode` en el objeto `flow` retornado por `preview()`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 6.3_

  - [ ]* 2.2 Escribir property test — Property 1: Fallback para viewMode inválido
    - Crear `tests/previewer/previewer.test.js`
    - **Property 1: Fallback para viewMode inválido**
    - **Validates: Requirements 1.5**
    - Usar `fc.string().filter(s => s !== "single" && s !== "spread")` como arbitrario
    - Verificar que `new Previewer({ viewMode: invalidMode }).viewMode === "spread"` para 100 iteraciones

  - [ ]* 2.3 Escribir tests unitarios para `Previewer`
    - Constructor sin opciones → `viewMode === "spread"`
    - Constructor con `viewMode: "single"` → `viewMode === "single"`
    - Constructor con `viewMode: "spread"` → `viewMode === "spread"`
    - Getter `viewMode` retorna el valor correcto
    - Setter `viewMode` emite evento `viewModeChanged` con el nuevo valor
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 6.1, 6.3_

- [x] 3. Modificar `Page` para aceptar y exponer `viewMode`, y condicionar clases left/right
  - [x] 3.1 Actualizar `Page` en `src/chunker/page.js`
    - Añadir quinto parámetro `viewMode = "spread"` al constructor
    - Almacenar en `this.viewMode`
    - En el método `index(pgnum)`, descomentar y condicionar la lógica de clases left/right:
      - Si `this.viewMode !== "single"`: aplicar `pagedjs_left_page` (par) / `pagedjs_right_page` (impar)
      - Si `this.viewMode === "single"`: omitir completamente la asignación de ambas clases
    - _Requirements: 2.1, 2.3, 2.4_

  - [ ]* 3.2 Escribir property test — Property 2: Ausencia de clases left/right en Single_Page_Mode
    - Crear `tests/page/page.test.js`
    - **Property 2: Ausencia de clases left/right en Single_Page_Mode**
    - **Validates: Requirements 2.1**
    - Usar `fc.integer({ min: 0, max: 999 })` como arbitrario para el índice de página
    - Instanciar `Page` con `viewMode: "single"`, llamar `index(pageIndex)` y verificar ausencia de ambas clases

  - [ ]* 3.3 Escribir property test — Property 4: Asignación correcta de clases left/right en Spread_Mode
    - **Property 4: Asignación correcta de clases left/right en Spread_Mode**
    - **Validates: Requirements 2.3, 5.3**
    - Usar `fc.integer({ min: 0, max: 999 })` como arbitrario
    - Verificar que índice par → `pagedjs_right_page` e índice impar → `pagedjs_left_page`

  - [ ]* 3.4 Escribir tests unitarios para `Page`
    - `Page` expone propiedad `viewMode` con el valor pasado al constructor
    - `Page` con `viewMode: "spread"` y `index(0)` → tiene `pagedjs_right_page`
    - `Page` con `viewMode: "single"` y `index(0)` → no tiene `pagedjs_left_page` ni `pagedjs_right_page`
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 4. Modificar `Chunker` para propagar `viewMode`, gestionar la clase del PagesArea y suprimir blank pages
  - [x] 4.1 Actualizar `Chunker` en `src/chunker/chunker.js`
    - Añadir propiedad `this.viewMode = "spread"` en el constructor
    - En `setup(renderTo)`: si `this.viewMode === "single"`, añadir clase `pagedjs_single_page_mode` al `pagesArea`
    - En `addPage(blank)`: pasar `this.viewMode` como quinto argumento al constructor de `Page`
    - En `handleBreaks(node)`: añadir al inicio `if (this.viewMode === "single") { return; }` para suprimir todas las blank pages
    - _Requirements: 2.1, 2.2, 2.3, 4.1, 5.2, 5.3_

  - [ ]* 4.2 Escribir property test — Property 3: Supresión de blank pages en Single_Page_Mode
    - Añadir en `tests/chunker/chunker.test.js`
    - **Property 3: Supresión de blank pages en Single_Page_Mode**
    - **Validates: Requirements 2.2**
    - Usar `fc.constantFrom("left", "right", "verso", "recto")` como arbitrario
    - Verificar que `chunker.pages.length` no aumenta tras llamar a `handleBreaks` con cada valor de break

  - [ ]* 4.3 Escribir tests unitarios para `Chunker`
    - `setup()` en single mode → `pagesArea` tiene clase `pagedjs_single_page_mode`
    - `setup()` en spread mode → `pagesArea` NO tiene clase `pagedjs_single_page_mode`
    - `addPage()` en single mode → la página creada tiene `viewMode === "single"`
    - `handleBreaks` en single mode con nodo `data-break-before="left"` → no añade páginas
    - _Requirements: 2.1, 2.2, 4.1, 4.4_

- [x] 5. Checkpoint — Verificar tests de Previewer, Page y Chunker
  - Asegurar que todos los tests pasan hasta este punto, preguntar al usuario si surgen dudas.

- [x] 6. Modificar `AtPage` para suprimir `@page :left/:right` en Single_Page_Mode
  - [x] 6.1 Actualizar `addPageClasses` en `src/modules/paged-media/atpage.js`
    - En el bloque que procesa `":left"` y `":right"` dentro de `addPageClasses(pages, ast, sheet)`, envolver cada bloque con la condición:
      ```javascript
      if (this.chunker.viewMode !== "single") { ... }
      ```
    - La condición aplica únicamente a los bloques de `":left"` y `":right"`; los bloques de `"*"`, `":first"`, `":blank"` y nth/named pages no se modifican
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 6.2 Escribir property test — Property 5: Supresión de @page :left/:right en Single_Page_Mode
    - Crear `tests/atpage/atpage.test.js`
    - **Property 5: Supresión de @page :left/:right en Single_Page_Mode**
    - **Validates: Requirements 3.1, 3.4**
    - Usar `fc.constantFrom(":left", ":right")` como arbitrario
    - Verificar que tras `addPageClasses` en single mode, las entradas `:left` y `:right` no tienen `added === true`

  - [ ]* 6.3 Escribir property test — Property 6: Procesamiento de @page :left/:right en Spread_Mode
    - **Property 6: Procesamiento de @page :left/:right en Spread_Mode**
    - **Validates: Requirements 3.3, 5.4**
    - Verificar que en spread mode, las entradas `:left` y `:right` tienen `added === true` tras `addPageClasses`

  - [ ]* 6.4 Escribir tests unitarios para `AtPage`
    - En single mode: `@page :first` y `@page :blank` se procesan normalmente
    - En single mode: `@page :left` y `@page :right` no se añaden (sin `added === true`)
    - En spread mode: `@page :left` y `@page :right` se procesan normalmente
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Añadir CSS de centrado en `src/polisher/base.js`
  - Añadir al final del string CSS exportado la regla:
    ```css
    .pagedjs_pages.pagedjs_single_page_mode {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
    ```
  - La regla debe colocarse fuera del bloque `@media print` para no afectar la impresión
  - _Requirements: 4.2, 4.3_

- [x] 8. Integración final — conectar todos los componentes y verificar compatibilidad con Spread_Mode
  - [x] 8.1 Verificar que `lib/` (código compilado) refleja los cambios ejecutando `npm run compile`
    - Confirmar que `lib/polyfill/previewer.js`, `lib/chunker/chunker.js`, `lib/chunker/page.js`, `lib/modules/paged-media/atpage.js` y `lib/polisher/base.js` están actualizados
    - _Requirements: 5.1, 5.2_

  - [x] 8.2 Crear spec de integración `specs/single-page-centered-view/single-page-centered-view.spec.js`
    - Crear HTML de prueba `specs/single-page-centered-view/single-page-centered-view.html` con contenido de varias páginas
    - Verificar que en single mode: ningún `.pagedjs_page` tiene clase `pagedjs_left_page` o `pagedjs_right_page`
    - Verificar que en single mode: el `.pagedjs_pages` tiene clase `pagedjs_single_page_mode`
    - Verificar que en spread mode (sin opciones): el comportamiento es idéntico al anterior (clases left/right presentes)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 9. Checkpoint final — Asegurar que todos los tests pasan
  - Ejecutar `npm run tests` para confirmar que todos los tests unitarios y property-based tests pasan
  - Asegurar que todos los tests pasan, preguntar al usuario si surgen dudas.

## Notes

- Las sub-tareas marcadas con `*` son opcionales y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los property tests usan **fast-check** (mínimo 100 iteraciones por propiedad)
- Los tests unitarios usan **Jest 29** con entorno **jsdom**
- La lógica de clases left/right en `page.js` está actualmente comentada en el código fuente — la tarea 3.1 la descomenta y condiciona
- El módulo `Breaks` (`src/modules/paged-media/breaks.js`) no requiere cambios: solo añade atributos `data-*` al DOM, la supresión de blank pages se gestiona en `Chunker.handleBreaks()`
- Los tests de integración existentes en `specs/` no deben verse afectados ya que el modo por defecto sigue siendo `"spread"`
