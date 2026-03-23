import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function checkUser() {
  const { data, error } = await supabase
    .from('aesthetics')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Data:', JSON.stringify(data, null, 2));
  }
}

checkUser();
