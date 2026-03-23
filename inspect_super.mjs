import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function inspect() {
  const { data, error } = await supabase.auth.signUp({
    email: 'super@plataforma.com',
    password: 'superpassword123'
  });
  if (error) {
    console.log('SignUp Error:', error.status, error.message);
  } else {
    console.log('User:', JSON.stringify(data.user, null, 2));
  }
}
inspect();
