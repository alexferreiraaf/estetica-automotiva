import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function testRead() {
  const { data, error } = await supabase.from('aesthetics').select('phone');
  if (error) console.log('Error:', error.message);
  else console.log('Data:', data);
}
testRead();
