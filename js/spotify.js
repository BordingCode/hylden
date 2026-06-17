// ===== Talk to the Spotify Web API =====
import { CONFIG } from './config.js';
import { getAccessToken, logout } from './auth.js';

async function api(path){
  const token = await getAccessToken();
  if (!token) throw new Error('not_authed');
  const res = await fetch(CONFIG.API + path, { headers:{ Authorization:`Bearer ${token}` } });
  if (res.status === 401){ logout(); throw new Error('not_authed'); }
  if (res.status === 429){ // rate limited — wait and retry once
    const wait = (parseInt(res.headers.get('Retry-After')||'2',10)+1)*1000;
    await new Promise(r=>setTimeout(r,wait));
    return api(path);
  }
  if (!res.ok) throw new Error('api_'+res.status);
  return res.json();
}

// Normalise a Spotify album object into what the shelf needs.
function shape(album, addedAt){
  const imgs = album.images || [];
  return {
    id: album.id,
    name: album.name,
    artist: (album.artists||[]).map(a=>a.name).join(', '),
    cover: imgs[0]?.url || '',
    coverSmall: (imgs[1]||imgs[0])?.url || '',
    year: (album.release_date||'').slice(0,4),
    url: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
    added: addedAt ? Date.parse(addedAt) : 0,
  };
}

// Fetch the user's whole saved-albums library (paginated), reporting progress.
export async function fetchSavedAlbums(onProgress){
  const out = [];
  let url = '/me/albums?limit=50';
  let total = null;
  while (url){
    const data = await api(url);
    total = data.total;
    for (const item of data.items) out.push(shape(item.album, item.added_at));
    onProgress?.(out.length, total);
    url = data.next ? data.next.replace(CONFIG.API,'') : null;
  }
  return out;
}

export async function fetchProfile(){
  try { return await api('/me'); } catch { return null; }
}
