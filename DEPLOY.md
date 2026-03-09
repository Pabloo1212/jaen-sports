# Guía paso a paso: Supabase, Google Login, GitHub y Vercel

Sigue los bloques en orden. Donde diga "TU_..." sustituye por tus datos reales.

---

## Parte A: Crear el proyecto en Supabase

### A.1 Entrar y crear proyecto

1. Abre [https://supabase.com](https://supabase.com) e inicia sesión.
2. Pulsa **"New project"**.
3. Elige tu **Organization** (o crea una).
4. Rellena:
   - **Name**: por ejemplo `jaen-sports`.
   - **Database Password**: inventa una contraseña fuerte y **guárdala** (la pide a veces el panel).
   - **Region**: elige la más cercana (ej. West EU).
5. Pulsa **"Create new project"** y espera 1–2 minutos.

### A.2 Copiar URL y clave anon

1. En el menú izquierdo: **Project Settings** (icono de engranaje).
2. Entra en **API**.
3. Anota o copia:
   - **Project URL**: algo como `https://abcdefghijk.supabase.co`.
   - **Project API keys** → la clave **anon** **public** (no uses la `service_role` en el front).

Guarda estos dos valores; los usarás en **config.js** (local) y en **Vercel** (variables de entorno).

### A.3 Crear tablas y trigger en la base de datos

1. En el menú izquierdo: **SQL Editor**.
2. Pulsa **"New query"**.
3. Abre en tu ordenador el archivo `backend/schema.sql` del proyecto y **copia todo** su contenido.
4. Pégalo en el editor SQL de Supabase.
5. Pulsa **"Run"** (o Ctrl+Enter).
6. Debe salir algo como "Success". Con eso quedan creadas las tablas `users` y `matches` y el trigger para crear el perfil al registrarse (email o Google).

---

## Parte B: Configurar Google en Google Cloud Console

Aquí creas las credenciales OAuth que luego pondrás en Supabase.

### B.1 Crear o elegir proyecto en Google Cloud

1. Abre [https://console.cloud.google.com](https://console.cloud.google.com).
2. Arriba a la izquierda, en el selector de proyecto, pulsa el nombre del proyecto.
3. Si quieres usar uno nuevo: **"New Project"**, nombre (ej. `jaen-sports`), **Create**.
4. Selecciona ese proyecto.

### B.2 Activar la API de Google+ (o People API)

1. Menú (las tres rayas) → **APIs & Services** → **Library**.
2. Busca **"Google+ API"** o **"Google People API"**.
3. Entra y pulsa **Enable** (si no estaba ya activada).  
   (Con "People API" suele bastar para login con Google.)

### B.3 Crear credenciales OAuth 2.0

1. Menú → **APIs & Services** → **Credentials**.
2. Arriba: **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**.
3. Si te pide configurar la pantalla de consentimiento:
   - **User Type**: **External** → **Create**.
   - **App name**: por ejemplo `JaénSports`.
   - **User support email**: tu correo.
   - **Developer contact**: tu correo.
   - **Save and Continue** hasta terminar (scopes por defecto están bien).
4. Vuelve a **Credentials** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**.
5. **Application type**: **Web application**.
6. **Name**: por ejemplo `JaénSports Web`.

### B.4 Orígenes autorizados de JavaScript (para uso en navegador)

En la misma pantalla del cliente OAuth, en **"Authorized JavaScript origins"** (Orígenes autorizados de JavaScript) añade **una línea por cada origen** (sin barra final):

- Para **desarrollo local** (Live Server, `npx serve`, etc.):
  - `http://localhost:5500`
  - `http://localhost:3000`
  - `http://127.0.0.1:5500`
  (Añade los puertos que uses.)
- Para **producción en Vercel** (sustituye por tu URL real):
  - `https://tu-proyecto.vercel.app`
  - Si Vercel te da otra (ej. `https://jaen-sports-abc123.vercel.app`), esa misma, sin `/index.html`.

Ejemplo:

```
http://localhost:5500
http://localhost:3000
https://jaen-sports.vercel.app
```

### B.5 URIs de redireccionamiento autorizados

En **"Authorized redirect URIs"** (URIs de redireccionamiento autorizados) solo necesitas **una** URI: la de Supabase. No es la de tu web, es la del callback de Supabase.

Sustituye `TU_PROYECTO_SUPABASE` por el **identificador de tu proyecto** de Supabase (lo ves en la URL del panel, o en tu Project URL: `https://TU_PROYECTO_SUPABASE.supabase.co`):

```
https://TU_PROYECTO_SUPABASE.supabase.co/auth/v1/callback
```

Ejemplo real:

```
https://abcdefghijk.supabase.co/auth/v1/callback
```

Añade solo esa línea, pulsa **"+ ADD URI"** si hace falta y luego **Save**.

### B.6 Copiar Client ID y Client Secret

1. En **Credentials**, en la lista verás tu **OAuth 2.0 Client ID** (nombre tipo "JaénSports Web").
2. Pulsa el nombre o el lápiz para abrirlo.
3. Copia:
   - **Client ID** (algo como `123456789-xxxx.apps.googleusercontent.com`).
   - **Client secret** (pulsa "Show" si no lo ves).

Los usarás en Supabase en el siguiente bloque.

---

## Parte C: Activar Google en Supabase y URLs de tu app

### C.1 Poner Client ID y Secret en Supabase

1. En Supabase, menú izquierdo: **Authentication** → **Providers**.
2. Busca **Google** y actívalo (toggle en **Enabled**).
3. Pega:
   - **Client ID**: el que copiaste de Google Cloud.
   - **Client Secret**: el que copiaste de Google Cloud.
4. **Save**.

### C.2 Site URL y Redirect URLs en Supabase

1. En Supabase: **Authentication** → **URL Configuration**.
2. **Site URL**: la URL principal de tu app.
   - En local (para pruebas): `http://localhost:5500` (o el puerto que uses).
   - En producción: tu URL de Vercel, por ejemplo `https://jaen-sports.vercel.app` (sin `/index.html`).
3. **Redirect URLs**: lista de URLs a las que Supabase puede redirigir después del login. Añade **cada una en una línea**:
   - Para local:
     - `http://localhost:5500/index.html`
     - `http://127.0.0.1:5500/index.html`
   - Para producción (sustituye por tu URL real de Vercel):
     - `https://tu-proyecto.vercel.app/index.html`

Ejemplo de Redirect URLs:

```
http://localhost:5500/index.html
http://127.0.0.1:5500/index.html
https://jaen-sports.vercel.app/index.html
```

4. **Save**.

Con esto, el login con Google ya está configurado en Supabase y en Google Cloud.

---

## Parte D: Desarrollo local (probar en tu PC)

### D.1 Crear el archivo de configuración

1. En la carpeta del proyecto `jaen-sports`, entra en `assets/js/`.
2. Copia el archivo `config.example.js` y renómbralo a `config.js` (o en PowerShell: `Copy-Item config.example.js config.js`).
3. Abre `config.js` y sustituye:
   - `https://TU_PROYECTO.supabase.co` → tu **Project URL** de Supabase (la que anotaste en A.2).
   - `tu_clave_anon_publica` → tu **anon key** de Supabase (la clave pública anon, no la service_role).

Guarda el archivo. **No subas `config.js` a GitHub** (ya está en `.gitignore`).

### D.2 Abrir la web en local

1. Abre la carpeta del proyecto en VS Code (o similar).
2. Si usas Live Server: clic derecho en `index.html` → "Open with Live Server". Anota la URL (ej. `http://127.0.0.1:5500/index.html`).
3. O en la terminal, desde la carpeta del proyecto: `npx serve .` y abre la URL que indique (ej. `http://localhost:3000`).

### D.3 Probar login

1. En la web local, pulsa **"Iniciar sesión"**.
2. Pulsa **"Continuar con Google"**.
3. Deberías ir a Google, elegir cuenta y volver a tu página ya logueado.
4. Si falla, revisa:
   - Que en Google Cloud tengas en **Orígenes autorizados** la URL de tu local (ej. `http://localhost:5500`).
   - Que en Supabase → Redirect URLs esté `http://localhost:5500/index.html` (o la que uses).
   - Que `config.js` tenga bien la URL y la anon key de Supabase.

---

## Parte E: Subir el proyecto a GitHub

### E.1 Inicializar Git y primer commit (en tu PC)

1. Abre terminal o PowerShell en la carpeta del proyecto:  
   `c:\Users\34634\Desktop\jaen-sports`
2. Ejecuta:

```powershell
git init
git add .
git status
```

Comprueba que **no** aparezca `config.js` en la lista (debe estar ignorado).

3. Primer commit:

```powershell
git commit -m "Initial commit: JaénSports con Supabase y login Google"
```

### E.2 Crear el repositorio en GitHub

1. Entra en [https://github.com](https://github.com) e inicia sesión.
2. Arriba a la derecha: **"+"** → **"New repository"**.
3. **Repository name**: por ejemplo `jaen-sports`.
4. Deja **Public**.
5. **No** marques "Add a README" ni ".gitignore" (el repo debe empezar vacío).
6. Pulsa **"Create repository"**.

### E.3 Conectar y subir

En la misma terminal (carpeta del proyecto), ejecuta las líneas que GitHub te muestra (sustituye TU_USUARIO por tu usuario de GitHub):

```powershell
git remote add origin https://github.com/TU_USUARIO/jaen-sports.git
git branch -M main
git push -u origin main
```

Si pide usuario y contraseña, usa un **Personal Access Token** de GitHub como contraseña (Settings → Developer settings → Personal access tokens). Tras esto, el código estará en GitHub.

### E.4 ¿Puedo subir arrastrando carpetas a GitHub?

**No.** En la web de GitHub no se puede arrastrar una carpeta y que se suba toda la estructura (backend, assets, blog, etc.). Solo puedes usar **"Add file" → "Upload files"** y soltar archivos sueltos; las subcarpetas no se crean solas y tendrías que ir creando cada carpeta y subiendo archivo a archivo, lo cual es muy pesado en un proyecto como este.

**Alternativa sin usar la terminal:** usar **GitHub Desktop**:

1. Descarga [GitHub Desktop](https://desktop.github.com) e instálalo.
2. **File** → **Add local repository** y elige la carpeta `jaen-sports` (si ya hiciste `git init` en E.1, la detectará).
3. Si no tenías Git iniciado, en su lugar: **File** → **New repository** → **Choose** y selecciona la carpeta `jaen-sports`; nombre `jaen-sports`, **Create repository**.
4. En GitHub Desktop verás todos los archivos listos para el primer commit. Escribe un mensaje (ej. "Initial commit") y pulsa **"Commit to main"**.
5. Arriba: **"Publish repository"** (o **Push origin** si ya publicaste). Marca **"Keep this code private"** si no quieres que sea público. Pulsa **"Publish Repository"**.
6. El código quedará en tu cuenta de GitHub sin escribir comandos en la terminal.

Resumen: arrastrar la carpeta a la **página** de GitHub no sirve; arrastrar/abrir la carpeta en **GitHub Desktop** sí es una forma cómoda de subir todo el proyecto.

---

## Parte F: Desplegar en Vercel

### F.1 Importar el proyecto

1. Entra en [https://vercel.com](https://vercel.com) e inicia sesión (con GitHub si puedes).
2. **"Add New..."** → **"Project"**.
3. En "Import Git Repository" selecciona tu repo `jaen-sports` (si no sale, conecta tu cuenta de GitHub a Vercel).
4. Pulsa **"Import"**.

### F.2 Variables de entorno

Antes de desplegar, en la misma pantalla:

1. En **"Environment Variables"** añade dos variables:
   - **Name**: `SUPABASE_URL`  
     **Value**: tu Project URL de Supabase (ej. `https://abcdefghijk.supabase.co`).
   - **Name**: `SUPABASE_ANON_KEY`  
     **Value**: tu anon public key de Supabase (la larga que copiaste en A.2).
2. Déjalas para **Production** (y si quieres también Preview).
3. No hace falta cambiar **Build Command**: el proyecto usa `npm run vercel-build` (está en `vercel.json`), que genera `config.js` con esas variables.

### F.3 Deploy

1. Pulsa **"Deploy"**.
2. Espera a que termine. Al final verás una URL tipo `https://jaen-sports-xxx.vercel.app`.

### F.4 Ajustar Supabase y Google con la URL real

1. Copia la URL que te ha dado Vercel (sin `/index.html`), por ejemplo:  
   `https://jaen-sports-xxx.vercel.app`
2. **Supabase** → **Authentication** → **URL Configuration**:
   - **Site URL**: pon esa URL de Vercel (o déjala si ya la tenías).
   - **Redirect URLs**: añade `https://jaen-sports-xxx.vercel.app/index.html` (con tu URL real) si no estaba.
3. **Google Cloud** → **Credentials** → tu OAuth Client ID:
   - **Orígenes autorizados de JavaScript**: añade la URL de Vercel sin barra final, ej. `https://jaen-sports-xxx.vercel.app`.
   - No hace falta añadir nada más en "URIs de redireccionamiento"; el redirect de login lo hace Supabase (`...supabase.co/auth/v1/callback`).

Guarda en ambos sitios.

---

## Parte G: Comprobar que todo funciona

1. Abre la URL de Vercel (ej. `https://jaen-sports-xxx.vercel.app`).
2. Pulsa **"Iniciar sesión"** → **"Continuar con Google"**.
3. Inicia sesión con tu cuenta de Google y acepta los permisos.
4. Deberías volver a tu web en Vercel ya logueado (nombre o email en el header).

Si algo falla:

- **Consola del navegador (F12)** → pestaña Console: errores de red o de Supabase.
- **Supabase** → Authentication → Logs: ver intentos de login.
- **Google Cloud** → Credentials: revisa que el Client ID sea "Web application", con el origen de Vercel y el redirect de Supabase correctos.

---

## Resumen rápido: qué va en cada sitio

| Dónde | Qué poner |
|------|-----------|
| **Google Cloud – Orígenes autorizados de JavaScript** | `http://localhost:5500`, `https://tu-app.vercel.app` (donde se carga tu web). |
| **Google Cloud – URIs de redireccionamiento** | Solo `https://TU_PROYECTO.supabase.co/auth/v1/callback`. |
| **Supabase – Site URL** | URL principal de la app (local o Vercel). |
| **Supabase – Redirect URLs** | `http://localhost:5500/index.html`, `https://tu-app.vercel.app/index.html`. |
| **Vercel – Variables** | `SUPABASE_URL` y `SUPABASE_ANON_KEY`. |
| **Local – config.js** | Misma URL y anon key de Supabase. |

Con esta guía tienes todo el flujo: Supabase, login con Google (incluido Google Cloud), desarrollo local, GitHub y Vercel, paso a paso.
