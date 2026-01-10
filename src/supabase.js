// Import Supabase depuis CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { IVONY_CONFIG } from './config.js';

// Initialisation du client Supabase
export const supabaseClient = createClient(IVONY_CONFIG.SUPABASE_URL, IVONY_CONFIG.SUPABASE_ANON_KEY);
