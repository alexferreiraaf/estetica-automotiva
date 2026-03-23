import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Fetching aesthetics...");
  const { data: aesthetics } = await supabase.from('aesthetics').select('id, name, email, user_id');
  console.log(aesthetics);

  console.log("\nFetching services...");
  const { data: services } = await supabase.from('services').select('id, name, user_id');
  console.log(services);
}

run();
