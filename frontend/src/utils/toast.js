// Lightweight in-app toast dispatcher using browser events.
export const toast = {
  success: (message) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, severity: 'success' } })),
  error: (message) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, severity: 'error' } })),
  info: (message) => window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, severity: 'info' } })),
};
