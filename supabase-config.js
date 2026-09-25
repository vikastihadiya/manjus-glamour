/* =====================================================
   MANJU'S THE WORLD OF GLAMOUR
   SUPABASE CONFIGURATION
===================================================== */

window.SUPABASE_URL =
    "https://xrxpvjxqdqxybyohxrjy.supabase.co";

window.SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_WDjegJoZs6zagx7jiPn6rQ_a60EdHtp";

window.supabaseClient =
    window.supabase.createClient(
        window.SUPABASE_URL,
        window.SUPABASE_PUBLISHABLE_KEY
    );

console.log("Supabase client created:", !!window.supabaseClient);
