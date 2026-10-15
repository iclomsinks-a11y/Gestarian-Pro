# Rediseño Minimalista y Ejecutivo: Tarjetas de Inicio (Versiones, Área de Cliente y Botones)

Transformar la estética visual de la sección de tarjetas de la página de **Inicio** (las 4 tarjetas de versiones, la tarjeta del Área de Cliente y el contenedor final con los tres botones de acción) utilizando líneas ultra finas de 1px (*hairline*), rellenos sólidos mate muy oscuros (negro azabache) y tipografía delgada de alta sofisticación y seriedad.

> [!IMPORTANT]
> **Decisiones Confirmadas por el Usuario (Fase 1)**
> - **Fondo y Bordes**: Negro absoluto / Azabache sólido mate (`bg-neutral-950` / `#030712`) con bordes de línea finísima de 1px en plata/grafito (`border-white/10` o `border-neutral-800`).
> - **Tipografía y Acentos**: Tipografía delgada/ultraligera (`font-extralight` y `font-light`), espaciado amplio entre caracteres (`tracking-[0.2em]`), con un acento sobrio de línea fina celeste de 1px únicamente para la versión activa.

---

### 1. Visión General del Rediseño

Este rediseño eleva la experiencia visual de la sección inferior de **Inicio**, sustituyendo los degradados de color anteriores por un lenguaje de diseño arquitectónico, limpio, sobrio y de alta gama.

#### Componentes Afectados:
1. **Grid de las 4 Versiones** (*Lite*, *Quick*, *Pro*, *Enterprise*):
   - Fondos negros azabache mate puros (`bg-neutral-950`).
   - Bordes hairline de 1px en gris grafito sobrio.
   - Tipografía fina (`font-extralight` / `font-light`) y títulos con tracking extendido.
   - Estado **Versión Activa**: Marcado sutil con borde fino celeste de 1px (`border-sky-400/80` y `ring-1 ring-sky-400/20`), manteniendo la disciplina sobria sin sombras o neones exagerados.
   - Botones internos (*Registro*, *Seleccionar*, *Descargar*) adaptados a líneas finas y bloques sobrios.
2. **Tarjeta Destacada: Área de Clientes**:
   - Reemplazo del gradiente morado/azul por un panel plano negro mate con borde hairline de 1px.
   - Insignia (*badge*) e icono con trazado fino en plata y celeste discreto.
   - Botón de acceso de corte limpio y tipografía pulida.
3. **Contenedor Inferior de los 3 Botones de Acción**:
   - Módulo unificado negro mate (`bg-neutral-950`) con bordes súper finos de 1px.
   - Botones (*Iniciar Sesión*, *Registro de Usuario*, *Descargar Aplicación*) con estética fina, bordes definidos y máxima seriedad.

---

### 2. Especificación Visual y Estilo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       REDISEÑO MINIMALISTA DE INICIO                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌────────────┐ │
│  │ LITE            │ │ QUICK           │ │ PRO (ACTIVA)    │ │ ENTERPRISE │ │
│  │ bg-neutral-950  │ │ bg-neutral-950  │ │ bg-neutral-950  │ │bg-neutral..│ │
│  │ border-white/10 │ │ border-white/10 │ │ border-sky-400  │ │border-whi..│ │
│  │ font-extralight │ │ font-extralight │ │ font-extralight │ │font-extra..│ │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └────────────┘ │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ PORTAL WEB DE ÁREA DE CLIENTES                                        │  │
│  │ Fondo negro mate sólido • Borde 1px hairline • Tipografía fina        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │  [ Iniciar Sesión ]     [ Registro Usuario ]     [ Descargar App ]    │  │
│  │  Contenedor negro mate con bordes finos de 1px                        │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Paleta de Color y Atributos Tailwind:
- **Fondo de Tarjeta**: `bg-neutral-950` / `bg-black/90` (sólido mate).
- **Bordes Genéricos**: `border border-neutral-800` o `border-white/10` (1px ultra fino).
- **Borde Versión Activa**: `border border-sky-400/80 ring-1 ring-sky-400/30`.
- **Tipografía de Títulos**: `font-extralight` o `font-light`, `tracking-[0.2em]` o `tracking-[0.25em]`, `uppercase`.
- **Tipografía de Textos y Listas**: `font-light` / `font-normal` en tonos `text-neutral-300` e `text-neutral-400` con `border-t border-neutral-800/80` entre separadores.

---

### 3. Decisiones Clave de Producto

1. **Eliminación Total de Gradientes Saturados en Tarjetas**:
   - *Razón*: Se busca transmitir autoridad, sobriedad corporativa y sofisticación ejecutiva. Los fondos mate sólidos negros garantizan un aspecto duradero y maduro.
2. **Preservación Estricta de Funcionalidades e Interacciones**:
   - *Razón*: Toda la lógica de selección de plan (`handleSelectVersionCard`), apertura de registro (`handleRegisterPlan`), descarga (`handleDownloadApp`) e inicio de sesión (`setIsLoginModalOpen`) se mantiene 100% funcional sin alterar los flujos de usuario.

---

### 4. Arquitectura y Mapeo de Componentes

- **`src/components/HomeView.tsx`**:
  - `seccion-tarjetas`: Actualizar contenedor y grid de las 4 tarjetas de versión (`PLANS_CONFIG.map`).
  - `Tarjeta Área de Clientes`: Reestructurar estilos del banner `bg-gradient-...` a `bg-neutral-950 border border-neutral-800`.
  - `Tarjeta Inferior 3 Botones`: Reestructurar contenedor `bg-slate-900/80` a `bg-neutral-950 border border-neutral-800` y estilizar los botones internos con líneas finas.
