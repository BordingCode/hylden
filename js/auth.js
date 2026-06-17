// ===== Spotify login via PKCE (no server, no secret needed) =====
import { CONFIG, redirectUri } from './config.js';

const KEY = 'hylden.tokens';
const VERIFIER = 'hylden.verifier';

const rand = (len) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const a = new Uint8Array(len); crypto.getRandomValues(a);
  return Array.from(a, b => chars[b % chars.length]).join('');
};
async function sha256(plain){
  const data = new TextEncoder().encode(plain);
  return new Uint8Array(await crypto.subtle.digest('SHA-256', data));
}
const b64url = (bytes) => btoa(String.fromCharCode(...bytes))
  .replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');

// Send the user to Spotify to approve access.
export async function login(){
  const verifier = rand(64);
  sessionStorage.setItem(VERIFIER, verifier);
  const challenge = b64url(await sha256(verifier));
  const p = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    response_type: 'code',
    redirect_uri: redirectUri(),
    code_challenge_method: 'S256',
    code_challenge: challenge,
    scope: CONFIG.SCOPES,
  });
  location.assign(`${CONFIG.AUTH_URL}?${p}`);
}

// On return from Spotify there is a ?code=… in the URL. Trade it for a token.
export async function handleRedirect(){
  const params = new URLSearchParams(location.search);
  if (params.get('error')) { cleanUrl(); throw new Error(params.get('error')); }
  const code = params.get('code');
  if (!code) return false;
  const verifier = sessionStorage.getItem(VERIFIER);
  const body = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
    code_verifier: verifier || '',
  });
  const res = await fetch(CONFIG.TOKEN_URL, {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body,
  });
  if (!res.ok) { cleanUrl(); throw new Error('token_exchange_failed'); }
  store(await res.json());
  sessionStorage.removeItem(VERIFIER);
  cleanUrl();
  return true;
}

function store(t){
  const tokens = {
    access_token: t.access_token,
    refresh_token: t.refresh_token || getTokens()?.refresh_token,
    expires_at: Date.now() + (t.expires_in - 60) * 1000,
  };
  localStorage.setItem(KEY, JSON.stringify(tokens));
}
const getTokens = () => { try{ return JSON.parse(localStorage.getItem(KEY)); }catch{ return null; } };
export const isLoggedIn = () => !!getTokens()?.refresh_token;
export function logout(){ localStorage.removeItem(KEY); }

// Always returns a fresh, valid access token (refreshing silently if needed).
export async function getAccessToken(){
  const t = getTokens();
  if (!t) return null;
  if (Date.now() < t.expires_at) return t.access_token;
  const body = new URLSearchParams({
    client_id: CONFIG.CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: t.refresh_token,
  });
  const res = await fetch(CONFIG.TOKEN_URL, {
    method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body,
  });
  if (!res.ok){ logout(); return null; }
  store(await res.json());
  return getTokens().access_token;
}

function cleanUrl(){ history.replaceState({}, '', redirectUri()); }
