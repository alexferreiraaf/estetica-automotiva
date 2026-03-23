import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function checkNonExistent() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'nonexistent_asdf_123@xyz.com',
    password: 'wrongpassword'
  });
  console.log('Error:', error?.message);
}
checkNonExistent();
