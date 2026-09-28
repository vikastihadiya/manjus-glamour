/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "https://xrxpvjxqdqxybyohxrjy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WDjegJoZs6zagx7jiPn6rQ_a60EdHtp";

if (
  !SUPABASE_URL ||
  SUPABASE_URL.includes("https://xrxpvjxqdqxybyohxrjy.supabase.co") ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY.includes("sb_publishable_WDjegJoZs6zagx7jiPn6rQ_a60EdHtp")
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
