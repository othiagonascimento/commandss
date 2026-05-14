/**
 * Command AI — cliente Supabase no schema `command_ai`.
 * Reutiliza o client global (mesmo Supabase externo btoyclznuuwvxbsacemw).
 */
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://btoyclznuuwvxbsacemw.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b3ljbHpudXV3dnhic2FjZW13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NTIyNDEsImV4cCI6MjA4MzIyODI0MX0.gqhEFgwh-VFtsZQwqnXwv6Suncj87qaNHF0u6qXCMu4';

// Cliente dedicado ao schema command_ai (PostgREST exige client por schema).
export const commandDb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  db: { schema: 'command_ai' as never },
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'command-ai-auth', // separado pra não brigar com o client master
  },
  realtime: { params: { eventsPerSecond: 10 } },
});

// Sincroniza sessão com o client master (mesmo usuário logado).
import { supabase } from '@/integrations/supabase/client';
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) {
    commandDb.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    });
  } else {
    commandDb.auth.signOut();
  }
});
