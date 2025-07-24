// Activity logger utility for tracking S3 operations

// Extend globalThis type to include our custom property
declare global {
  var _activityLog: any[];
}

// In-memory activity log
const activityLog: any[] =
  globalThis._activityLog || (globalThis._activityLog = []);

// Log a delete operation
export function logDelete(key: string) {
  activityLog.push({ type: "delete", key, timestamp: Date.now() });
}

// Log a move/rename operation
export function logMove(oldKey: string, newKey: string) {
  activityLog.push({
    type: "move",
    oldKey,
    newKey,
    timestamp: Date.now(),
  });
}

// Log an upload operation
export function logUpload(key: string, size?: number) {
  activityLog.push({
    type: "upload",
    key,
    size,
    timestamp: Date.now(),
  });
}

// Get recent activity logs
export function getRecentLogs(count: number = 100) {
  return activityLog.slice(-count).reverse(); // most recent first
}