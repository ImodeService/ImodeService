/* I-MODE Plus Service & Maintenance · Version 1.0
   tools/build-web.js — builds web/ (the files the server serves) from the development repository.

       node tools/build-web.js            build; placeholders in production.config.json are a warning
       node tools/build-web.js --strict   build for real upload; a placeholder is an error
       node tools/build-web.js --strict --audience=customer
                                          the customer domain's folder (web-customer/), the one
                                          search engines may index; the default is the staff one

   web/ is GENERATED. Do not edit it: change the source in the development repository and build
   again, or the next build throws the change away. One source is the whole point — two copies
   of 120 patch scripts would disagree within a week.

   What it does, in order:
     1. empties web/ and copies only what the site loads (the allow-list below). Everything the
        server must NOT carry stays behind by construction: CLAUDE.md, AGENTS.md, docs/,
        supabase/, Data/ (real customer data), logs, tmp/, Andriod_app/, test profiles.
     2. drops js/02-demo-data.js and its <script> tag — demo customers must never reach the
        real database.
     3. removes every block the source marks as development-only:
            JS / CSS   a block comment reading @dev-only … a block comment reading @end-dev-only
            HTML       an HTML comment reading @dev-only … one reading @end-dev-only
        (written exactly as the two regular expressions in strip() below)
        (the test database's address and key, the UAT accounts and their password hashes).
     4. writes js/00-env.js from production.config.json and loads it before anything else.
     5. serves supabase-js and qrcodejs from web/vendor/ instead of a CDN, pinned.
     6. copies only the images something actually references.
     7. VERIFIES the result and exits non-zero if anything is wrong: a referenced file that is
        missing, a script that does not parse, the test database address, a password hash, a
        leftover dev-only marker, or a file that should never be served.
*/
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = __dirname;                         // tools/production: configs + vendor
const REPO = path.resolve(__dirname, '../..');     // the repository root (the source)
// --config=<file> and --out=<dir> exist for test builds only; a real upload uses the defaults.
const arg = k => (process.argv.find(a => a.startsWith('--' + k + '=')) || '').split('=').slice(1).join('=');
/* --audience=customer builds the folder the CUSTOMER hostname serves (default web-customer/):
   the same app, but its front page is open to search engines (title, description, canonical,
   robots.txt that allows it, sitemap.xml). The default audience, staff, is hidden from them
   (noindex + robots Disallow) — the back office must never show up in a Google result. */
const AUDIENCE = arg('audience') || 'staff';
if (!/^(staff|customer)$/.test(AUDIENCE)) { console.error('--audience must be staff or customer'); process.exit(1); }
const OUT = path.resolve(arg('out') || path.join(REPO, 'production', AUDIENCE === 'customer' ? 'web-customer' : 'web'));
const CFG = JSON.parse(fs.readFileSync(path.resolve(arg('config') || path.join(ROOT, 'production.config.json')), 'utf8'));
const SRC = path.resolve(CFG.source || REPO);
const STRICT = process.argv.includes('--strict');
const problems = [], warnings = [];

const rel = p => path.relative(SRC, p).split(path.sep).join('/');
const read = p => fs.readFileSync(p, 'utf8');
const written = new Set();   // every file this run produced; anything else in OUT is stale
function copy(from, to, transform) {
  written.add(path.resolve(to));
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (transform) fs.writeFileSync(to, transform(read(from), rel(from)));
  else fs.copyFileSync(from, to);
}
function list(dir, re) {
  return fs.readdirSync(path.join(SRC, dir)).filter(f => re.test(f)).sort().map(f => dir + '/' + f);
}

// ---------- 1. clean ----------
/* 2026-09-28: OUT is NOT removed first. On Windows a folder that Live Server (or any open
   window) is serving cannot be deleted, and the old rmSync left webstaging half-deleted twice.
   Files are written over in place and whatever this run did not produce is removed at the end
   (step 6b), so the result is the same clean folder. */
fs.mkdirSync(OUT, { recursive: true });

// ---------- 3. dev-only stripping ----------
function strip(text, file) {
  const before = text;
  text = text.replace(/\/\*@dev-only\*\/[\s\S]*?\/\*@end-dev-only\*\//g, '');
  text = text.replace(/<!--@dev-only-->[\s\S]*?<!--@end-dev-only-->/g, '');
  if (/@dev-only|@end-dev-only/.test(text)) problems.push(file + ': an unmatched @dev-only marker');
  if (before !== text) stripped.push(file);
  return text;
}
const stripped = [];

// ---------- 2 + 4 + 5. the two HTML documents ----------
const ENV_TAG = '<script src="./js/00-env.js"></script>';
function html(text, file) {
  text = strip(text, file);
  text = text.replace(/<script[^>]+src="\.\/js\/02-demo-data\.js"[^>]*><\/script>\s*/g, '');
  text = text.replace(/https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2[^"']*/g, './vendor/supabase.min.js');
  text = text.replace(/https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/qrcodejs\/1\.0\.0\/qrcode\.min\.js/g, './vendor/qrcode.min.js');
  if (!/<meta charset[^>]*>/i.test(text)) problems.push(file + ': no <meta charset> to put 00-env.js after');
  text = text.replace(/(<meta charset[^>]*>)/i, '$1\n' + ENV_TAG);
  return searchHead(text, file);
}

// ---------- 2b. what search engines see ----------
const placeholder = v => !v || /REPLACE_ME/.test(String(v));
const SITE = AUDIENCE === 'customer' && !placeholder(CFG.customerHost) ? 'https://' + CFG.customerHost + '/' : '';
if (AUDIENCE === 'customer' && !SITE) problems.push('--audience=customer needs customerHost in the config (the customer domain)');
if (AUDIENCE === 'customer' && CFG.customerByUrl) problems.push('--audience=customer needs its own customer domain; customerByUrl serves both audiences from one');
const htmlEsc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function searchHead(text, file) {
  if (!(AUDIENCE === 'customer' && file === 'index.html')) {
    // the staff app, and service-case-detail.html everywhere: never in a search result
    return text.replace(/(<meta charset[^>]*>)/i, '$1\n  <meta name="robots" content="noindex, nofollow">');
  }
  const title = 'แจ้งซ่อม เช็คประกัน สแกน QR เครื่อง | I-MODE Plus Service';
  const desc = 'บริการหลังการขาย I-MODE Plus: สแกน QR บนเครื่องหรือกรอก Serial No. เพื่อแจ้งปัญหา ขอใบเสนอราคา ตรวจสอบการรับประกัน ดูประวัติซ่อมและคู่มือเครื่อง โทร 02-727-0130';
  const logo = SITE + 'assets/imode-document-logo.webp';
  const org = {
    '@context': 'https://schema.org', '@type': 'Organization',
    name: 'I-MODE Plus Co., Ltd.', alternateName: 'บริษัท ไอโมด พลัส จำกัด',
    url: SITE, logo: logo,
    address: { '@type': 'PostalAddress', streetAddress: '241/46 Kanchanaphisek Rd., Dokmai', addressLocality: 'Prawes', addressRegion: 'Bangkok', postalCode: '10250', addressCountry: 'TH' },
    contactPoint: { '@type': 'ContactPoint', telephone: '+66-2-727-0130', contactType: 'customer service', availableLanguage: ['Thai', 'English'] },
  };
  const head = [
    '<title>' + htmlEsc(title) + '</title>',
    '  <meta name="description" content="' + htmlEsc(desc) + '">',
    '  <link rel="canonical" href="' + SITE + '">',
    CFG.googleSiteVerification ? '  <meta name="google-site-verification" content="' + htmlEsc(CFG.googleSiteVerification) + '">' : '',
    '  <meta property="og:type" content="website">',
    '  <meta property="og:site_name" content="I-MODE Plus Service">',
    '  <meta property="og:title" content="' + htmlEsc(title) + '">',
    '  <meta property="og:description" content="' + htmlEsc(desc) + '">',
    '  <meta property="og:url" content="' + SITE + '">',
    '  <meta property="og:image" content="' + logo + '">',
    '  <meta property="og:locale" content="th_TH">',
    '  <script type="application/ld+json">' + JSON.stringify(org) + '</script>',
  ].filter(Boolean).join('\n');
  // Readable without JavaScript; the app draws the real scan / serial page over it as usual.
  const noscript = '<noscript><div style="max-width:640px;margin:24px auto;padding:0 16px;font-family:sans-serif;color:#0b2f8f">'
    + '<h1>I-MODE Plus Service · บริการหลังการขาย</h1>'
    + '<p>สแกน QR บนเครื่องจักร หรือกรอก Serial No. เพื่อแจ้งปัญหา ขอใบเสนอราคา ตรวจสอบการรับประกัน ดูประวัติงานซ่อม และดาวน์โหลดคู่มือเครื่อง</p>'
    + '<p>Scan the QR code on your machine or enter its serial number to report a problem, request a quotation, check the warranty, see the service history and open the machine documents.</p>'
    + '<p>บริษัท ไอโมด พลัส จำกัด · 241/46 ถนนกาญจนาภิเษก แขวงดอกไม้ เขตประเวศ กรุงเทพฯ 10250 · โทร <a href="tel:027270130">02-727-0130</a></p>'
    + '<p>เปิด JavaScript ในเบราว์เซอร์เพื่อใช้งานหน้านี้</p></div></noscript>';
  if (!/<title>[^<]*<\/title>/.test(text)) problems.push(file + ': no <title> to replace');
  return text.replace(/<title>[^<]*<\/title>/, head).replace(/(<body[^>]*>)/i, '$1\n' + noscript);
}
const DOCS = ['index.html', 'service-case-detail.html'];
DOCS.forEach(f => copy(path.join(SRC, f), path.join(OUT, f), html));

// ---------- 1. the allow-list ----------
const files = [
  'sw.js',
  'pages/pages.js', 'pages/customer-home.html',
  ...list('css', /^\d+-.*\.css$/),
  ...list('js', /^\d+-.*\.js$/).filter(f => f !== 'js/02-demo-data.js'),
  ...list('auth', /\.js$/),
  ...list('vendor', /\.js$/),
];
files.forEach(f => copy(path.join(SRC, f), path.join(OUT, f), /\.(js|css|html)$/.test(f) ? strip : null));
['supabase.min.js', 'qrcode.min.js'].forEach(f =>
  copy(path.join(ROOT, 'vendor', f), path.join(OUT, 'vendor', f)));

// ---------- 4. js/00-env.js ----------
['customerHost', 'staffHost', 'supabaseUrl', 'supabaseAnonKey'].forEach(k => {
  if (k === 'customerHost' && CFG.customerByUrl) return;   // one host: the link decides (CLAUDE.md part 39)
  if (placeholder(CFG[k])) (STRICT ? problems : warnings).push('production.config.json: ' + k + ' is not set yet');
});
const env = {
  production: true,
  version: 'Version 1.0',
  builtAt: new Date().toISOString(),
  customerHost: placeholder(CFG.customerHost) ? '' : CFG.customerHost,
  customerByUrl: !!CFG.customerByUrl,
  staffHost: placeholder(CFG.staffHost) ? '' : CFG.staffHost,
  cloud: { url: placeholder(CFG.supabaseUrl) ? '' : CFG.supabaseUrl, key: placeholder(CFG.supabaseAnonKey) ? '' : CFG.supabaseAnonKey },
  line: { addFriendUrl: CFG.lineAddFriendUrl || '', officialAccountId: CFG.lineOfficialAccountId || '' },
};
written.add(path.resolve(OUT, 'js/00-env.js'));
fs.writeFileSync(path.join(OUT, 'js/00-env.js'),
  '/* GENERATED by tools/build-web.js — do not edit; change production.config.json and build again.\n' +
  '   The anon key below is public by design. What protects the data is Row Level Security. */\n' +
  'window.IMODE_ENV=Object.freeze(' + JSON.stringify(env, null, 1) + ');\n');

// ---------- 6. images: only what something references ----------
const texts = [...DOCS, ...files].map(f => { try { return read(path.join(OUT, f)); } catch (e) { return ''; } }).join('\n');
const assetsCopied = [];
(function walk(dir) {
  for (const e of fs.readdirSync(path.join(SRC, dir), { withFileTypes: true })) {
    const p = dir + '/' + e.name;
    if (e.isDirectory()) { walk(p); continue; }
    const inMachines = p.startsWith('assets/machines/');
    if (inMachines || texts.includes(e.name) || texts.includes(encodeURI(e.name))) {
      copy(path.join(SRC, p), path.join(OUT, p)); assetsCopied.push(p);
    }
  }
})('assets');

// ---------- extras ----------
written.add(path.resolve(OUT, 'robots.txt'));
if (SITE) {
  /* The front page only. Google must still fetch js/ css/ assets/ to render it, so those stay
     open; every address with a query (?machineToken= / ?serial= from a QR) and the staff-only
     case page stay out. */
  fs.writeFileSync(path.join(OUT, 'robots.txt'),
    'User-agent: *\nDisallow: /*?\nDisallow: /service-case-detail.html\nAllow: /\n\nSitemap: ' + SITE + 'sitemap.xml\n');
  written.add(path.resolve(OUT, 'sitemap.xml'));
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
    '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    '  <url><loc>' + SITE + '</loc><lastmod>' + new Date().toISOString().slice(0, 10) + '</lastmod></url>\n</urlset>\n');
} else {
  fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
}

// ---------- 6b. remove what a previous build left and this one did not produce ----------
(function prune(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      prune(p);
      try { if (!fs.readdirSync(p).length) fs.rmdirSync(p); } catch (x) {}
    } else if (!written.has(path.resolve(p))) {
      try { fs.rmSync(p, { force: true }); } catch (x) { problems.push('could not remove stale file ' + p + ' — close whatever has it open'); }
    }
  }
})(OUT);

// ---------- 7. verify ----------
const all = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else all.push(p);
  }
})(OUT);
const outRel = p => path.relative(OUT, p).split(path.sep).join('/');

// a) every local file an HTML document references exists
for (const d of DOCS) {
  const t = read(path.join(OUT, d));
  for (const m of t.matchAll(/\s(?:src|href)="(\.\/[^"?#]+)"/g)) {
    if (!fs.existsSync(path.join(OUT, m[1]))) problems.push(d + ' references a missing file: ' + m[1]);
  }
}
// b) the sw.js precache extras exist
for (const m of read(path.join(OUT, 'sw.js')).matchAll(/'\.\/([^'?#]+\.[a-z0-9]+)'/gi)) {
  if (!fs.existsSync(path.join(OUT, m[1]))) problems.push('sw.js lists a missing file: ./' + m[1]);
}
// c) every script parses — as a CLASSIC script, which is how the browser loads them. node --check
//    follows the nearest package.json and may parse them as ES modules, where the duplicate
//    top-level function declarations this patch-over-patch codebase relies on are an error.
for (const p of all.filter(p => p.endsWith('.js'))) {
  try { new vm.Script(read(p), { filename: outRel(p) }); }
  catch (e) { problems.push(outRel(p) + ' does not parse: ' + e.message); }
}
// d) nothing that must never be served
const FORBIDDEN = [
  [/ywlrlfudlxsallanoroq/, 'the TEST database address'],
  [/sb_publishable_[A-Za-z0-9_-]{10,}/, 'the TEST database key'],
  [/service_role/i, 'a service_role key reference'],
  [/(^|[^0-9a-f])[0-9a-f]{64}([^0-9a-f]|$)/, 'a 64-hex string (a password hash?)'],
  [/@dev-only/, 'a dev-only marker'],
];
for (const p of all.filter(p => /\.(js|html|css|txt|json)$/.test(p) && !/vendor[\\/]/.test(p))) {
  const t = read(p);
  for (const [re, what] of FORBIDDEN) if (re.test(t)) problems.push(outRel(p) + ' contains ' + what);
}
for (const p of all) {
  if (/\.(md|sql|xlsx|csv|log|env|pem|key)$/i.test(p) || /(^|[\\/])(Data|docs|supabase|tmp)[\\/]/.test(outRel(p)))
    problems.push('must not be served: ' + outRel(p));
}

// ---------- report ----------
const size = all.reduce((n, p) => n + fs.statSync(p).size, 0);
console.log('web/ built from ' + SRC);
console.log('  files     ' + all.length + '  (' + (size / 1048576).toFixed(1) + ' MB)');
console.log('  images    ' + assetsCopied.length);
console.log('  dev-only  stripped from: ' + (stripped.length ? stripped.join(', ') : 'nothing yet'));
warnings.forEach(w => console.log('  WARNING   ' + w));
if (problems.length) {
  console.log('\nBUILD FAILED — ' + problems.length + ' problem(s):');
  problems.forEach(p => console.log('  - ' + p));
  process.exit(1);
}
console.log(STRICT ? '\nOK — ready to upload.' : '\nOK' + (warnings.length ? ' (not ready to upload until the warnings are fixed; build with --strict to check)' : ''));
