import { createClient } from "@supabase/supabase-js";
import type { PendingNotification, UserNotificationSettings } from "@/lib/notifications/types";
import { sendEmailNotification } from "@/lib/notifications/email";
import { sendTelegramNotification } from "@/lib/notifications/telegram";

export async function dispatchNotification({
  notification,
  settings,
  userEmail,
}: {
  notification: PendingNotification;
  settings: UserNotificationSettings;
  userEmail?: string | null;
}) {
  const text = [
    `<b>Deadline yaklaşıyor</b>`,
    `Konferans: ${notification.conferenceName}`,
    `Deadline: ${notification.deadlineLabel}`,
    `Tarih: ${notification.deadlineDate}`,
    `Kalan gün: ${notification.daysLeft}`,
  ].join("\n");

  const channel = notification.channel || settings.channel;

  if ((channel === "email" || channel === "both") && userEmail) {
    await sendEmailNotification({
      to: userEmail,
      subject: `${notification.conferenceName} için deadline alarmı`,
      text,
    });
  }

  if ((channel === "telegram" || channel === "both") && settings.telegramChatId) {
    await sendTelegramNotification({
      chatId: settings.telegramChatId,
      text,
    });
  }
}

export async function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
