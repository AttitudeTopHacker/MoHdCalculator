/**
 * JWT Token validation helper.
 * If token has no 'exp' claim, it is treated as a permanent non-expiring token.
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    // No exp claim = permanent non-expiring token
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};
