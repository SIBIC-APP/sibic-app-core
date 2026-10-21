# SIBIC — Sistema de Información de Balance Cívico

> **"Conoce. Compara. Decide."**  
> *Informar hoy para transformar las decisiones de mañana.*

Plataforma digital interactiva, accesible y neutral diseñada para acercar la información cívica y electoral de Guatemala a jóvenes, futuros votantes y a la ciudadanía en general.

---

## 🏛️ Principios Rectores

1. **Local Primero (*Local-First*):** El contenido y el progreso residen en el dispositivo (`content.db` y `user.db`). La app es 100% funcional sin conexión a internet.
2. **Neutralidad Verificable:** Toda propuesta, semblanza o dato cuenta con fuente original enlazada y fecha de actualización. SIBIC nunca recomienda por quién votar ni califica qué propuesta es mejor.
3. **Privacidad por Diseño (*Privacy by Design*):** El resultado y respuestas de **Mi Brújula** se calculan y guardan exclusivamente en el dispositivo del usuario. Nunca se sincronizan con servidores externos ni se analizan para perfilamiento.
4. **Backend Minimalista y Controlado:** Contenido distribuido en packs JSON estáticos versionados y firmados. Supabase se utiliza únicamente donde se requiere sincronización en la nube (OAuth, respaldos de aprendizaje y comunidad).
5. **TypeScript Estricto:** Código tipado bajo configuración estricta (`strict: true`).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
| :--- | :--- |
| **Framework Base** | [Expo SDK 58](https://expo.dev) + [Expo Router](https://docs.expo.dev/router/introduction/) |
| **Lenguaje** | TypeScript (`strict: true`) |
| **Estilos & UI** | [NativeWind v4](https://www.nativewind.dev/) + [Tailwind CSS v3](https://tailwindcss.com/) + `@rn-primitives` |
| **Bases de Datos Locales**| SQLite dual vía `expo-sqlite` (`content.db` editorial y `user.db` de usuario) |
| **Backend / Nube** | [Supabase](https://supabase.com/) (Autenticación OAuth Google/Apple y snapshots con RLS) |
| **Gestión de Estado** | [Zustand](https://github.com/pmndrs/zustand) |
| **Validación de Datos** | [Zod](https://zod.dev/) |
| **Testing** | [Vitest](https://vitest.dev/) (Node + JSDOM) + `better-sqlite3` |
| **Gestor de Paquetes** | [pnpm](https://pnpm.io/) (configurado con `node-linker=hoisted`) |

---

## 📱 Módulos Implementados

* **🧭 Mi Brújula:** Cuestionario cívico bidimensional adaptado al contexto guatemalteco (Eje Económico y Eje Social/Institucional). Visualización gráfica en 4 cuadrantes pasteles neutrales y explicaciones conceptuales sin encasillamiento partidario.
* **🎓 SIBIC Aprende:** Microaprendizaje gamificado sobre el funcionamiento del Estado, el sistema electoral y la detección de desinformación. Incluye acumulación de XP, niveles de ciudadanía y desbloqueo de variantes de **Sibi Cat**.
* **📚 SIBIC Historia:** Línea de tiempo interactiva de periodos institucionales y acontecimientos clave (Revolución del 44, Constitución del 85, Acuerdos de Paz del 96) con fuentes históricas enlazadas.
* **👤 Cuentas y Progreso:** Respaldo en la nube mediante OAuth (Google y Apple). Algoritmo de fusión: `Max(XP)` y unión de conjuntos de lecciones y Sibi Cats. Opción de eliminación de cuenta y datos conforme a las normativas de App Store y Google Play.

---

## 🚀 Requisitos Previos

* **Node.js:** Versión 22 LTS o superior (recomendado gestionar con [nvm](https://github.com/nvm-sh/nvm)).
* **pnpm:** Versión 10 o 11 instalada globalmente (`corepack enable` o `npm i -g pnpm`).

---

## ⚙️ Configuración del Entorno

1. Clona el repositorio e ingresa al directorio del proyecto:
   ```bash
   cd sibic-app
   ```

2. Copia el archivo de variables de entorno de ejemplo:
   ```bash
   cp env.example .env
   ```

3. Edita `.env` con las credenciales de tu proyecto de Supabase (o déjalas por defecto para desarrollo offline):
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica-aqui
   EXPO_PUBLIC_CONTENT_CDN_URL=https://sibic-gt.github.io/content
   EXPO_PUBLIC_APP_ENV=development
   ```

4. Instala las dependencias:
   ```bash
   pnpm install
   ```

---

## 💻 Comandos de Desarrollo

Inicia el entorno de desarrollo local con Metro Bundler:

```bash
# Iniciar servidor interactivo de desarrollo (Expo CLI)
pnpm start

# Ejecutar directamente en Web (abre en http://localhost:8081)
pnpm run web

# Ejecutar en emulador / dispositivo Android
pnpm run android

# Ejecutar en simulador iOS (requiere macOS y Xcode)
pnpm run ios
```

---

## 📦 Comandos de Producción

### 1. Build Web (SPA Estática)
SIBIC exporta una Single Page Application estática lista para desplegarse en Cloudflare Pages, Netlify, Vercel o EAS Hosting:

```bash
# Compila y exporta la aplicación web optimizada a la carpeta dist/
pnpm exec expo export --platform web

# Previsualizar el build de producción localmente
pnpm dlx serve dist
```

> **Nota sobre SQLite en Web:** El build web incluye el empaquetado de `wa-sqlite.wasm`. Si el hosting donde se aloja cuenta con las cabeceras `Cross-Origin-Opener-Policy: same-origin` y `Cross-Origin-Embedder-Policy: credentialless`, utilizará SQLite completo; en caso contrario, el adaptador de SIBIC conmuta automáticamente a almacenamiento en memoria/local de respaldo sin romper la experiencia.

### 2. Binarios Móviles para Tiendas (EAS Build)
Para compilar los instalables nativos de iOS y Android:

```bash
# Iniciar sesión en Expo Application Services
pnpm dlx eas-cli login

# Compilar instalable de Android (APK / AAB para Google Play)
pnpm dlx eas build --platform android --profile production

# Compilar instalable de iOS (IPA para TestFlight / App Store)
pnpm dlx eas build --platform ios --profile production
```

---

## 🧪 Pruebas y Validación de Calidad

El proyecto cuenta con un conjunto integral de pruebas automatizadas que se validan en cada Pull Request mediante GitHub Actions:

```bash
# Ejecutar verificación de tipos estricta con TypeScript
pnpm run typecheck

# Ejecutar la suite completa de pruebas unitarias con Vitest
pnpm test

# Ejecutar pruebas en modo observador (watch)
pnpm run test:watch

# Validar integridad criptográfica y esquemas Zod de los packs de contenido
pnpm run content:validate
```

---

## 📂 Estructura del Código

```
sibic-app/
├── app/                        # Rutas y pantallas (Expo Router)
│   ├── _layout.tsx             # Layout raíz, inicialización y stack
│   ├── index.tsx               # Portada principal de SIBIC
│   ├── aprende/                # Vistas de módulos y lecciones
│   ├── brujula/                # Cuestionario y gráfico 2D de Brújula
│   └── perfil/                 # Respaldo, sesión y eliminación de cuenta
├── src/
│   ├── features/               # Lógica de dominio desacoplada
│   │   ├── aprende/            # Repositorio, XP y cálculo de niveles
│   │   ├── brujula/            # Algoritmo matemático y persistencia local
│   │   ├── cuentas/            # Algoritmo de fusión y sincronización Supabase
│   │   └── historia/           # Repositorio de eventos y fuentes históricas
│   ├── db/                     # Capa de datos SQLite
│   │   ├── adapter/            # Adaptadores unificados (native, web, node)
│   │   ├── content/            # Migraciones de content.db
│   │   └── user/               # Migraciones de user.db
│   ├── content/                # Motor de sync de packs JSON y semillas
│   ├── lib/                    # Cliente Supabase
│   ├── store/                  # Stores reactivos de Zustand
│   └── global.css              # Tokens de diseño y variables CSS
├── packages/
│   └── content-schema/         # Esquemas Zod compartidos
├── content/                    # Fuente editorial de packs y manifest.json
├── supabase/                   # Configuración y migraciones PostgreSQL
└── docs/adr/                   # Decisiones de arquitectura documentadas
```

---

## 📄 Licencia y Contacto
Proyecto desarrollado para la formación cívica y fortalecimiento democrático en Guatemala.
Contacto institucional: `cas22894@uvg.edu.gt`
