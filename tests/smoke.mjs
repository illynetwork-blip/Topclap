// Tests de fumée : charge l'appli dans Chromium, exerce les fonctions principales, échoue à la moindre erreur JS.
// Lancer :  npm i --no-save playwright && npx playwright install chromium && node tests/smoke.mjs
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tests', 'out');
mkdirSync(out, { recursive: true });
const media = [];
try {
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=640x360:rate=30', '-f', 'lavfi', '-i', 'sine=frequency=440', '-t', '3', '-c:v', 'libvpx', '-c:a', 'libopus', path.join(out, 'v.webm')]);
  execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'lavfi', '-i', 'testsrc=size=800x600', '-frames:v', '1', path.join(out, 'img.png')]);
  media.push(path.join(out, 'v.webm'), path.join(out, 'img.png'));
} catch { console.log('ffmpeg absent : test d\'import ignoré'); }

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
const errors = [];
let failed = 0;
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => errors.push('pageerror: ' + e.message));
page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errors.push('console: ' + m.text()); });
await page.goto(pathToFileURL(path.join(root, 'index.html')).href);
await page.waitForTimeout(1500);

async function check(name, fn) {
  try { const r = await fn(); console.log('✓', name, r ?? ''); }
  catch (e) { failed++; console.log('✗', name, e.message.split('\n')[0]); }
}
const ev = (fn, arg) => page.evaluate(fn, arg);
const assert = (c, m) => { if (!c) throw new Error(m); };

await check('projet exemple chargé', async () => { const n = await ev(() => P.clips.length); assert(n >= 8, 'clips: ' + n); return n + ' clips'; });
await check('rendu WebGL (Jour → Nuit)', async () => { await ev(() => setTime(14)); await page.waitForTimeout(300); const gl = await ev(() => !!GLX); assert(gl, 'WebGL indisponible'); });
await check('tous les onglets', async () => { for (const t of await ev(() => TABS.map(t => t[0]).filter(k => k !== 'insp'))) { await ev(k => setTab(k), t); await page.waitForTimeout(80); } });
await check('images clés', async () => { const r = await ev(() => { const c = P.clips.find(c => c.kind === 'scene'); select(c.id); setKf(c, 'scale', 0, 1); setKf(c, 'scale', 2, 1.5); return kv(c, 'scale', 1); }); assert(r > 1 && r < 1.5, 'kv=' + r); return r.toFixed(2); });
await check('couper / annuler', async () => { const a = await ev(() => P.clips.length); await ev(() => { setTime(2); splitAt(); }); const b = await ev(() => P.clips.length); await ev(() => undo()); const c = await ev(() => P.clips.length); assert(b === a + 1 && c === a, `${a}/${b}/${c}`); });
await check('LUT + roues + masque + chroma', async () => { await ev(() => { const c = P.clips.find(c => c.kind === 'scene'); select(c.id); c.grade.lut = 'lut-teal-orange'; c.grade.lift = [.05, 0, -.05]; c.mask.type = 'ellipse'; c.key.on = true; req(); }); await page.waitForTimeout(200); });
await check('sous-titres depuis un texte', async () => { const n = await ev(() => { addCaptionClip(wordsFromText('Bienvenue dans cette villa avec piscine', 1, 4), 'Test', 'karaoke'); return P.clips.filter(c => c.kind === 'caption').length; }); assert(n >= 1, 'aucun clip'); });
await check('détection du tempo', async () => { await ev(() => beatMarkers()); await page.waitForTimeout(1500); const bpm = await ev(() => Object.values(media).find(m => m.demo)?.bpm); assert(bpm > 60 && bpm < 180, 'bpm ' + bpm); return bpm + ' BPM'; });
await check('assistant vidéo (Reel)', async () => { await ev(() => generateVideo({ ...A_OPTS, goal: 'reel', formats: ['9:16'], dur: 15, style: 'dynamique', voice: 'none', captions: true, beat: false })); const r = await ev(() => ({ a: P.aspect, n: P.clips.length, d: projDur() })); assert(r.a === '9:16' && r.n > 5, JSON.stringify(r)); return JSON.stringify(r); });
await check('textes réseaux + miniature', async () => { const t = await ev(() => socialTexts().youtube.title); assert(t.length > 10, t); await ev(() => renderThumb('yt', 'Villa\nAix', 'sub', 'prix')); });
await check('moteurs IA : panneau, ordre, repli sans réseau', async () => {
  const r = await ev(async () => { KEYS.cloudOK = false; setTab('ai'); const html = document.querySelector('#panelBody').innerHTML; const tasks = Object.keys(ENGINES);
    const res = await runEngine('image', 'test', 'x', 64, 64); const w = await aiWrite('test', 'repli'); return { panel: /Moteurs IA/.test(html) && /IA chinoise/.test(html), tasks: tasks.length, res, w }; });
  assert(r.panel && r.tasks >= 8 && r.res === null && r.w === 'repli', JSON.stringify(r)); return r.tasks + ' tâches';
});
await check('astuces, émoji, enregistreur, vérification', async () => {
  const r = await ev(async () => { openTips(); const t = document.querySelectorAll('.tip').length; document.querySelector('.modal-bg').remove();
    addEmoji('🏡'); const e = P.clips.some(c => c.text === '🏡');
    openRecorder(); const rec = !!document.querySelector('#recV'); document.querySelector('.modal-bg').remove();
    P.info.dpe = 'G'; const ck = videoChecks().some(x => /excessive/.test(x.title)); return { t, e, rec, ck }; });
  assert(r.t > 0 && r.e && r.rec && r.ck, JSON.stringify(r));
});
await check('vision IA sans réseau : pas de plantage', async () => { await ev(() => { const c = P.clips.find(c => c.kind === 'scene'); c.blurFaces = true; c.bgRemove = true; setTime(c.start + .5); }); await page.waitForTimeout(1500); await ev(() => renderFrame(S.t)); });
await check('écran Démarrer et bibliothèque de projets', async () => { const r = await ev(() => { openStart(); const ok = !document.querySelector('#start').hidden && !!document.querySelector('.st-go'); saveNow(); const n = listProjects().length; closeStart(); return { ok, n }; }); assert(r.ok && r.n >= 1, JSON.stringify(r)); });
if (media.length) await check('import vidéo + photo', async () => { await page.setInputFiles('#fileIn', media); await page.waitForTimeout(3500); const n = await ev(() => Object.values(media).filter(m => m.type === 'video' || m.type === 'image').length); assert(n === 2, 'médias ' + n); });
await check('export vidéo', async () => {
  await ev(() => { P.clips = P.clips.filter(c => c.start < 1.5); P.clips.forEach(c => { if (c.start + c.dur > 1.5) c.dur = 1.5 - c.start; }); refreshAll(); });
  const size = await ev(async () => { const b = await renderToBlob(.35, 24, 4, pickMime(), null); return b ? b.size : 0; });
  assert(size > 1000, 'taille ' + size); return Math.round(size / 1024) + ' Ko';
});
await page.screenshot({ path: path.join(out, 'desktop.png') });
const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
phone.on('pageerror', e => errors.push('phone pageerror: ' + e.message));
await phone.goto(pathToFileURL(path.join(root, 'index.html')).href);
await phone.waitForTimeout(1200);
await check('mobile sans débordement horizontal', async () => { const ov = await phone.evaluate(() => document.documentElement.scrollWidth - innerWidth); assert(ov <= 0, 'débordement ' + ov + 'px'); });
await phone.screenshot({ path: path.join(out, 'phone.png') });
await browser.close();
if (errors.length) { console.log('Erreurs JavaScript :\n' + errors.join('\n')); failed++; }
console.log(failed ? `\n${failed} échec(s)` : '\nTous les tests sont passés');
process.exit(failed ? 1 : 0);
