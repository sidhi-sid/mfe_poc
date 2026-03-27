import { useOmsNotificationStore } from '../store/useOmsNotificationStore';

export function dispatchNotification({ type = 'success', title, message }) {
  const detail = { source: 'oms', type, title, message, timestamp: Date.now() };
  const event = new CustomEvent('mfe:notification', { detail });
  window.dispatchEvent(event);

  if (window.parent && window.parent !== window) {
    try {
      window.parent.postMessage(
        {
          type: 'mfe:notification',
          detail,
        },
        '*',
      );
    } catch (err) {
      console.warn('Failed to post mfe:notification to parent window', err);
    }
  }

  useOmsNotificationStore.getState().addNotification(detail);
}
