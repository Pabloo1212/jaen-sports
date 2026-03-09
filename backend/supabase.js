import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// URL y anon key se inyectan en build (Vercel) vía config.js. En local: crea assets/js/config.js o define window.__SUPABASE_URL__ y window.__SUPABASE_ANON_KEY__
const supabaseUrl = window.__SUPABASE_URL__ || ''
const supabaseKey = window.__SUPABASE_ANON_KEY__ || ''

export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null
