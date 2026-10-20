# ADR 0001: Definición del Proyecto SIBIC y Arquitectura Base

- **Estado:** Aceptado
- **Fecha:** 2026-10-20
- **Documentos de referencia:** `SIBIC_APP.pdf`, `SIBIC_DEV_PLAN.pdf`

---

## 1. Contexto y Propósito

En Guatemala, el acceso a información política verificable, estructurada y comprensible representa una barrera crítica para la participación ciudadana. La información disponible suele encontrarse dispersa, en formatos extensos (cientos de páginas de planes de gobierno), con complejidad técnica y sin mecanismos estandarizados que faciliten la comparación imparcial.

**SIBIC** (*Sistema de Información de Balance Cívico*) tiene como propósito centralizar, traducir y estructurar la información política y electoral de Guatemala en una experiencia digital visual, accesible e interactiva, bajo el lema:
> *"Conoce. Compara. Decide." — Informar hoy para transformar las decisiones de mañana.*

### Público Objetivo
- **Jóvenes votantes:** Primeros votantes o ciudadanos recién incorporados al padrón electoral.
- **Futuros votantes:** Adolescentes y estudiantes que construyen nociones cívicas y criterio político previo a la mayoría de edad.
- **Ciudadanía general:** Personas interesadas en contrastar propuestas y evaluar alternativas de manera directa y objetiva.

---

## 2. Principios de Arquitectura

1. **Local Primero (Local-First):** Todo el contenido base y el progreso del usuario residen en el dispositivo local. La conexión a red optimiza y sincroniza datos, pero la app es plenamente funcional sin conexión a internet.
2. **Neutralidad Verificable:** Cada propuesta, dato o semblanza cuenta con enlace a su fuente original y fecha de captura. La plataforma **no** emite juicios de valor, no califica qué propuesta es mejor y **jamás recomienda por quién votar** (tampoco funciones tipo "tu candidato afín").
3. **Privacidad por Diseño (Privacy by Design):** Los resultados del módulo *Mi Brújula* (posicionamiento y opiniones políticas) se calculan y almacenan de forma exclusivamente local en el dispositivo. Nunca se transmiten a servidores externos ni se analizan con fines de perfilamiento.
4. **Portabilidad y Control del Contenido:** El backend se define íntegramente como código y migraciones reproducibles en Supabase. El contenido editorial es gestionado en packs JSON estructurados y versionados de forma independiente.
5. **Monorepositorio Tipado Estricto:** Todo el código se desarrolla en TypeScript bajo configuración estricta (`strict: true`).

---

## 3. Ecosistema de Funcionalidades

| Módulo | Objetivo Principal | Características Técnicas |
| :--- | :--- | :--- |
| **Elecciones** | Centralización de procesos electorales en Guatemala | Cargos en disputa, partidos políticos, perfiles estandarizados (formación, trayectoria, propuestas), enlaces a fuentes directas. |
| **Compara** | Contraste lado a lado de candidatos y partidos | Fichas comparables por ejes temáticos (educación, salud, seguridad, economía, ambiente, etc.) con enlace a fuentes y fechas. |
| **Mi Brújula** | Exploración y autodescubrimiento cívico-político | Cuestionario contextualizado a Guatemala, representación visual de ejes y explicaciones neutrales. 100% local en `user.db`. |
| **Aprende** | Microaprendizaje y alfabetización cívica gamificada | Módulos interactivos y misiones breves, sistema de XP, niveles y recompensas desbloqueables con variantes de *Sibi Cat*. |
| **Historia** | Contexto y memoria histórica institucional | Líneas de tiempo interactivas de administraciones, períodos democráticos y transformaciones institucionales con respaldo académico. |
| **Comunidad** | Espacio de diálogo y discusión cívica informada | Debates estructurados y foros temáticos bajo moderación rigurosa, reportes, bloqueos y reglas visibles (respaldado en Supabase con RLS). |

---

## 4. Arquitectura de Datos y Sincronización

### 4.1 Bases de Datos Locales (SQLite dual)
- **`content.db` (Réplica de lectura editorial):**
  - Contiene partidos, candidatos, temas, propuestas, fuentes y contenido histórico.
  - Diseñada para ser desechable y reemplazable en cualquier momento mediante descargas de packs.
  - Implementa búsqueda de texto completo con SQLite FTS5 (`proposal_fts`).
- **`user.db` (Espacio protegido del usuario):**
  - Contiene progreso de lecciones, XP acumulado, Sibi Cats desbloqueados, elementos guardados y resultado local de Mi Brújula.
  - Base intocable: jamás es sobreescrita ni eliminada durante actualizaciones de contenido.
- **Patrón de Repositorio:** Toda interacción con la base de datos se realiza a través de `repository.ts` por feature, desacoplando el SQL de los componentes de UI.

### 4.2 Pipeline de Packs Editoriales
- Los packs de contenido se publican como archivos JSON estáticos en GitHub Pages (ej. `historia.v1.json`, `elecciones-2027.v1.json`).
- `manifest.json` contiene la lista de packs, números de versión, URLs, hashes sha256 (`expo-crypto`) y tamaño en bytes.
- Al detectar una nueva versión, la app valida la estructura con Zod y aplica los cambios en una única transacción local con rollback automático en caso de discrepancias.

### 4.3 Backend y Servicios en la Nube (Supabase)
- Utilizado exclusivamente donde se requiere sincronización multi-dispositivo o interacción social:
  - Autenticación OAuth (Google / Apple).
  - Respaldo de snapshot de progreso (XP, lecciones completadas, gatos desbloqueados, marcadores guardados; **excluyendo** Mi Brújula).
  - Módulo de Comunidad: hilos, comentarios, reacciones, reportes de moderación, bloqueos entre usuarios.
- Seguridad garantizada mediante Row-Level Security (RLS) en todas las tablas y políticas de límite de frecuencia (*rate limiting*).

---

## 5. Decisiones del Stack Tecnológico

- **Plataformas:** iOS, Android y Web (exportación SPA estática con Expo Router).
- **Framework Base:** Expo SDK (gestor pnpm con `node-linker=hoisted`), Expo Router con tipado estricto.
- **Estilos:** NativeWind v4 (Tailwind CSS v3) + primitivas de accesibilidad de React Native Reusables / `@rn-primitives`.
- **Gestión de Estado:** Zustand para UI y preferencias locales.
- **Validación de Datos:** Zod para contratos de API, esquemas JSON y validación de formularios.
- **Listas de Alto Rendimiento:** `@shopify/flash-list`.
- **Testing:**
  - Vitest para pruebas unitarias de lógica pura y cálculos de la Brújula en entorno Node.
  - Pruebas de componentes con JSDOM + alias a `react-native-web`.
  - Pruebas de bases de datos locales sobre `better-sqlite3`.

---

## 6. Sistema de Diseño y Tokens de Color

| Token | Modo Claro | Modo Oscuro | Propósito |
| :--- | :--- | :--- | :--- |
| `background` | `#FFFFFF` | `#0A1230` | Fondo general de la aplicación |
| `foreground` | `#0B1B45` | `#F2F3FA` | Texto principal (Navy institucional en claro) |
| `card` | `#FFFFFF` | `#121C45` | Superficies de contenedores y tarjetas |
| `primary` | `#6C3BFF` | `#8F6BFF` | Púrpura de acento identitario SIBIC |
| `primary-foreground` | `#FFFFFF` | `#0A1230` | Texto/iconos sobre color primario |
| `secondary / muted`| `#F4F3FF` | `#121C45` | Fondos secundarios y estados atenuados |
| `muted-foreground` | `#5B6280` | `#A9B0D0` | Subtítulos, metadatos y notas |
| `accent` | `#F7931E` | `#F7931E` | Naranja institucional SIBIC (badges, detalles) |
| `border / input` | `#E3E1F2` | `#26305E` | Bordes y divisiones estructurales |
| `destructive` | `#DC2626` | `#F87171` | Acciones de alerta y eliminación |
| `success` | `#16A34A` | `#4ADE80` | Estados positivos y verificados |

### Cuadrantes de Mi Brújula (Paleta Pastel Neutral)
- Cuadrante 1: `#FDE2E4`
- Cuadrante 2: `#DBE7FF`
- Cuadrante 3: `#D9F3E1`
- Cuadrante 4: `#FFF1C2`
