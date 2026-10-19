export type NotificationChannel = "email" | "telegram" | "both";
export type NotificationDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export type UserNotificationSettings = {
  channel: NotificationChannel;
  enabledDays: NotificationDay[];
  enabled: boolean;
  telegramChatId?: string | null;
};

export type PendingNotification = {
  userId: string;
  conferenceId: string;
  conferenceName: string;
  deadlineLabel: string;
  deadlineDate: string;
  daysLeft: number;
  channel: NotificationChannel;
  notificationKey: string;
};
