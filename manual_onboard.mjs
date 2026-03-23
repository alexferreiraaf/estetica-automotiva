import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function onboard() {
  const { data, error } = await supabase.from('aesthetics').insert([
    {
      name: 'Fran Lava Car',
      owner: 'Franciele',
      email: 'francieledomingos100392@gmail.com',
      phone: '(14) 99763-0769',
      user_id: 'f8880053-9fe4-482d-8e50-98317a96013a',
      status: 'active'
    }
  ]).select();
  if (error) console.log('Error:', error.message);
  else console.log('Success:', data);
}
onboard();
