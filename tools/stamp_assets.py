"""Cache-busting for GitHub Pages: tag every local script, stylesheet and image an HTML page
loads with ?v=<first 8 hex digits of the file's SHA-256>.

A changed file gets a new URL, so browsers fetch it at once instead of mixing a new page with
an old cached script. Run it after editing any of those files; CI runs it with --check.

    python tools/stamp_assets.py          # rewrite the tags
    python tools/stamp_assets.py --check  # exit 1 if any tag is stale or missing
"""

import hashlib
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REF = re.compile(
    r'(?P<attr>\b(?:src|href)=")(?P<path>[^"#?:]+\.(?:js|css|png|jpe?g|svg|webp|gif|ico))'
    r'(?:\?[^"#]*)?(?P<end>")'
)
SKIP = {".git", "node_modules", "target"}


TEXT = {".js", ".css", ".svg"}


def digest(path: Path) -> str:
    data = path.read_bytes()
    # Hash text files with LF line ends, so a CRLF checkout (Windows autocrlf) stamps what CI sees.
    if path.suffix.lower() in TEXT:
        data = data.replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()[:8]


def stamp(html: Path) -> tuple[str, list[str]]:
    text = html.read_text(encoding="utf-8")
    missing = []

    def sub(m: re.Match) -> str:
        rel = m["path"]
        target = (html.parent / rel).resolve()
        if rel.startswith("/") or not target.is_file():
            missing.append(rel)
            return m[0]
        return f"{m['attr']}{rel}?v={digest(target)}{m['end']}"

    return REF.sub(sub, text), missing


def main() -> int:
    check = "--check" in sys.argv[1:]
    stale = []
    for html in sorted(ROOT.rglob("*.html")):
        if SKIP & set(html.relative_to(ROOT).parts):
            continue
        new, missing = stamp(html)
        for rel in missing:
            print(f"{html.relative_to(ROOT)}: not a local file, left as is: {rel}")
        if new != html.read_text(encoding="utf-8"):
            stale.append(html.relative_to(ROOT))
            if not check:
                html.write_text(new, encoding="utf-8")
    if check and stale:
        print("Stale ?v= tags in:", ", ".join(map(str, stale)))
        print("Run: python tools/stamp_assets.py")
        return 1
    print(("Up to date" if check else f"Stamped {len(stale)} file(s)") + ".")
    return 0


if __name__ == "__main__":
    sys.exit(main())
