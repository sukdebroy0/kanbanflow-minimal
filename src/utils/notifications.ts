export async function requestNotificationPermission(): Promise<boolean> {
  // Notifications disabled
  return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
  // Notifications disabled
  return;
}

export function scheduleNotification(task: any) {
  // Notifications disabled
  return;
}