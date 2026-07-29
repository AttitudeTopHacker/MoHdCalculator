// ── Client-Side History Sync Manager ─────────────────────────────────────────
// Saves calculations locally first, then background-syncs them to the backend.

import { calculateApi } from '../api/calculateApi';

const LOCAL_STORAGE_KEY = 'ac_unsynced_history';

// Sync process lock to prevent concurrent runs
let isSyncing = false;

/**
 * Queue a new calculation history item locally and trigger background sync.
 */
export const queueHistory = (toolName, inputData, result) => {
  const token = localStorage.getItem('ac_token');
  
  // Create history item structure
  const newItem = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    toolName,
    inputData,
    result,
    timestamp: new Date().toISOString()
  };

  // 1. Read existing local queue
  let queue = [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) queue = JSON.parse(stored);
  } catch (err) {
    console.error("Failed to parse unsynced history queue", err);
  }

  // 2. Add to queue
  queue.push(newItem);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(queue));

  // 3. Trigger sync in background if logged in
  if (token) {
    syncHistory();
  }
};

/**
 * Sync all unsynced local history items to the backend server.
 */
export const syncHistory = async () => {
  if (isSyncing) return;
  const token = localStorage.getItem('ac_token');
  if (!token) return; // User not logged in, wait until they are.
  if (!navigator.onLine) return; // Offline, wait until connection restores.

  // Read queue
  let queue = [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) queue = JSON.parse(stored);
  } catch (err) {
    console.error("Failed to read history queue for sync", err);
    return;
  }

  if (queue.length === 0) return;

  isSyncing = true;
  console.log(`🔄 Starting sync of ${queue.length} history item(s) to server...`);

  const remainingQueue = [];

  for (const item of queue) {
    try {
      // Push to backend database
      await calculateApi.saveHistory(item.toolName, item.inputData, item.result);
      console.log(`✅ Synced history item: ${item.toolName}`);
    } catch (err) {
      console.error(`❌ Failed to sync history item: ${item.toolName}`, err);
      
      // If it's a 401 Unauthorized, token might be expired. Stop sync.
      if (err.response?.status === 401) {
        remainingQueue.push(...queue.slice(queue.indexOf(item)));
        break;
      }
      
      // Keep in queue to retry later
      remainingQueue.push(item);
    }
  }

  // Update localStorage queue
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(remainingQueue));
  isSyncing = false;
};

// ── Event Listeners ──────────────────────────────────────────────────────────
// Automatically trigger sync when browser comes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log("📶 Device is online. Running background history sync...");
    syncHistory();
  });
  
  // Initial sync attempt when script loads
  setTimeout(syncHistory, 3000);
}
