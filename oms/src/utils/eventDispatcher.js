/**
 * Dispatches a custom event to the window so the core shell can listen to it.
 * The core shell subscribes to "mfe:notification" events for toasts/alerts.
 */
export function dispatchNotification({ type = 'success', title, message }) {
  const event = new CustomEvent('mfe:notification', {
    detail: { source: 'oms', type, title, message, timestamp: Date.now() },
  });
  window.dispatchEvent(event);
}
