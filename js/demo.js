// ===== Demo collection =====
// Self-contained album covers (drawn as SVG, no external images) so you can see
// the shelf before connecting Spotify. Replaced by your real library on login.

const RECORDS = [
  ['Midnight Orchard','Vela Wren',      198,'circles'],
  ['Paper Lanterns','The Hollow Pines', 28,'rings'],
  ['Saltwater Hymns','Marisol',         8,'wave'],
  ['Tundra','Aaro Kallio',              210,'mountain'],
  ['Velvet Static','Nightcab',          280,'stripes'],
  ['Goldenrod','June & the Tides',      45,'sun'],
  ['Concrete Garden','Ester Moe',       140,'grid'],
  ['Aubergine Dreams','Lo Fi Coven',    300,'circles'],
  ['Riverbed','Cormorant',              160,'wave'],
  ['Neon Pastoral','Hôtel Mireille',    330,'rings'],
  ['Ash & Amber','Bram Sólo',           24,'mountain'],
  ['Clementine','Soft Focus',           18,'sun'],
  ['Deep Field','Astra Quartet',        225,'grid'],
  ['Moss','Eline Vsk',                  110,'stripes'],
  ['Cobalt Hours','The Vantines',       215,'circles'],
  ['Honeycomb','Pim & Bo',              42,'rings'],
  ['Crimson Letters','Violet',          355,'wave'],
  ['Slate','North Carriage',            205,'mountain'],
];

function cover(title, artist, hue, motif){
  const c1 = `hsl(${hue} 62% 46%)`, c2 = `hsl(${(hue+34)%360} 58% 28%)`;
  const acc = `hsl(${(hue+180)%360} 70% 72%)`;
  const motifs = {
    circles:`<circle cx="150" cy="160" r="92" fill="none" stroke="${acc}" stroke-width="6" opacity=".55"/><circle cx="150" cy="160" r="58" fill="${acc}" opacity=".25"/>`,
    rings:`<g fill="none" stroke="${acc}" stroke-width="5" opacity=".5">${[40,72,104,136].map(r=>`<circle cx="150" cy="150" r="${r}"/>`).join('')}</g>`,
    wave:`<path d="M0 170 Q75 120 150 170 T300 170 V300 H0Z" fill="${acc}" opacity=".3"/><path d="M0 200 Q75 150 150 200 T300 200 V300 H0Z" fill="${acc}" opacity=".22"/>`,
    mountain:`<path d="M0 300 L95 150 L160 220 L230 110 L300 300Z" fill="${acc}" opacity=".4"/>`,
    stripes:`<g fill="${acc}" opacity=".22">${[0,1,2,3,4].map(i=>`<rect x="${i*64}" y="0" width="30" height="300"/>`).join('')}</g>`,
    sun:`<circle cx="150" cy="150" r="60" fill="${acc}" opacity=".7"/><g stroke="${acc}" stroke-width="5" opacity=".5">${Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return `<line x1="${150+78*Math.cos(a)}" y1="${150+78*Math.sin(a)}" x2="${150+102*Math.cos(a)}" y2="${150+102*Math.sin(a)}"/>`;}).join('')}</g>`,
    grid:`<g fill="none" stroke="${acc}" stroke-width="3" opacity=".4">${[60,120,180,240].flatMap(p=>[`<line x1="${p}" y1="20" x2="${p}" y2="280"/>`,`<line x1="20" y1="${p}" x2="280" y2="${p}"/>`]).join('')}</g>`,
  };
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
    <rect width="300" height="300" fill="url(#g)"/>
    ${motifs[motif]||''}
    <text x="20" y="252" font-family="Georgia,serif" font-size="22" font-weight="700" fill="#fff" opacity=".95">${esc(title)}</text>
    <text x="20" y="276" font-family="Georgia,serif" font-size="14" fill="#fff" opacity=".75">${esc(artist)}</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function demoAlbums(){
  return RECORDS.map((r,i) => {
    const [name, artist, hue, motif] = r;
    const img = cover(name, artist, hue, motif);
    return {
      id:'demo'+i, name, artist, cover:img, coverSmall:img,
      year: String(1998 + (i*7)%25),
      url:'https://open.spotify.com/',
      added: i,         // already in "newest last" order; we reverse on display
      hue,              // pre-set so colour sort works offline
    };
  });
}
