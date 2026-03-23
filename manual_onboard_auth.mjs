import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function onboard() {
  // Sign in first
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'francieledomingos100392@gmail.com',
    password: '123456' // Set in previous test_signup.mjs
  });

  if (authError) {
    console.log('Login Error:', authError.message);
    return;
  }

  const user = authData.user;
  console.log('Logged in as:', user.id);

  const { data, error } = await supabase.from('aesthetics').insert([
    {
      name: 'Fran Lava Car',
      owner: 'Franciele',
      email: 'francieledomingos100392@gmail.com',
      phone: '(14) 99763-0769',
      user_id: user.id,
      status: 'active'
    }
  ]).select();
  if (error) console.log('Insert Error:', error.message);
  else console.log('Success:', data);
}
onboard();
