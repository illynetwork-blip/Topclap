#!/usr/bin/env python3
"""Génère brand/brand.html (toutes les déclinaisons du logo) et brand/logo-horizontal*.svg.
Puis : node brand/render.mjs  → PNG dans brand/png/"""
import base64, pathlib
B = pathlib.Path(__file__).parent
icon = (B / "logo-icon.svg").read_text()
mont = base64.b64encode((B / "fonts/Montserrat-latin.woff2").read_bytes()).decode()
inter = base64.b64encode((B / "fonts/Inter-latin.woff2").read_bytes()).decode()
FONTS = f'@font-face{{font-family:Montserrat;src:url(data:font/woff2;base64,{mont}) format("woff2");font-weight:100 900}}@font-face{{font-family:Inter;src:url(data:font/woff2;base64,{inter}) format("woff2");font-weight:100 900}}'

def ico(i):  # unique gradient ids per instance
    return icon.replace("tc-", f"tc{i}-")

def wordmark(light=False, sub=True):
    col = "#0F172A" if light else "#FFFFFF"
    return f'<div class="wmk"><div class="t" style="color:{col}">Top <i>Clap</i></div>' + (f'<div class="s" style="color:{"#475069" if light else "#C9D2F0"}">ÉDITEUR VIDÉO</div>' if sub else "") + "</div>"

n = 0
def nid():
    global n; n += 1; return n

assets = []
def A(name, w, h, html, bg="night", transparent=False):
    assets.append((name, w, h, html, bg, transparent))

A("logo-principal", 1024, 1024, f'<div class="stack">{ico(nid())}{wordmark()}</div>')
A("logo-horizontal", 1200, 420, f'<div class="row">{ico(nid())}{wordmark()}</div>', transparent=True)
A("logo-horizontal-clair", 1200, 420, f'<div class="row">{ico(nid())}{wordmark(True)}</div>', bg="white")
A("icone-app-1024", 1024, 1024, f'<div class="tile">{ico(nid())}</div>', transparent=True)
A("icone-512", 512, 512, f'<div class="tile">{ico(nid())}</div>', transparent=True)
A("icone-claire-512", 512, 512, f'<div class="tile light">{ico(nid())}</div>', transparent=True)
A("icone-transparente-512", 512, 512, f'<div class="bare">{ico(nid())}</div>', transparent=True)
for s in (32, 64, 128, 180, 256):
    A(f"favicon-{s}", s, s, f'<div class="tile fav">{ico(nid())}</div>', transparent=True)
A("profil-reseaux-1080", 1080, 1080, f'<div class="avatar">{ico(nid())}</div>', bg="glow")
A("banniere-1920x480", 1920, 480, f'<div class="ban">{ico(nid())}{wordmark()}<div class="tag">Créez.<br>Montez.<br>Partagez.</div></div>', bg="glow")
A("banniere-site-728x90", 728, 90, f'<div class="ban sm">{ico(nid())}{wordmark(sub=False)}<div class="tag">Créez · Montez · Partagez</div></div>', bg="glow")
A("reseaux-1200x628", 1200, 628, f'<div class="ban md">{ico(nid())}{wordmark()}<div class="tag">Votre histoire en vidéo.</div></div>', bg="glow")
A("vignette-1080", 1080, 1080, f'<div class="stack">{ico(nid())}{wordmark()}<div class="tag c">Donnez vie à vos idées.</div></div>', bg="glow")
A("youtube-banniere-2560x1440", 2560, 1440, f'<div class="ban yt">{ico(nid())}{wordmark()}<div class="tag">Créez.<br>Montez.<br>Partagez.</div></div>', bg="glow")
A("ecran-accueil-1080x1920", 1080, 1920, f'<div class="stack tall">{ico(nid())}{wordmark()}<div class="tag c">Créez. Montez. Partagez.</div></div>', bg="glow")

css = FONTS + """
*{box-sizing:border-box}body{margin:0;background:#222;display:flex;flex-wrap:wrap;gap:20px;padding:20px;font-family:Inter}
.a{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;flex:none}
.a.night{background:#0A0F1E}.a.white{background:#FFFFFF}.a.tr{background:transparent}
.a.glow{background:radial-gradient(60% 80% at 85% 10%,rgba(255,110,199,.45),transparent 60%),radial-gradient(60% 80% at 10% 100%,rgba(0,209,255,.28),transparent 60%),radial-gradient(80% 90% at 50% 50%,#1B1F5A,#0A0F1E 75%)}
.t{font:800 1em/0.9 Montserrat;letter-spacing:-.03em;white-space:nowrap}.t i{font-style:normal;background:linear-gradient(90deg,#8B7CFF,#00D1FF);-webkit-background-clip:text;background-clip:text;color:transparent}
.s{font:600 .22em Montserrat;letter-spacing:.52em;margin-top:.55em;padding-left:.1em}
.wmk{display:flex;flex-direction:column}
.stack{display:flex;flex-direction:column;align-items:center;gap:.25em;font-size:150px}.stack svg{width:2.6em;height:2.6em}.stack .wmk{align-items:center}
.stack.tall{font-size:140px;gap:.3em}
.row{display:flex;align-items:center;gap:.25em;font-size:150px}.row svg{width:1.55em;height:1.55em}
.tile{width:100%;height:100%;border-radius:22%;background:linear-gradient(160deg,#151D44,#0A0F1E);display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(255,255,255,.08)}
.tile svg{width:76%;height:76%}.tile.light{background:#fff;box-shadow:inset 0 0 0 2px #E3E7F3}.tile.fav{border-radius:20%}.tile.fav svg{width:86%;height:86%}
.bare svg{width:100%;height:100%}.bare{width:100%;height:100%}
.avatar{width:72%;height:72%;border-radius:50%;background:#0A0F1E;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 10px rgba(139,124,255,.35),0 30px 80px rgba(0,0,0,.5)}.avatar svg{width:70%;height:70%}
.ban{display:flex;align-items:center;gap:.3em;font-size:120px;width:100%;padding:0 .7em}.ban svg{width:1.6em;height:1.6em}.ban .tag{margin-left:auto;font:500 .32em Inter;color:#DCE2FF;letter-spacing:.02em;text-align:right;max-width:5.5em;line-height:1.3}
.ban.sm{font-size:36px;padding:0 .5em}.ban.sm svg{width:1.4em;height:1.4em}.ban.sm .tag{font-size:.42em;max-width:none}
.ban.md{font-size:96px}.ban.yt{font-size:170px;padding:0 2.3em}
.tag.c{font:500 .3em Inter;color:#DCE2FF;margin-top:.8em}
"""
body = "".join(
    f'<div class="a {"tr" if tr else bg}" id="{name}" style="width:{w}px;height:{h}px">{html}</div>' for name, w, h, html, bg, tr in assets
)
(B / "brand.html").write_text(f'<!doctype html><html lang="fr"><meta charset="utf-8"><title>Top Clap · déclinaisons</title><style>{css}</style><body>{body}</body></html>', encoding="utf-8")

for light in (False, True):
    col, sub = ("#0F172A", "#475069") if light else ("#FFFFFF", "#C9D2F0")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 200" role="img" aria-label="Top Clap, éditeur vidéo">
<style>@font-face{{font-family:TCM;src:url(data:font/woff2;base64,{mont}) format("woff2");font-weight:100 900}}.t{{font:800 92px TCM,Montserrat,sans-serif;letter-spacing:-2.5px}}.s{{font:600 20px TCM,Montserrat,sans-serif;letter-spacing:10px}}</style>
<defs><linearGradient id="tw" x1="0" x2="1"><stop offset="0" stop-color="#8B7CFF"/><stop offset="1" stop-color="#00D1FF"/></linearGradient></defs>
<g transform="translate(6 16) scale(1.31)">{icon.split(">",1)[1].rsplit("</svg>",1)[0]}</g>
<text x="190" y="118" class="t" fill="{col}">Top <tspan fill="url(#tw)">Clap</tspan></text>
<text x="194" y="160" class="s" fill="{sub}">ÉDITEUR VIDÉO</text></svg>'''
    (B / ("logo-horizontal-clair.svg" if light else "logo-horizontal.svg")).write_text(svg, encoding="utf-8")
print(len(assets), "déclinaisons")
