import { config } from "dotenv";
import { getSupabaseAdminClient } from "@/lib/notifications/dispatch";
import { getNearestDeadline } from "@/lib/utils";

config();

async function main() {
  const supabase = await getSupabaseAdminClient();
  if (!supabase) {
    throw new Error("Supabase admin client oluşturulamadı. .env değerlerini kontrol edin.");
  }

  const { data: settingsRows, error: settingsError } = await supabase
    .from("notification_settings")
    .select("user_id, channel, enabled, enabled_days, telegram_chat_id");

  if (settingsError) {
    throw settingsError;
  }

  const { data: profiles, error: profileError } = await supabase.auth.admin.listUsers();
  if (profileError) {
    throw profileError;
  }

  const userMap = new Map(profiles.users.map((user) => [user.id, user.email]));
  const enabledSettings = (settingsRows ?? []).filter((setting) => setting.enabled === true);

  const { data: followedRows, error: followedError } = await supabase
    .from("followed_conferences")
    .select("user_id, conference_id");

  if (followedError) {
    throw followedError;
  }

  const { data: conferenceRows, error: conferenceError } = await supabase.from("conferences").select("*");
  if (conferenceError) {
    throw conferenceError;
  }

  const conferenceMap = new Map((conferenceRows ?? []).map((conference) => [conference.id, conference]));

  const today = new Date();
  const dayName = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][today.getDay()];

  for (const setting of enabledSettings) {
    const allowedDays = new Set(setting.enabled_days ?? []);
    if (!allowedDays.has(dayName)) {
      continue;
    }

    const userEmail = userMap.get(setting.user_id) ?? null;
    const relevantFollowed = (followedRows ?? []).filter((row) => row.user_id === setting.user_id);

    for (const followed of relevantFollowed) {
      const conference = conferenceMap.get(followed.conference_id);
      if (!conference) {
        continue;
      }

      const nearest = getNearestDeadline({
        id: conference.id,
        name: conference.name,
        acronym: conference.acronym,
        description: conference.description,
        startDate: conference.start_date,
        endDate: conference.end_date,
        city: conference.city,
        country: conference.country,
        mode: conference.mode,
        topics: conference.topics,
        deadlines: conference.deadlines,
        publication: conference.publication,
        fees: conference.fees,
        officialUrl: conference.official_url,
        source: conference.source,
        lastVerified: conference.last_verified,
        trustLevel: conference.trust_level,
        trustNotes: conference.trust_notes,
        type: conference.type,
      });

      if (!nearest) {
        continue;
      }

      const daysLeft = nearest.daysLeft;
      if (![1, 7, 14, 30].includes(daysLeft)) {
        continue;
      }

      const key = `${followed.user_id}:${followed.conference_id}:${daysLeft}`;
      const { data: existing, error: existingError } = await supabase
        .from("sent_notifications")
        .select("id")
        .eq("user_id", followed.user_id)
        .eq("conference_id", followed.conference_id)
        .eq("notification_key", key)
        .maybeSingle();

      if (existingError) {
        throw existingError;
      }

      if (existing) {
        continue;
      }

      const { error: insertError } = await supabase.from("sent_notifications").insert({
        user_id: followed.user_id,
        conference_id: followed.conference_id,
        notification_key: key,
        channel: setting.channel,
      });

      if (insertError) {
        throw insertError;
      }

      const { sendEmailNotification } = await import("@/lib/notifications/email");
      const { sendTelegramNotification } = await import("@/lib/notifications/telegram");

      const text = [
        `Deadline alarmı`,
        `${conference.name}`,
        `${nearest.label}: ${nearest.value}`,
        `Kalan gün: ${daysLeft}`,
      ].join("\n");

      if ((setting.channel === "email" || setting.channel === "both") && userEmail) {
        await sendEmailNotification({
          to: userEmail,
          subject: `${conference.name} için deadline alarmı (${daysLeft} gün kaldı)`,
          text,
        });
      }

      if ((setting.channel === "telegram" || setting.channel === "both") && setting.telegram_chat_id) {
        await sendTelegramNotification({
          chatId: setting.telegram_chat_id,
          text,
        });
      }
    }
  }
}

main().then(() => {
  console.log("Deadline notification scan complete");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
