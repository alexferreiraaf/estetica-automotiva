import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function checkSchema() {
  const { data: customers, error: cError } = await supabase.from('customers').select('*').limit(1);
  
  if (customers && customers.length > 0) {
    console.log('Customers columns:', Object.keys(customers[0]));
  } else {
    // Tenta descrever se não houver registros
    console.log('No customers found to check schema via select');
  }
}
checkSchema();
