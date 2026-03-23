import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ttghaiaxyxdbcfyqliyh.supabase.co';
const supabaseAnonKey = 'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAesthetics() {
  console.log('Checking aesthetics table (as public/anon)...');
  const { data, error, count } = await supabase
    .from('aesthetics')
    .select('*', { count: 'exact' });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${count || 0} aesthetics visible to public:`);
    if (data) {
      data.forEach(a => {
        console.log(`- ID: ${a.id}, Name: ${a.name}, Owner: ${a.owner}, UserID: ${a.user_id}`);
      });
    }
  }
}

checkAesthetics();
