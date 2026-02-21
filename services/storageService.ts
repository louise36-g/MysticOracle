/**
 * Clean up deprecated localStorage keys
 * Call this on app initialization to remove stale data from older versions
 */
export const cleanupDeprecatedStorage = (): void => {
  const deprecatedKeys = [
    'readingHistory',           // Old reading history (now in database)
    'oldUserCredits',           // Old credit tracking
    'mystic_reading_history',   // Legacy key variant
    'user_session',             // Old session key
    'mystic_users_db',          // Old localStorage user DB
    'mystic_readings_db',       // Old localStorage readings DB
    'mystic_active_session',    // Old session management
    'mystic_device_reg_log',    // Old device registration tracking
  ];

  deprecatedKeys.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        console.log(`[StorageService] Cleaned up deprecated key: ${key}`);
      }
    } catch {
      // Ignore errors (e.g., localStorage unavailable)
    }
  });
};
