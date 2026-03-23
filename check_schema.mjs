import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ttghaiaxyxdbcfyqliyh.supabase.co',
  'sb_publishable_vG3Hbnnex0uGxUlLz81x_g_wmGXc5qz'
);

async function checkSchema() {
  const { data: bookings, error: bError } = await supabase.from('bookings').select('*').limit(1);
  const { data: services, error: sError } = await supabase.from('services').select('*').limit(1);
  
  if (bookings && bookings.length > 0) {
    console.log('Bookings columns:', Object.keys(bookings[0]));
  } else {
    console.log('No bookings found to check schema');
  }

  if (services && services.length > 0) {
    console.log('Services columns:', Object.keys(services[0]));
  } else {
    console.log('No services found to check schema');
  }
}
checkSchema();
