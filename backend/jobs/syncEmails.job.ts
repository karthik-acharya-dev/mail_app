import cron from 'node-cron';
import { supabase } from '../utils/supabase';
import { fetchUnsyncedEmails as fetchGmail } from '../services/gmail.service';

// Run every 5 minutes
export const initCronJobs = () => {
  cron.schedule('*/5 * * * *', async () => {
    console.log('[Job] Starting background email sync...');
    
    try {
      // Get all connected accounts (Gmail, Outlook, etc.)
      const { data: accounts, error } = await supabase
        .from('provider_accounts')
        .select('id, provider_type, email_address, user_id');

      if (error) {
        console.error('[Job] Error fetching accounts for sync', error);
        return;
      }

      if (!accounts || accounts.length === 0) {
        console.log('[Job] No accounts found to sync.');
        return;
      }

      for (const account of accounts) {
        try {
          console.log(`[Job] Syncing ${account.provider_type} account: ${account.email_address}`);
          
          let newEmails = [];
          
          if (account.provider_type === 'gmail') {
            newEmails = await fetchGmail(account.id);
          } else if (account.provider_type === 'outlook') {
            // newEmails = await fetchOutlook(account.id);
            console.log(`[Job] Outlook sync not implemented yet for ${account.email_address}`);
          }

          if (newEmails.length > 0) {
            console.log(`[Job] Synced ${newEmails.length} new emails for ${account.email_address}`);
          } else {
             console.log(`[Job] No new emails for ${account.email_address}`);
          }
        } catch (err: any) {
          console.error(`[Job] Error syncing account ${account.email_address}: ${err.message}`);
        }
      }
    } catch (err) {
      console.error('[Job] Critical error in cron job', err);
    }
  });
};
