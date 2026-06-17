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

// The page's own address, used as the OAuth "redirect" target.
// This exact value must be registered in the Spotify app's settings.
export function redirectUri(){
  return location.origin + location.pathname;
}

export const hasClientId = () => CONFIG.CLIENT_ID.trim().length > 0;
