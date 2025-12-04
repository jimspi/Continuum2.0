
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support desktop notification");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: '/favicon.ico', // Fallback if no icon
      // Silent true/false depending on preference, usually false for alerts
    });
  }
};

export const simulateEmailDispatch = async (email: string, subject: string, content: string) => {
  console.log(`[MOCK EMAIL SERVICE] 
  To: ${email}
  Subject: ${subject}
  Content: ${content.substring(0, 50)}...
  (Email sent successfully)`);
  return true;
};
