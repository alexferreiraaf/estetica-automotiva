import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function testSignUp() {
  const { data, error } = await supabase.auth.signUp({
    email: 'francieledomingos100392@gmail.com',
    password: 'temporaryPassword123!'
  });

  if (error) {
    console.log('Error:', error.message);
    if (error.message.includes('already registered')) {
        console.log('RESULT: User exists in Auth but not in aesthetics table.');
    }
  } else {
    console.log('Data:', data);
    console.log('RESULT: User did not exist and was just created.');
  }
}

testSignUp();
