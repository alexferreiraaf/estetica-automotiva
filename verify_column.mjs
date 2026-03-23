import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function checkSchema() {
  // Tenta selecionar especificamente o user_id
  const { data, error } = await supabase.from('customers').select('id, user_id').limit(1);
  
  if (error) {
    console.error('Error selecting user_id:', error.message);
    if (error.message.includes('column "user_id" does not exist')) {
        console.log('CONFIRMED: user_id column is MISSING');
    }
  } else {
    console.log('SUCCESS: user_id column EXISTS');
    console.log('Sample data:', data);
  }
}
checkSchema();
