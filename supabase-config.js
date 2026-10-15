/* =========================================================
   MANJU'S THE WORLD OF GLAMOUR
   SUPABASE CONFIGURATION
   ========================================================= */

const SUPABASE_URL = "https://xrxpvjxqdqxybyohxrjy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_WDjegJoZs6zagx7jiPn6rQ_a60EdHtp";

// Only warn if the values are empty or still the placeholder text.
const PLACEHOLDER_URL = "YOUR_SUPABASE_URL";
const PLACEHOLDER_KEY = "YOUR_SUPABASE_PUBLISHABLE_KEY";

const configMissing =
  !SUPABASE_URL ||
  SUPABASE_URL === PLACEHOLDER_URL ||
  !SUPABASE_PUBLISHABLE_KEY ||
  SUPABASE_PUBLISHABLE_KEY === PLACEHOLDER_KEY;

if (configMissing) {
  console.error(
    "Supabase configuration is missing. Check supabase-config.js."
  );
}

// The Supabase library must be loaded before this file.
if (!window.supabase || typeof window.supabase.createClient !== "function") {
  console.error(
    "Supabase library not loaded. Add the Supabase CDN <script> before supabase-config.js."
  );
} else {
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
}
