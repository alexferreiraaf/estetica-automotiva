import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function checkSuper() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'super@plataforma.com',
    password: 'wrongpassword'
  });
  // If error is "Invalid login credentials", the user EXISTS but password is wrong.
  // If error is something else, we check.
  console.log('Error:', error?.message);
}
checkSuper();
