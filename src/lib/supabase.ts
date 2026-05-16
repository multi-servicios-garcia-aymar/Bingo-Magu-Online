import { createClient } from '@supabase/supabase-js';

// Clean URL robustly: take only the base origin if it's a supabase.co URL
const sanitizeUrl = (url: string) => {
  if (!url) return '';
  let clean = url.trim();
  try {
    const parsed = new URL(clean);
    if (parsed.hostname.includes('.supabase.co')) {
      return `https://${parsed.hostname}`;
    }
    // Fallback for non-standard but potentially valid URLs
    return clean.replace(/\/rest\/v1(\/rest\/v1)*\/?$/, '').replace(/\/$/, '');
  } catch (e) {
    return clean.replace(/\/rest\/v1(\/rest\/v1)*\/?$/, '').replace(/\/$/, '');
  }
};

const supabaseUrl = sanitizeUrl((import.meta.env.VITE_SUPABASE_URL || '').trim());
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

const finalUrl = supabaseUrl || 'https://placeholder.supabase.co';
const finalKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL o Anon Key no configurados. Usando placeholders.');
}

export const supabase = createClient(finalUrl, finalKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    storageKey: 'bingo-magu-auth' // Use a specific key to avoid collisions
  }
});
