// ===== Hylden config =====
// CLIENT_ID is filled in after you create the free Spotify app (I'll walk you
// through it). It is NOT a password — it is safe to keep here in the open.
export const CONFIG = {
  CLIENT_ID: '30eeb236af454f8681712b210c00efe9',   // Mathias's Spotify app
  SCOPES: 'user-library-read user-top-read',
  AUTH_URL: 'https://accounts.spotify.com/authorize',
  TOKEN_URL: 'https://accounts.spotify.com/api/token',
  API: 'https://api.spotify.com/v1',
};

// The OAuth "redirect" target. Spotify requires this to match a registered URI
// EXACTLY (incl. trailing slash). Hardcode the live value so it never varies
// with how the page was opened (e.g. /hylden/index.html vs /hylden/).
const PROD_REDIRECT = 'https://bordingcode.github.io/hylden/';
export function redirectUri(){
  if (location.hostname.endsWith('github.io')) return PROD_REDIRECT;
  return location.origin + location.pathname;   // local dev only
}

export const hasClientId = () => CONFIG.CLIENT_ID.trim().length > 0;
