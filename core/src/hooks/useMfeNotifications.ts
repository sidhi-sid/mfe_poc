import { useEffect } from "react";
import { toast } from "sonner";

export function useMfeNotifications() {
  useEffect(() => {
    const handler = (e: CustomEvent) => {
      const { type, title, message } = e.detail;

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
    };
    console.log("HIIIIIIIIII")

    window.addEventListener("mfe:notification", handler as EventListener);
    return () => {
      window.removeEventListener("mfe:notification", handler as EventListener);
    };
  }, []);
}