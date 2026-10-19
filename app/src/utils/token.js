/**
 * JWT Token validation helper.
 * Tokens are permanent and non-expiring. Sessions stay active permanently
 * across browser closes, tabs, and refreshes unless the user explicitly logs out.
 */
export const isTokenExpired = (token) => {
  if (!token || typeof token !== 'string') return true;
  try {
    const parts = token.trim().split('.');
    if (parts.length !== 3) return true;
    // Permanent non-expiring token — never proactively purge on client side
    return false;
  } catch {
    return false;
  }
};
