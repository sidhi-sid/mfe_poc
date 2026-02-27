import { useEffect } from "react";
import { toast } from "sonner";
import { useNotificationStore } from "@/store";

type MfeNotificationDetail = {
  source?: string;
  type: string;
  title: string;
  message: string;
  timestamp?: number;
};

function handleNotification(detail: MfeNotificationDetail) {
  const payload: Required<MfeNotificationDetail> = {
    source: detail.source ?? "mfe",
    type: detail.type ?? "info",
    title: detail.title ?? "",
    message: detail.message ?? "",
    timestamp: detail.timestamp ?? Date.now(),
  };

  useNotificationStore.getState().addNotification(payload);

  const { type, title, message } = payload;

  switch (type) {
    case "success":
      toast.success(title, { description: message });
      break;
    case "error":
      toast.error(title, { description: message });
      break;
    case "warning":
      toast.warning(title, { description: message });
      break;
    default:
      toast.info(title, { description: message });
  }
}

export function useMfeNotifications() {
  useEffect(() => {
    const eventHandler = (e: CustomEvent<MfeNotificationDetail>) => {
      handleNotification(e.detail);
    };

    const messageHandler = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type !== "mfe:notification") return;

      const detail = (e.data as { detail?: MfeNotificationDetail }).detail;
      if (!detail) return;

      handleNotification(detail);
    };

    window.addEventListener("mfe:notification", eventHandler as EventListener);
    window.addEventListener("message", messageHandler);

    return () => {
      window.removeEventListener("mfe:notification", eventHandler as EventListener);
      window.removeEventListener("message", messageHandler);
    };
  }, []);
}