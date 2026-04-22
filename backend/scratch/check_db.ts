import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log('Checking for any emails in the database...');
  
  const { data: emails, error } = await supabase
    .from('emails')
    .select('subject, labels, provider_message_id')
    .limit(10);

  if (error) {
    console.error('Error fetching emails:', error.message);
    return;
  }

  console.log(`Total emails found in DB: ${emails.length}`);
  
  const trashEmails = emails.filter(e => e.labels?.includes('TRASH'));
  console.log(`Emails with 'TRASH' label: ${trashEmails.length}`);
  
  if (trashEmails.length > 0) {
    trashEmails.forEach(e => {
      console.log(`- Subject: ${e.subject}, Labels: [${e.labels.join(', ')}]`);
    });
  } else {
    console.log('No emails with "TRASH" label found in the top 10 results.');
    console.log('Sampling labels from all fetched emails:');
    emails.forEach(e => {
      console.log(`- ${e.subject}: [${e.labels?.join(', ')}]`);
    });
  }
}

migrate();
