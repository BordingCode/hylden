// ===== Hylden — main app =====
import { CONFIG, hasClientId } from './config.js';
import { login, handleRedirect, isLoggedIn, logout } from './auth.js';
import { fetchSavedAlbums, fetchProfile } from './spotify.js';
import { demoAlbums } from './demo.js';

const $ = (s) => document.querySelector(s);
const el = {
  account:$('#account'), toolbar:$('#toolbar'), welcome:$('#welcome'),
  backdrop:$('#backdrop'),
  flip:$('#flip'), coverflow:$('#coverflow'), cfTrack:$('#cf-track'),
  flipTitle:$('#flip-title'), flipArtist:$('#flip-artist'), flipYear:$('#flip-year'),
  flipPlay:$('#flip-play'),
  shelfArea:$('#shelf-area'), shelf:$('#shelf'), loading:$('#loading'),
  loadingText:$('#loading-text'), count:$('#count'),
  rediscover:$('#rediscover'), rediscoverRow:$('#rediscover-row'),
  search:$('#search'), sorts:$('#sorts'),
  viewtoggle:$('#viewtoggle'), gridControls:$('#grid-controls'),
  spotlight:$('#spotlight'),
};

let ALBUMS = [];        // full collection
let view = [];          // filtered/sorted view (grid)
let sort = 'added';
let query = '';
let demo = false;
let mode = 'flip';      // 'flip' (Cover Flow rack) | 'grid' (whole shelf)
let queue = [];         // shuffled album order for flip view
let focused = 0;        // index of the front album in the rack
let cfItems = [];       // [{el, img}] one per album in queue

// ---------- boot ----------
async function boot(){
  registerSW();
  try {
    if (location.search.includes('code=') || location.search.includes('error=')){
      await handleRedirect();
    }
  } catch(e){ toast('Kunne ikke logge ind — prøv igen.'); }

  wireEvents();
  if (location.search.includes('demo')){      // shareable demo link
    startDemo();
  } else if (isLoggedIn()){
    showApp(); loadFromSpotify();
  } else {
    showWelcome();
  }
}

// ---------- screens ----------
function showWelcome(){
  el.welcome.hidden = false; el.toolbar.hidden = true;
  el.shelfArea.hidden = true; el.flip.hidden = true; el.loading.hidden = true;
  el.account.innerHTML = '';
}
function showApp(){
  el.welcome.hidden = true;
}
function showLoading(text){
  el.loading.hidden = false; el.shelfArea.hidden = true; el.flip.hidden = true;
  el.toolbar.hidden = true;
  if (text) el.loadingText.textContent = text;
}

// ---------- data ----------
async function loadFromSpotify(){
  demo = false;
  showLoading('Henter din hylde…');
  const profile = await fetchProfile();
  renderAccount(profile);
  try {
    const albums = await fetchSavedAlbums((n,total)=>{
      el.loadingText.textContent = total ? `Henter din hylde… ${n} af ${total}` : `Henter… ${n}`;
    });
    ALBUMS = albums;
    el.loading.hidden = true;
    if (!albums.length){ renderEmpty(); return; }
    primeColors(ALBUMS);
    enterApp();
  } catch(e){
    if (String(e.message).includes('not_authed')){ logout(); showWelcome(); }
    else { el.loadingText.textContent = 'Noget gik galt. Træk ned for at prøve igen.'; }
  }
}

function startDemo(){
  demo = true;
  ALBUMS = demoAlbums();
  showApp();
  el.account.innerHTML = `<button id="exit-demo">Forbind</button>`;
  $('#exit-demo').onclick = () => { if (hasClientId()) login(); else showWelcome(); };
  enterApp();
}

// Show the app with both views ready; display whichever mode is active.
function enterApp(){
  el.loading.hidden = true; el.toolbar.hidden = false;
  apply();          // populate grid + rediscover
  buildQueue();     // shuffle for flip view
  setMode(mode);
}

// ---------- flip view (Cover Flow rack, shuffled) ----------
function setMode(m){
  mode = m;
  el.viewtoggle.querySelectorAll('.vt').forEach(b=>b.classList.toggle('is-active', b.dataset.mode===m));
  const flipMode = m==='flip';
  el.flip.hidden = !flipMode;
  el.shelfArea.hidden = flipMode;
  el.gridControls.hidden = flipMode;
  document.body.classList.toggle('grid-mode', !flipMode);
  if (flipMode){
    if (!queue.length) buildQueue();
    if (cfItems.length !== queue.length) buildCoverflow();
    layoutCoverflow(); updateFlipMeta();
  }
}

function buildQueue(){ queue = sample(ALBUMS, ALBUMS.length); focused = 0; cfItems = []; }

// itemsize scales with the screen; recomputed on resize
function cfSize(){ return Math.min(Math.round(window.innerWidth*0.92), 440); }

function buildCoverflow(){
  el.cfTrack.innerHTML = '';
  cfItems = queue.map((a, i)=>{
    const node = document.createElement('div');
    node.className = 'cf-item';
    const img = document.createElement('img');
    img.alt = a.name; img.dataset.src = a.coverSmall || a.cover;
    node.appendChild(img);
    node.addEventListener('click', ()=>{
      if (i === focused){ if (!demo) window.open(queue[i].url, '_blank', 'noopener'); }
      else setFocus(i);
    });
    el.cfTrack.appendChild(node);
    return { el:node, img };
  });
  setCfSizes();
}

function setCfSizes(){
  const s = cfSize();
  // centering is handled by translate(-50%,-50%) in the transform — no margins here
  cfItems.forEach(({el})=>{ el.style.width = s+'px'; el.style.height = s+'px'; });
}

const CF_VISIBLE = 2;   // covers shown on each side of the front (they only peek)
function layoutCoverflow(){
  const s = cfSize();
  const N = cfItems.length;
  cfItems.forEach(({el:node, img}, i)=>{
    let d = i - focused;
    if (N > 1){ if (d > N/2) d -= N; else if (d < -N/2) d += N; }  // shortest way round the ring
    const ad = Math.abs(d), sign = Math.sign(d);

    // Off-screen covers: don't render them at all (big perf win on large libraries)
    if (ad > CF_VISIBLE){
      node.style.display = 'none';
      node.classList.remove('is-front');
      if (img.src) img.removeAttribute('src');
      return;
    }
    node.style.display = '';
    if (!img.src) img.src = img.dataset.src;

    let x, ry, tz, scale, opacity, z;
    if (d === 0){ x=0; ry=0; tz=60; scale=1; opacity=1; z=1000; }
    else {
      x = sign * (s*0.84 + (ad-1)*s*0.56);   // pushed well out → sides only peek
      ry = -sign * 52;
      tz = -110 - (ad-1)*80;
      scale = 0.82;
      opacity = ad===1 ? 0.9 : 0.45;
      z = 1000 - ad;
    }
    node.classList.toggle('is-front', d===0);
    node.style.transform =
      `translate(-50%,-50%) translateX(${x}px) translateZ(${tz}px) rotateY(${ry}deg) scale(${scale})`;
    node.style.opacity = opacity;
    node.style.zIndex = z;
  });
}

function updateFlipMeta(){
  const a = queue[focused]; if (!a) return;
  el.flipTitle.textContent = a.name;
  el.flipArtist.textContent = a.artist;
  el.flipYear.textContent = a.year ? `Udgivet ${a.year}` : '';
  el.flipPlay.href = a.url;
  el.flipPlay.style.display = demo ? 'none' : '';
  el.backdrop.style.backgroundImage = `url("${a.coverSmall || a.cover}")`;  // small img — it's blurred anyway
}

function setFocus(i){
  const N = queue.length; if (!N) return;
  focused = ((i % N) + N) % N;           // wrap around the ring
  layoutCoverflow(); updateFlipMeta();
}
function flipNext(){ setFocus(focused+1); }
function flipPrev(){ setFocus(focused-1); }

function reshuffle(){
  buildQueue(); buildCoverflow(); layoutCoverflow(); updateFlipMeta();
  if (queue.length>1) toast('Blandet igen');
}

// ---------- account ----------
function renderAccount(profile){
  const name = profile?.display_name || 'Spotify';
  const img = profile?.images?.[0]?.url;
  el.account.innerHTML = `
    <div class="who">
      ${img?`<img src="${img}" alt="">`:''}
      <button id="logout">Log ud</button>
    </div>`;
  $('#logout').onclick = () => { logout(); ALBUMS=[]; showWelcome(); };
}

// ---------- sorting / filtering ----------
function apply(){
  let list = ALBUMS.slice();
  if (query){
    const q = query.toLowerCase();
    list = list.filter(a => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q));
  }
  const collator = new Intl.Collator('da',{sensitivity:'base'});
  switch(sort){
    case 'added':  list.sort((a,b)=> b.added - a.added); break;
    case 'artist': list.sort((a,b)=> collator.compare(a.artist,b.artist) || collator.compare(a.name,b.name)); break;
    case 'year':   list.sort((a,b)=> (b.year||'').localeCompare(a.year||'')); break;
    case 'color':  list.sort((a,b)=> (a.hue ?? 999) - (b.hue ?? 999)); break;
  }
  view = list;
  renderShelf();
  renderRediscover();
}

function renderShelf(){
  if (!view.length){
    el.shelf.innerHTML = `<p class="empty">Ingen albums matcher “${query}”.</p>`;
    el.count.textContent = '';
    return;
  }
  el.shelf.innerHTML = view.map(albumCard).join('');
  el.count.textContent = `${ALBUMS.length} ${ALBUMS.length===1?'album':'albums'} på hylden${demo?' · demo':''}`;
  el.shelf.querySelectorAll('.album').forEach(node=>{
    node.onclick = () => openSpotlight(view.find(a=>a.id===node.dataset.id));
  });
}

function albumCard(a){
  const img = a.coverSmall || a.cover;
  return `<div class="album" data-id="${a.id}">
    <div class="album-cover"><img loading="lazy" src="${img}" alt="${escapeAttr(a.name)}"></div>
    <div class="album-ledge"></div>
    <div class="album-meta">
      <p class="album-title">${escapeHtml(a.name)}</p>
      <p class="album-artist">${escapeHtml(a.artist)}</p>
    </div>
  </div>`;
}

function renderRediscover(){
  if (ALBUMS.length < 8){ el.rediscover.hidden = true; return; }
  const picks = sample(ALBUMS, 6);
  el.rediscover.hidden = false;
  el.rediscoverRow.innerHTML = picks.map(albumCard).join('');
  el.rediscoverRow.querySelectorAll('.album').forEach(node=>{
    node.onclick = () => openSpotlight(ALBUMS.find(a=>a.id===node.dataset.id));
  });
}

function renderEmpty(){
  el.loading.hidden = true; el.flip.hidden = true; el.toolbar.hidden = true;
  el.shelfArea.hidden = false;
  el.rediscover.hidden = true; el.count.textContent='';
  el.shelf.innerHTML = `<p class="empty">
    Din hylde er tom endnu.<br>
    Gem (hjerte ♥) nogle albums i Spotify, så dukker de op her.
  </p>`;
}

// ---------- spotlight ----------
function openSpotlight(a, withAgain=false){
  if (!a) return;
  $('#sp-cover').src = a.cover || a.coverSmall;
  $('#sp-title').textContent = a.name;
  $('#sp-artist').textContent = a.artist;
  $('#sp-meta').textContent = a.year ? `Udgivet ${a.year}` : '';
  const play = $('#sp-play');
  play.href = a.url; play.style.display = demo ? 'none' : '';
  const again = $('#sp-again');
  again.hidden = !withAgain;
  again.onclick = () => openSpotlight(sample(ALBUMS,1)[0], true);
  el.spotlight.hidden = false;
}
function closeSpotlight(){ el.spotlight.hidden = true; }

// ---------- colour extraction (for real covers) ----------
function primeColors(albums){
  // demo albums already carry a hue; real ones get hue from the image.
  albums.filter(a => a.hue == null && a.coverSmall).forEach(a=>{
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { a.hue = averageHue(img); if (sort==='color') apply(); };
    img.onerror = () => {};            // CORS-blocked → just skip; colour sort drops it last
    img.src = a.coverSmall;
  });
}
const _cv = document.createElement('canvas'); _cv.width = _cv.height = 16;
const _ctx = _cv.getContext('2d', { willReadFrequently:true });
function averageHue(img){
  try{
    _ctx.drawImage(img,0,0,16,16);
    const d = _ctx.getImageData(0,0,16,16).data;
    let r=0,g=0,b=0,n=0;
    for (let i=0;i<d.length;i+=4){ r+=d[i]; g+=d[i+1]; b+=d[i+2]; n++; }
    return rgbToHue(r/n,g/n,b/n);
  }catch{ return null; }      // tainted canvas
}
function rgbToHue(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b), d=max-min;
  if (!d) return 0;
  let h;
  if (max===r) h=((g-b)/d)%6;
  else if (max===g) h=(b-r)/d+2;
  else h=(r-g)/d+4;
  return Math.round(((h*60)+360)%360);
}

// ---------- events ----------
function wireEvents(){
  $('#connect')?.addEventListener('click', () => {
    if (hasClientId()) login();
    else toast('Spotify-app mangler endnu — Mathias sætter den op.');
  });
  $('#try-demo')?.addEventListener('click', startDemo);

  // view toggle: Bladr / Hele hylden
  el.viewtoggle.addEventListener('click', (e)=>{
    const b = e.target.closest('.vt'); if (!b) return;
    setMode(b.dataset.mode);
  });
  // flip navigation
  $('#flip-next').addEventListener('click', flipNext);
  $('#flip-prev').addEventListener('click', flipPrev);
  $('#flip-shuffle').addEventListener('click', reshuffle);
  window.addEventListener('resize', ()=>{
    if (mode==='flip' && !el.flip.hidden){ setCfSizes(); layoutCoverflow(); }
  });
  // swipe left/right through the rack
  let sx=0, sy=0;
  el.coverflow.addEventListener('touchstart', (e)=>{ const t=e.changedTouches[0]; sx=t.clientX; sy=t.clientY; }, {passive:true});
  el.coverflow.addEventListener('touchend', (e)=>{
    const t=e.changedTouches[0], dx=t.clientX-sx, dy=t.clientY-sy;
    if (Math.abs(dx)>40 && Math.abs(dx)>Math.abs(dy)) (dx<0 ? flipNext() : flipPrev());
  }, {passive:true});

  el.sorts.addEventListener('click', (e)=>{
    const b = e.target.closest('.chip'); if (!b) return;
    el.sorts.querySelectorAll('.chip').forEach(c=>c.classList.remove('is-active'));
    b.classList.add('is-active'); sort = b.dataset.sort; apply();
  });
  let t; el.search.addEventListener('input', ()=>{
    clearTimeout(t); t=setTimeout(()=>{ query = el.search.value.trim(); apply(); }, 120);
  });
  el.spotlight.addEventListener('click', (e)=>{ if (e.target.dataset.close!==undefined) closeSpotlight(); });
  document.addEventListener('keydown', (e)=>{
    if (e.key==='Escape'){ closeSpotlight(); return; }
    if (mode==='flip' && !el.flip.hidden && el.spotlight.hidden){
      if (e.key==='ArrowRight') flipNext();
      else if (e.key==='ArrowLeft') flipPrev();
    }
  });
}

// ---------- helpers ----------
function sample(arr, n){
  const a = arr.slice();
  for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a.slice(0,n);
}
const escapeHtml = s => String(s).replace(/[&<>]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const escapeAttr = s => String(s).replace(/"/g,'&quot;').replace(/</g,'&lt;');
let toastT;
function toast(msg){
  document.querySelector('.toast')?.remove();
  const n = document.createElement('div'); n.className='toast'; n.textContent=msg;
  document.body.appendChild(n);
  clearTimeout(toastT); toastT=setTimeout(()=>n.remove(), 3200);
}
function registerSW(){
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js?v=8').catch(()=>{});
}

// Start only after the whole module has finished loading, so every const
// helper (escapeAttr, sample, …) is initialized before boot uses them.
boot();
