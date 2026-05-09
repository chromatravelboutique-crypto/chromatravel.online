import cron from 'node-cron';
import { automationService } from '../services/crm/automation.service';

const DEFAULT_BRAND_ID = process.env.DEFAULT_BRAND_ID || '';
const TIMEZONE = 'America/Mexico_City';

export function initializeAutomationJobs() {
  console.log('[Cron] Initializing automation jobs...');

  if (!DEFAULT_BRAND_ID) {
    console.warn('[Cron] DEFAULT_BRAND_ID not set, automations will not run');
    return;
  }

  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Running birthday automation...');
    try {
      const result = await automationService.sendBirthdayMessages(DEFAULT_BRAND_ID);
      console.log('[Cron] Birthday automation completed:', result);
    } catch (error) {
      console.error('[Cron] Birthday automation error:', error);
    }
  }, { timezone: TIMEZONE });

  cron.schedule('0 */6 * * *', async () => {
    console.log('[Cron] Running cold leads follow-up...');
    try {
      const result = await automationService.followUpColdLeads(DEFAULT_BRAND_ID);
      console.log('[Cron] Cold leads follow-up completed:', result);
    } catch (error) {
      console.error('[Cron] Cold leads error:', error);
    }
  }, { timezone: TIMEZONE });

  cron.schedule('0 10 * * 1', async () => {
    console.log('[Cron] Running winback automation...');
    try {
      const result = await automationService.winbackInactiveCustomers(DEFAULT_BRAND_ID);
      console.log('[Cron] Winback automation completed:', result);
    } catch (error) {
      console.error('[Cron] Winback error:', error);
    }
  }, { timezone: TIMEZONE });

  cron.schedule('0 8 * * *', async () => {
    console.log('[Cron] Running trip reminders...');
    try {
      const result = await automationService.sendUpcomingTripReminders(DEFAULT_BRAND_ID);
      console.log('[Cron] Trip reminders completed:', result);
    } catch (error) {
      console.error('[Cron] Trip reminders error:', error);
    }
  }, { timezone: TIMEZONE });

  cron.schedule('0 18 * * *', async () => {
    console.log('[Cron] Running review requests...');
    try {
      const result = await automationService.requestReviews(DEFAULT_BRAND_ID);
      console.log('[Cron] Review requests completed:', result);
    } catch (error) {
      console.error('[Cron] Review requests error:', error);
    }
  }, { timezone: TIMEZONE });

  console.log('[Cron] Automation jobs scheduled:');
  console.log('  - Birthdays: Daily at 9:00 AM');
  console.log('  - Cold leads: Every 6 hours');
  console.log('  - Winback: Mondays at 10:00 AM');
  console.log('  - Trip reminders: Daily at 8:00 AM');
  console.log('  - Review requests: Daily at 6:00 PM');
}

export default initializeAutomationJobs;
