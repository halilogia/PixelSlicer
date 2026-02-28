// Cross-browser scheduler utility
// requestIdleCallback polyfill for Safari and older browsers
// Centralized abstraction for scheduling deferred tasks

/**
 * Schedule a task to run when the browser is idle.
 * Falls back to setTimeout for Safari and older browsers.
 */
export const scheduleTask = (
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number => {
  if ('requestIdleCallback' in window) {
    return requestIdleCallback(callback, options);
  }
  // Fallback to setTimeout for Safari
  return setTimeout(() => {
    callback({
      didTimeout: false,
      timeRemaining: () => 16, // Assume 16ms (60fps frame budget)
    } as IdleDeadline);
  }, 1) as unknown as number;
};

/**
 * Cancel a scheduled task.
 */
export const cancelScheduledTask = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
};

/**
 * Check if the browser supports requestIdleCallback natively.
 */
export const supportsRequestIdleCallback = (): boolean => {
  return 'requestIdleCallback' in window;
};
