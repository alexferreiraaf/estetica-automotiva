import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function check() {
  const { data, error } = await supabase.auth.signUp({
    email: 'francieledomingos100392@gmail.com',
    password: 'password_test_123'
  });
  if (error) {
    console.log('Error:', error.message);
    // If error.message contains "already registered", then they are there.
  } else {
    console.log('Success:', data.user?.id);
  }
}
check();
