/**
 * Genera assets/js/config.js con las variables de Supabase desde el entorno.
 * Uso: en local con .env (SUPABASE_URL, SUPABASE_ANON_KEY) o en Vercel con las mismas env vars.
 */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'assets', 'js');
const out = path.join(dir, 'config.js');
const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const content = `// Generado en build. No editar a mano.
// Definir SUPABASE_URL y SUPABASE_ANON_KEY en Vercel o en .env local.
(function () {
  window.__SUPABASE_URL__ = ${JSON.stringify(url)};
  window.__SUPABASE_ANON_KEY__ = ${JSON.stringify(key)};
})();
`;

fs.writeFileSync(out, content, 'utf8');
console.log('Config escrita en', out);
