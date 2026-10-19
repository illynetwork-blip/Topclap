#!/usr/bin/env python3
"""Assemble src/ into a single self-contained index.html.

Usage:  python3 build.py            -> index.html (standalone, GitHub Pages)
        python3 build.py --embed    -> also dist/embed.html (no doctype, for HTML hosts that add their own skeleton)
"""
import base64, pathlib, sys, urllib.parse

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
# Content-Security-Policy of the standalone page. 'unsafe-eval' is required by the ONNX Runtime (Emscripten embind) used by the AI models.
CSP = (
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://cdn.jsdelivr.net blob:; worker-src 'self' blob: https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; img-src 'self' data: blob:; media-src 'self' data: blob:; connect-src 'self' data: blob: https: http://localhost:* http://127.0.0.1:*; object-src 'none'; base-uri 'none'; form-action 'none'"
)

def assemble():
    head = (SRC / "head.html").read_text(encoding="utf-8").rstrip()
    css = (SRC / "styles.css").read_text(encoding="utf-8").strip()
    body = (SRC / "body.html").read_text(encoding="utf-8").strip()
    js_files = sorted((SRC / "js").glob("*.js"))
    js = "\n\n".join(f"/* ===== {p.name} ===== */\n" + p.read_text(encoding="utf-8").strip() for p in js_files)
    fonts = {k: "data:font/woff2;base64," + base64.b64encode((ROOT / "brand" / "fonts" / f).read_bytes()).decode() for k, f in (("__FONT_INTER__", "Inter-latin.woff2"), ("__FONT_MONTSERRAT__", "Montserrat-latin.woff2"))}
    for k, v in fonts.items():
        css = css.replace(k, v)
    icon = (ROOT / "brand" / "logo-icon.svg").read_text(encoding="utf-8")
    head = head.replace("__FAVICON__", "data:image/svg+xml," + urllib.parse.quote(" ".join(icon.split())))
    return f"{head}\n<style>\n{css}\n</style>\n\n{body}\n\n<script>\n\"use strict\";\n{js}\n</script>\n"

def main():
    page = assemble()
    standalone = (
        '<!doctype html>\n<html lang="fr">\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta http-equiv="Content-Security-Policy" content="' + CSP + '">\n<meta name="referrer" content="no-referrer">\n'
        '<!-- Top Clap — éditeur vidéo open source (MIT). Fichier généré par build.py depuis src/ -->\n'
        + page.replace(":root{", ":root{\n  padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);", 1)
        + "</html>\n"
    )
    (ROOT / "index.html").write_text(standalone, encoding="utf-8")
    if "--embed" in sys.argv:
        (ROOT / "dist").mkdir(exist_ok=True)
        (ROOT / "dist" / "embed.html").write_text(page, encoding="utf-8")
    print(f"index.html: {len(standalone)//1024} Ko, {standalone.count(chr(10))} lignes")

if __name__ == "__main__":
    main()
