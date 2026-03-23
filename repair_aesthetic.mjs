import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function repair() {
  // Sign in as SuperAdmin
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'super@plataforma.com',
    password: 'superpassword123'
  });

  if (authError) {
    console.log('SuperAdmin Login Error:', authError.message);
    return;
  }

  console.log('Logged in as SuperAdmin!');

  const { data, error } = await supabase.from('aesthetics').insert([
    {
      name: 'Fran Lava Car',
      owner: 'Franciele Domingos',
      email: 'francieledomingos100392@gmail.com',
      phone: '(14) 99763-0769',
      user_id: null,
      status: 'active'
    }
  ]).select();

  if (error) console.log('Insert Error:', error.message);
  else console.log('Success - Aesthetic repaired:', data);
}
repair();
