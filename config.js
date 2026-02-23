// config.js
const SB_URL = "https://orbpzmqquzlqztxvcswm.supabase.co";
const SB_KEY = "sb_publishable_awj1FfT3WVkVWAxH6QLKmA_X1_K1JFe";

// Gunakan nama supabaseClient agar sinkron dengan auth.js
const supabaseClient = supabase.createClient(SB_URL, SB_KEY);