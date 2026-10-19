type TelegramBotClient = {
  sendMessage: (
    chatId: string,
    text: string,
    options?: { parse_mode?: string },
  ) => Promise<{ message_id: number }>;
};

type TelegramModule = {
  default?: new (token: string, options?: { polling?: boolean }) => TelegramBotClient;
};

export async function sendTelegramNotification({ chatId, text }: { chatId: string; text: string }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return { ok: false, reason: "TELEGRAM_BOT_TOKEN missing" };
  }

  const telegramModule = (await import("node-telegram-bot-api")) as unknown as TelegramModule;
  const TelegramBot = telegramModule.default ?? (telegramModule as unknown as new (token: string, options?: { polling?: boolean }) => TelegramBotClient);
  const bot = new TelegramBot(token, { polling: false });
  const result = await bot.sendMessage(chatId, text, { parse_mode: "HTML" });

  return { ok: true, messageId: result.message_id };
}
