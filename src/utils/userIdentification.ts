/**
 * Utility function to get or generate an anonymous user ID (GUID).
 * This ID is stored in localStorage to identify returning users.
 */
export const getAnonymousUserId = (): string => {
  if (typeof window === "undefined") return "";

  const STORAGE_KEY = "instance";
  let userId = localStorage.getItem(STORAGE_KEY);

  if (!userId) {
    // Generate a new GUID (UUID v4)
    userId = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, userId);
  }

  return userId;
};
