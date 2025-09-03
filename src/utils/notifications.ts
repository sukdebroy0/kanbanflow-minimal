export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function showNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      ...options
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  }
}

export function scheduleNotification(task: any) {
  if (!task.dueDate || !task.reminderTime || task.notificationSent) return;

  const now = new Date();
  const dueDate = new Date(task.dueDate);
  
  if (task.dueTime) {
    const [hours, minutes] = task.dueTime.split(':');
    dueDate.setHours(parseInt(hours), parseInt(minutes));
  }

  const reminderDate = new Date(dueDate.getTime() - task.reminderTime * 60000);
  const timeUntilReminder = reminderDate.getTime() - now.getTime();

  if (timeUntilReminder > 0) {
    setTimeout(() => {
      showNotification(`Task Reminder: ${task.title}`, {
        body: task.description || 'Task is due soon!',
        tag: task.id,
        requireInteraction: true
      });
    }, timeUntilReminder);
  }
}