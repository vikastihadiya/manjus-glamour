/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";

const SUPABASE_PUBLISHABLE_KEY =
  "PASTE_YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE";

if (
  !SUPABASE_URL ||
  SUPABASE_URL.includes("PASTE_YOUR") ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY.includes("PASTE_YOUR")
) {
  console.error(
    "Supabase configuration is missing. Check supabase-config.js."
  );
}

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

window.supabaseClient = supabaseClient;
