import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function claimSuper() {
  const { data, error } = await supabase.auth.signUp({
    email: 'super@plataforma.com',
    password: 'superpassword123'
  });
  if (error) console.log('Error:', error.message);
  else console.log('Success - SuperAdmin created!');
}
claimSuper();
