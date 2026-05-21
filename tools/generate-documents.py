#!/usr/bin/env python3
"""Generate UTF-8 HTML documents in assets/pdf/ (replaces binary PDFs)."""
from __future__ import annotations

import html
import os
import re
from pathlib import Path

try:
    import pypdf
except ImportError:
    raise SystemExit("pip install pypdf")

ROOT = Path(__file__).resolve().parents[1]
DOC_DIR = ROOT / "assets" / "pdf"

ERA_LABELS = {
    "h25": "平成25年度",
    "h26": "平成26年度",
    "h27": "平成27年度",
    "h28": "平成28年度",
    "h29": "平成29年度",
    "h30": "平成30年度",
    "r1": "平成31年度",
    "r2": "令和2年度",
    "r3": "令和3年度",
    "r4": "令和4年度",
    "r5": "令和5年度",
    "r6": "令和6年度",
    "r7": "令和7年度",
    "r8": "令和8年度",
}

NOTICE_TITLES = {
    "notice-bullying": "霞ノ杜小学校いじめ防止対策基本方針",
    "notice-healing": "治癒報告書（令和6年度以降）",
    "notice-guide": "よくわかる！霞ノ杜小ガイド",
    "notice-info-mgmt": "霞ノ杜小学校情報管理規定",
    "notice-belongings": "学校に置いておくことのできるもの",
    "notice-reading": "子供の読書キャンペーン",
    "notice-weather": "天候悪化等への対応について",
}

TEMPLATE_BODIES: dict[str, list[str]] = {
    "_modern-events": [
        "年間行事予定表（令和8年度）",
        "5月：春の遠足",
        "6月：プール開き",
        "9月：運動会",
        "10月：科学週間",
        "12月：卒業式",
    ],
    "_modern-newsletter": [
        "学校だより（令和8年度）",
        "各号の内容は掲載準備中です。",
        "霞ノ杜小学校（フィクション）",
    ],
    "_archive-events": [
        "年間行事予定表（保管年度）",
        "卒業生向けアーカイブ用の行事予定です。",
    ],
}


def extract_pdf_lines(path: Path) -> list[str]:
    try:
        reader = pypdf.PdfReader(str(path))
        raw = (reader.pages[0].extract_text() or "").replace("\r", "")
        lines = [ln.strip() for ln in raw.split("\n") if ln.strip()]
        return [ln for ln in lines if not ln.startswith("_")]
    except Exception:
        return []


def title_from_filename(name: str) -> tuple[str, list[str]]:
    stem = Path(name).stem

    if stem in TEMPLATE_BODIES:
        title = TEMPLATE_BODIES[stem][0]
        return title, TEMPLATE_BODIES[stem]

    if stem in NOTICE_TITLES:
        title = NOTICE_TITLES[stem]
        return title, [title, "（フィクション資料）"]

    m = re.match(r"newsletter-(h\d+|r\d+)-(\d+)$", stem)
    if m:
        era, num = m.group(1), int(m.group(2))
        title = f"学校だより {ERA_LABELS.get(era, era)} 第{num}号"
        return title, [title, "霞ノ杜小学校（フィクション）"]

    if stem == "newsletter-h28-2016":
        return "学校だより 平成28年度", ["学校だより 平成28年度"]

    m = re.match(r"grade-news-r(\d+)-g(\d+)$", stem)
    if m:
        era, grade = int(m.group(1)), int(m.group(2))
        title = f"{grade}学年だより 令和{era}年度"
        return title, [title, "当該学年の様子をお伝えします。"]

    m = re.match(r"health-r(\d+)-(\d+)$", stem)
    if m:
        era, month = int(m.group(1)), int(m.group(2))
        title = f"保健だより 令和{era}年度 {month}月号"
        return title, [title, "健康・安全に関するお知らせです。"]

    m = re.match(r"health-r(\d+)$", stem)
    if m:
        era = int(m.group(1))
        title = f"保健だより 令和{era}年度"
        return title, [title]

    m = re.match(r"events-(h\d+|r\d+)$", stem)
    if m:
        era = m.group(1)
        title = f"年間行事予定表 {ERA_LABELS.get(era, era)}"
        body = [title, "年間の主な行事予定を掲載しています。"]
        if era == "r8":
            body.extend(TEMPLATE_BODIES["_modern-events"][1:])
        return title, body

    m = re.match(r"lunch-r(\d+)$", stem)
    if m:
        title = f"給食だより・こんだて（令和{int(m.group(1))}年度）"
        return title, [title, "献立表です。"]

    if stem == "roster-h28-river":
        return "河川敷清掃 参加名簿", ["河川敷清掃 参加名簿（マスク済み）"]

    return stem, [stem]


def write_html(path: Path, title: str, body_lines: list[str]) -> None:
    seen: set[str] = {title}
    paragraphs: list[str] = []
    for line in body_lines:
        if not line or line in seen:
            continue
        seen.add(line)
        paragraphs.append(f"<p>{html.escape(line)}</p>")

    content = "\n".join(paragraphs) if paragraphs else f"<p>{html.escape(title)}</p>"
    doc = f"""<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>{html.escape(title)}</title>
  <style>
    body {{
      font-family: "Yu Gothic", "Hiragino Maru Gothic Pro", Meiryo, sans-serif;
      max-width: 720px;
      margin: 2rem auto;
      padding: 1.5rem;
      line-height: 1.85;
      color: #222;
      background: #fff;
    }}
    h1 {{
      font-size: 1.2rem;
      margin: 0 0 1.2rem;
      padding-bottom: 0.4rem;
      border-bottom: 2px solid #8e7aa8;
      color: #4a3d5c;
    }}
    p {{ margin: 0.5rem 0; }}
    .doc-footer {{
      margin-top: 2rem;
      font-size: 0.75rem;
      color: #888;
    }}
  </style>
</head>
<body>
  <h1>{html.escape(title)}</h1>
  {content}
  <p class="doc-footer">霞ノ杜小学校（フィクション資料）</p>
</body>
</html>
"""
    path.write_text(doc, encoding="utf-8")


def pick_body(extracted: list[str], fallback: list[str], title: str) -> list[str]:
    """Prefer filename metadata unless PDF had long unique article text."""
    if not extracted:
        return fallback
    long_lines = [ln for ln in extracted if len(ln) > 36 and ln != title]
    if len(long_lines) >= 1:
        return extracted
    return fallback


def main() -> None:
    sources = sorted(DOC_DIR.glob("*.pdf")) + sorted(DOC_DIR.glob("*.html"))
    if not sources:
        print("No documents found.")
        return

    count = 0
    for src in sources:
        stem = src.stem
        extracted = extract_pdf_lines(src) if src.suffix == ".pdf" else []
        title, fallback = title_from_filename(stem + ".html")
        body = pick_body(extracted, fallback, title)
        html_path = DOC_DIR / f"{stem}.html"
        write_html(html_path, title, body)
        if src.suffix == ".pdf":
            src.unlink()
        count += 1
        print(f"OK {html_path.name}")

    print(f"Wrote {count} HTML documents.")


if __name__ == "__main__":
    main()
