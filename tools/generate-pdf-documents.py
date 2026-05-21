#!/usr/bin/env python3
"""Generate styled Japanese school PDFs (newsletter layout like reference samples)."""
from __future__ import annotations

import os
import re
import sys
from pathlib import Path

_TOOLS = Path(__file__).resolve().parent
if str(_TOOLS) not in sys.path:
    sys.path.insert(0, str(_TOOLS))
from gakkou_template import render_if_newsletter  # noqa: E402

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
DOC_DIR = ROOT / "assets" / "pdf"
FONT_PATH = "C:/Windows/Fonts/msgothic.ttc"
FONT = "MSGothic"

SCHOOL = "霞ノ杜市立霞ノ杜小学校"
PRINCIPAL = "校長　杜原　雅彦"

ERA_LABELS = {
    "h25": ("平成25", 2013),
    "h26": ("平成26", 2014),
    "h27": ("平成27", 2015),
    "h28": ("平成28", 2016),
    "h29": ("平成29", 2017),
    "h30": ("平成30", 2018),
    "r1": ("平成31", 2019),
    "r2": ("令和2", 2020),
    "r3": ("令和3", 2021),
    "r4": ("令和4", 2022),
    "r5": ("令和5", 2023),
    "r6": ("令和6", 2024),
    "r7": ("令和7", 2025),
    "r8": ("令和8", 2026),
}

MONTH_NAMES = [
    "",
    "1月",
    "2月",
    "3月",
    "4月",
    "5月",
    "6月",
    "7月",
    "8月",
    "9月",
    "10月",
    "11月",
    "12月",
]

HEADLINES = {
    4: "新年度を迎えて",
    5: "春の遠足と新緑の季節",
    6: "いきいきと過ごす梅雨のころ",
    7: "夏休みにしかできないことを",
    8: "夏休みの過ごし方について",
    9: "運動会に向けて",
    10: "秋の学習と文化活動",
    11: "読書週間と秋の行事",
    12: "一年のまとめと冬の準備",
    1: "新年のごあいさつ",
    2: "寒さに負けずがんばろう",
    3: "卒業式に向けて",
}

EVENTS_BY_MONTH = {
    4: ["始業式", "学年集会", "身体測定"],
    5: ["春の遠足", "交通安全教室", "PTA総会"],
    6: ["プール開き", "歯科健診", "避難訓練"],
    7: ["期末テスト", "個人面談", "終業式"],
    8: ["夏季休業", "図書室開放（週2）"],
    9: ["運動会", "避難訓練", "音楽会"],
    10: ["科学週間", "人権週間", "健康診断"],
    11: ["読書週間", "社会科見学", "作文発表会"],
    12: ["学芸会", "クリスマス会", "大掃除"],
    1: ["始業式", "寒中見舞", "書き初め"],
    2: ["学級開き", "卒業式予行", "送別会"],
    3: ["卒業式", "修了式", "お別れの会"],
}

SAFETY_TIPS = [
    "交通ルールを守りましょう。",
    "遊びのときはルールと順番を守りましょう。",
    "水辺では大人と一緒に行動しましょう。",
    "熱中症に気をつけ、こまめに水分補給を。",
    "SNSの利用は家族と相談しましょう。",
]

NOTICE_TITLES = {
    "notice-bullying": "霞ノ杜小学校いじめ防止対策基本方針",
    "notice-healing": "治癒報告書（令和6年度以降）",
    "notice-guide": "よくわかる！霞ノ杜小ガイド",
    "notice-info-mgmt": "霞ノ杜小学校情報管理規定",
    "notice-belongings": "学校に置いておくことのできるもの",
    "notice-reading": "子供の読書キャンペーン",
    "notice-weather": "天候悪化等への対応について",
}


def register_font() -> None:
    if FONT not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont(FONT, FONT_PATH))


def issue_to_month(issue: int) -> int:
    return ((issue - 1 + 3) % 12) + 1


def issue_date_label(era_key: str, issue: int) -> str:
    label, base_year = ERA_LABELS[era_key]
    month = issue_to_month(issue)
    year = base_year + 1 if month < 4 else base_year
    return f"{label}年{month}月1日"


def wrap_text(c: canvas.Canvas, text: str, x: float, y: float, width: float, size: int, leading: int) -> float:
    """Draw wrapped Japanese text; return new y."""
    c.setFont(FONT, size)
    chars_per_line = max(18, int(width / (size * 0.55)))
    lines: list[str] = []
    buf = ""
    for ch in text:
        buf += ch
        if len(buf) >= chars_per_line:
            lines.append(buf)
            buf = ""
    if buf:
        lines.append(buf)
    for line in lines:
        c.drawString(x, y, line)
        y -= leading
    return y


def draw_rounded_box(
    c: canvas.Canvas,
    x: float,
    y: float,
    w: float,
    h: float,
    fill: colors.Color,
    stroke: colors.Color | None = None,
) -> None:
    c.setFillColor(fill)
    if stroke:
        c.setStrokeColor(stroke)
        c.setLineWidth(0.8)
        c.roundRect(x, y, w, h, 4, fill=1, stroke=1)
    else:
        c.roundRect(x, y, w, h, 4, fill=1, stroke=0)


def write_school_newsletter(path: Path, era_key: str, issue: int, extra_body: str | None = None) -> None:
    era_label, _ = ERA_LABELS[era_key]
    month = issue_to_month(issue)
    month_name = MONTH_NAMES[month]
    headline = HEADLINES.get(month, "学校生活の様子")
    date_label = issue_date_label(era_key, issue)

    w, h = A4
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(f"学校だより 第{issue}号")

    # Header band
    draw_rounded_box(c, 15 * mm, h - 48 * mm, w - 30 * mm, 32 * mm, colors.HexColor("#B8D4E8"))
    c.setFillColor(colors.HexColor("#1a3d5c"))
    c.setFont(FONT, 22)
    c.drawCentredString(w / 2, h - 28 * mm, "学校だより")
    c.setFont(FONT, 12)
    c.drawCentredString(w / 2, h - 38 * mm, f"第{issue}号")
    c.setFont(FONT, 9)
    c.drawRightString(w - 22 * mm, h - 24 * mm, SCHOOL)
    c.drawRightString(w - 22 * mm, h - 31 * mm, date_label + "発行")
    c.drawRightString(w - 22 * mm, h - 38 * mm, PRINCIPAL)

    # Main headline
    y = h - 58 * mm
    c.setFillColor(colors.HexColor("#2d5a27"))
    c.setFont(FONT, 14)
    c.drawCentredString(w / 2, y, headline)
    y -= 10 * mm

    # Principal message
    body = (
        extra_body
        or f"{month_name}の学校生活をご報告します。子どもたちは学級活動やクラブ活動に意欲的に取り組んでいます。"
        "家庭でのご協力に感謝いたします。"
    )
    y = wrap_text(c, body, 22 * mm, y, w - 44 * mm, 10, 14)

    # Two columns
    y -= 6 * mm
    col_w = (w - 50 * mm) / 2
    left_x = 20 * mm
    right_x = left_x + col_w + 10 * mm
    box_h = 52 * mm
    box_y = y - box_h

    draw_rounded_box(c, left_x, box_y, col_w, box_h, colors.white, colors.HexColor("#8e7aa8"))
    draw_rounded_box(c, right_x, box_y, col_w, box_h, colors.white, colors.HexColor("#8e7aa8"))

    c.setFillColor(colors.HexColor("#4a3d5c"))
    c.setFont(FONT, 11)
    c.drawString(left_x + 4 * mm, box_y + box_h - 8 * mm, f"{month_name}の学校行事")
    c.drawString(right_x + 4 * mm, box_y + box_h - 8 * mm, "安全に過ごしましょう")

    ey = box_y + box_h - 14 * mm
    for i, ev in enumerate(EVENTS_BY_MONTH.get(month, ["学級活動", "クラブ活動"])[:6]):
        c.drawString(left_x + 6 * mm, ey, f"・{ev}")
        ey -= 5.5 * mm

    sy = box_y + box_h - 14 * mm
    for tip in SAFETY_TIPS[:4]:
        c.drawString(right_x + 6 * mm, sy, f"・{tip}")
        sy -= 5.5 * mm

    # Footer notice
    foot_y = 28 * mm
    draw_rounded_box(c, 20 * mm, foot_y, w - 40 * mm, 20 * mm, colors.HexColor("#FFF3C4"), colors.HexColor("#e6c200"))
    c.setFillColor(colors.black)
    c.setFont(FONT, 9)
    c.drawString(26 * mm, foot_y + 12 * mm, "お知らせ")
    wrap_text(
        c,
        "事務室の開室時間は8:30〜16:00です。不明点は担任または事務室までご連絡ください。",
        26 * mm,
        foot_y + 4 * mm,
        w - 52 * mm,
        8,
        11,
    )

    c.setFillColor(colors.grey)
    c.setFont(FONT, 7)
    c.drawCentredString(w / 2, 10 * mm, "※霞ノ杜小学校は謎解き作品のための架空サイトです（フィクション）")

    c.save()


def write_health_newsletter(path: Path, era: int, month: int) -> None:
    w, h = A4
    c = canvas.Canvas(str(path), pagesize=A4)
    draw_rounded_box(c, 15 * mm, h - 42 * mm, w - 30 * mm, 28 * mm, colors.HexColor("#D4EDDA"))
    c.setFillColor(colors.HexColor("#1f5c3a"))
    c.setFont(FONT, 18)
    c.drawCentredString(w / 2, h - 26 * mm, "保健だより")
    c.setFont(FONT, 11)
    c.drawCentredString(w / 2, h - 36 * mm, f"令和{era}年度　{month}月号")

    y = h - 52 * mm
    topics = [
        "・手洗い・うがいの徹底",
        "・規則正しい生活リズム",
        "・アレルギー・持病の連絡",
        "・暑さ・寒さへの注意",
    ]
    c.setFont(FONT, 11)
    c.setFillColor(colors.black)
    for t in topics:
        c.drawString(24 * mm, y, t)
        y -= 8 * mm
    wrap_text(
        c,
        f"{month}月の健康管理についてお知らせします。体調不良時は無理をせず、早めにご連絡ください。",
        24 * mm,
        y - 4 * mm,
        w - 48 * mm,
        10,
        14,
    )
    c.save()


def write_grade_news(path: Path, era: int, grade: int) -> None:
    w, h = A4
    c = canvas.Canvas(str(path), pagesize=A4)
    draw_rounded_box(c, 15 * mm, h - 40 * mm, w - 30 * mm, 26 * mm, colors.HexColor("#E8E0F0"))
    c.setFillColor(colors.HexColor("#4a3d5c"))
    c.setFont(FONT, 20)
    c.drawCentredString(w / 2, h - 24 * mm, f"{grade}学年だより")
    c.setFont(FONT, 11)
    c.drawCentredString(w / 2, h - 34 * mm, f"令和{era}年度")

    wrap_text(
        c,
        f"{grade}学年の学習・生活の様子をお伝えします。国語・算数の単元学習、クラブ活動、"
        "友だちとの協力する姿が見られます。",
        22 * mm,
        h - 52 * mm,
        w - 44 * mm,
        11,
        15,
    )
    c.save()


def write_events_calendar(path: Path, era_key: str) -> None:
    era_label, year = ERA_LABELS[era_key]
    register_font()
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "Title", parent=styles["Normal"], fontName=FONT, fontSize=16, alignment=TA_CENTER, spaceAfter=8
    )
    doc = SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )
    story = [
        Paragraph(f"年間行事予定表（{era_label}年度）", title_style),
        Spacer(1, 6 * mm),
    ]
    rows = [["月", "主な行事"]]
    for m in range(4, 13):
        ev = "／".join(EVENTS_BY_MONTH.get(m, []))
        rows.append([MONTH_NAMES[m], ev])
    for m in range(1, 4):
        ev = "／".join(EVENTS_BY_MONTH.get(m, []))
        rows.append([MONTH_NAMES[m], ev])

    table = Table(rows, colWidths=[22 * mm, 140 * mm])
    table.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, -1), FONT, 9),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#B8D4E8")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f5f8fc")]),
            ]
        )
    )
    story.append(table)
    doc.build(story)


def write_simple_doc(path: Path, title: str, lines: list[str]) -> None:
    w, h = A4
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle(title)
    draw_rounded_box(c, 18 * mm, h - 38 * mm, w - 36 * mm, 24 * mm, colors.HexColor("#eef2ea"))
    c.setFillColor(colors.HexColor("#1f4019"))
    c.setFont(FONT, 14)
    c.drawCentredString(w / 2, h - 24 * mm, title)
    y = h - 48 * mm
    for line in lines:
        if line == title:
            continue
        y = wrap_text(c, line, 22 * mm, y, w - 44 * mm, 10, 14)
        y -= 4 * mm
    c.save()


def parse_stem(stem: str) -> tuple[str, dict]:
    if stem in ("_modern-events", "_archive-events"):
        return "events", {"era_key": "r8" if stem == "_modern-events" else "h28"}
    if stem == "_modern-newsletter":
        return "newsletter", {"era_key": "r8", "issue": 1}

    if stem in NOTICE_TITLES:
        return "notice", {"key": stem}

    m = re.match(r"newsletter-(h\d+|r\d+)-(\d+)$", stem)
    if m:
        return "newsletter", {"era_key": m.group(1), "issue": int(m.group(2))}
    if stem == "newsletter-h28-2016":
        return "newsletter", {"era_key": "h28", "issue": 9, "extra": None}

    m = re.match(r"grade-news-r(\d+)-g(\d+)$", stem)
    if m:
        return "grade", {"era": int(m.group(1)), "grade": int(m.group(2))}

    m = re.match(r"health-r(\d+)-(\d+)$", stem)
    if m:
        return "health", {"era": int(m.group(1)), "month": int(m.group(2))}
    m = re.match(r"health-r(\d+)$", stem)
    if m:
        return "health", {"era": int(m.group(1)), "month": 4}

    m = re.match(r"events-(h\d+|r\d+)$", stem)
    if m:
        return "events", {"era_key": m.group(1)}

    m = re.match(r"lunch-r(\d+)$", stem)
    if m:
        return "lunch", {"era": int(m.group(1))}

    if stem == "roster-h28-river":
        return "roster", {}

    return "simple", {"title": stem}


H28_09_EXTRA = (
    "4年1組は審査で好評を得ました。絵画クラブの作品展では校内で注目を集めました。"
    "地域での活動は、安全配慮のもと継続しています。今年度も、事前の安全確認を徹底しています。"
)


def generate_one(stem: str) -> None:
    register_font()
    path = DOC_DIR / f"{stem}.pdf"
    kind, meta = parse_stem(stem)

    if kind == "newsletter":
        if render_if_newsletter(path, stem):
            return
        extra = H28_09_EXTRA if stem == "newsletter-h28-09" else meta.get("extra")
        write_school_newsletter(path, meta["era_key"], meta["issue"], extra)
    elif kind == "health":
        write_health_newsletter(path, meta["era"], meta["month"])
    elif kind == "grade":
        write_grade_news(path, meta["era"], meta["grade"])
    elif kind == "events":
        write_events_calendar(path, meta["era_key"])
    elif kind == "notice":
        title = NOTICE_TITLES[meta["key"]]
        write_simple_doc(path, title, [title, "（フィクション資料）", "本校の方針・手続きを掲載しています。"])
    elif kind == "lunch":
        era = meta["era"]
        write_simple_doc(
            path,
            f"給食だより・こんだて（令和{era}年度）",
            ["1月の献立", "月曜：カレーライス", "火曜：みそ汁・焼き魚", "水曜：うどん", "木曜：牛乳・パン", "金曜：ごはん・唐揚げ"],
        )
    elif kind == "roster":
        write_simple_doc(path, "河川敷清掃 参加名簿", ["河川敷清掃 参加名簿（マスク済み）", "氏名欄は個人情報保護のため省略しています。"])
    else:
        write_simple_doc(path, meta.get("title", stem), [stem])


def main() -> None:
    if not os.path.exists(FONT_PATH):
        raise SystemExit(f"Font not found: {FONT_PATH}")

    stems: set[str] = set()
    for p in DOC_DIR.glob("*.html"):
        stems.add(p.stem)
    for p in DOC_DIR.glob("*.pdf"):
        stems.add(p.stem)

    for stem in sorted(stems):
        generate_one(stem)
        print(f"OK {stem}.pdf")

    for html in DOC_DIR.glob("*.html"):
        html.unlink()

    print(f"Generated {len(stems)} PDFs; removed HTML files.")


if __name__ == "__main__":
    main()
