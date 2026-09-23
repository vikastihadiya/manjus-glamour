// ============================================================
// MANJU'S THE WORLD OF GLAMOUR
// Supabase Configuration
// ============================================================

// Replace these two values with the values from:
// Supabase → Project Settings → API

const SUPABASE_URL = "https://xrxpvjxqdqxybyohxrjy.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_WDjegJoZs6zagx7jiPn6rQ_a60EdHtp";

// Create the Supabase client
const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);
