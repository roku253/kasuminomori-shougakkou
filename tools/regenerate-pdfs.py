#!/usr/bin/env python3
"""Regenerate PDFs with ReportLab (uncompressed streams, readable Japanese)."""
from __future__ import annotations

import os
import re
import zlib
from pathlib import Path

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "assets" / "pdf"
FONT_PATH = "C:/Windows/Fonts/msgothic.ttc"
FONT_NAME = "MSGothic"

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


def decode_mpdf_text(path: Path) -> list[str]:
    data = path.read_bytes()
    if not data.startswith(b"%PDF"):
        return []

    chars: dict[int, str] = {}
    for m in re.finditer(rb"<([0-9A-Fa-f]{4})>\s*<([0-9A-Fa-f]{4})>", data):
        src = int(m.group(1), 16)
        dst = int(m.group(2), 16)
        if src > 0:
            chars[src] = chr(dst)

    texts: list[str] = []
    for mobj in re.finditer(rb"/Length (\d+).*?stream\r?\n", data, re.S):
        start = mobj.end()
        length = int(mobj.group(1))
        raw = data[start : start + length]
        try:
            dec = zlib.decompress(raw)
        except zlib.error:
            continue
        if b"Tj" not in dec:
            continue
        for sm in re.finditer(rb"\((?:[^()\\]|\\.)*\)\s*Tj", dec):
            raw_s = sm.group(0)[1 : sm.group(0).index(b")")]
            buf = bytearray()
            i = 0
            while i < len(raw_s):
                if raw_s[i] == 92:
                    i += 1
                    if i >= len(raw_s):
                        break
                    if raw_s[i : i + 1] in (b"n", b"r", b"t", b"b", b"f"):
                        i += 1
                    elif 48 <= raw_s[i] <= 55 and i + 2 < len(raw_s):
                        buf.append(int(raw_s[i : i + 3], 8))
                        i += 3
                    else:
                        buf.append(raw_s[i])
                        i += 1
                else:
                    buf.append(raw_s[i])
                    i += 1
            out: list[str] = []
            for j in range(0, len(buf) - 1, 2):
                code = (buf[j] << 8) | buf[j + 1]
                out.append(chars.get(code, ""))
            line = "".join(out).strip()
            if line and not line.startswith("_"):
                texts.append(line)
    return texts


def title_from_filename(name: str) -> tuple[str, list[str]]:
    stem = name[:-4] if name.endswith(".pdf") else name

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


def write_pdf(path: Path, title: str, body_lines: list[str]) -> None:
    c = canvas.Canvas(str(path), pagesize=A4, pageCompression=0)
    c.setTitle(title)
    c.setFont(FONT_NAME, 16)
    y = 800
    c.drawString(50, y, title)
    y -= 28
    c.setFont(FONT_NAME, 11)
    seen: set[str] = {title}
    for line in body_lines:
        if not line or line in seen:
            continue
        seen.add(line)
        if y < 60:
            c.showPage()
            c.setFont(FONT_NAME, 11)
            y = 800
        c.drawString(50, y, line)
        y -= 18
    c.save()


def main() -> None:
    if not os.path.exists(FONT_PATH):
        raise SystemExit(f"Font not found: {FONT_PATH}")

    pdfmetrics.registerFont(TTFont(FONT_NAME, FONT_PATH))

    count = 0
    for path in sorted(PDF_DIR.glob("*.pdf")):
        if path.name.startswith("_test-"):
            continue
        decoded = decode_mpdf_text(path)
        title, fallback = title_from_filename(path.name)
        body = decoded if decoded else fallback
        if not body:
            body = [title]
        write_pdf(path, title, body)
        count += 1
        print(f"OK {path.name}")

    test = PDF_DIR / "_test-reportlab.pdf"
    if test.exists():
        test.unlink()

    print(f"Regenerated {count} PDFs (ReportLab, uncompressed).")


if __name__ == "__main__":
    main()
