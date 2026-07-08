// Web Push notification service
// Sends push notifications via VAPID keys using the web-push library
import webpush from 'web-push';

import { env } from '../../../env.mjs';

// VAPID keys are configured from environment
const vapidPublicKey = env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = env.VAPID_PRIVATE_KEY;

// Configure web-push with VAPID details
webpush.setVapidDetails(
  'mailto:admin@littlerabbani.sch.id',
  vapidPublicKey,
  vapidPrivateKey
);

export { webpush };

export interface IPushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

/**
 * Send a push notification to a single subscription.
 * Returns true if sent successfully, false if subscription is invalid (needs removal).
 */
export async function sendPushNotification(
  subscription: {
    endpoint: string;
    p256dh: string;
    auth: string;
  },
  payload: IPushPayload
): Promise<{ success: boolean; needsRemoval: boolean }> {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify(payload)
    );
    return { success: true, needsRemoval: false };
  } catch (error: unknown) {
    // Check if subscription is expired/invalid (410 Gone, 404 Not Found)
    if (error instanceof webpush.WebPushError) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { success: false, needsRemoval: true };
      }
    }
    // Log other errors but don't remove subscription
    if (typeof error === 'object' && error !== null && 'message' in error) {
      console.error(
        '[Push] Error sending notification:',
        (error as { message: string }).message
      );
    } else {
      console.error('[Push] Error sending notification:', String(error));
    }
    return { success: false, needsRemoval: false };
  }
}
