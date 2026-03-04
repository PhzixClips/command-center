import { useCallback, useEffect, useRef } from "react";
import { NOTIFICATION_PERMISSION_GRANTED } from "../constants.js";

export default function useNotifications() {
  const permissionRef = useRef(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission === NOTIFICATION_PERMISSION_GRANTED) {
      permissionRef.current = NOTIFICATION_PERMISSION_GRANTED;
      return true;
    }
    try {
      const result = await Notification.requestPermission();
      permissionRef.current = result;
      return result === NOTIFICATION_PERMISSION_GRANTED;
    } catch {
      return false;
    }
  }, []);

  const notify = useCallback((title, options = {}) => {
    if (typeof Notification === "undefined") return;
    if (permissionRef.current !== NOTIFICATION_PERMISSION_GRANTED) return;
    try {
      const n = new Notification(title, {
        icon: "/command-center/favicon.ico",
        badge: "/command-center/favicon.ico",
        ...options,
      });
      // Auto-close after 8 seconds
      setTimeout(() => n.close(), 8000);
      return n;
    } catch {
      // Notifications not supported in this context (e.g. insecure origin)
    }
  }, []);

  const notifyPriceAlert = useCallback((alerts) => {
    if (!alerts.length) return;
    const body = alerts.map(s =>
      `${s.ticker}: $${s.currentPrice.toFixed(2)} (below $${s.alertBelow})`
    ).join("\n");
    notify("Price Alert", { body, tag: "price-alert" });
  }, [notify]);

  const notifyShiftReminder = useCallback((shiftInfo) => {
    notify("Shift Reminder", {
      body: `You have a ${shiftInfo.role || "shift"} at ${shiftInfo.time} today`,
      tag: "shift-reminder",
    });
  }, [notify]);

  return { requestPermission, notify, notifyPriceAlert, notifyShiftReminder };
}
