"""Render 学校便り PDFs from gakkou01word2000 template (graphics preserved)."""
from __future__ import annotations

import calendar
import re
from pathlib import Path

import fitz

ROOT = Path(__file__).resolve().parents[1]
TEMPLATE_SRC = ROOT / "assets" / "pdf-template" / "gakkou01word2000.pdf"
BLANK_CACHE = ROOT / "assets" / "pdf-template" / "blank.pdf"
FONT_FILE = "C:/Windows/Fonts/msmincho.ttc"
FONT_NAME = "mincho"

SCHOOL = "霞ノ杜市立霞ノ杜小学校"
PRINCIPAL_NAME = "杜原　雅彦"

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

LIFE_GOALS = {
    1: "礼儀正しくしよう",
    2: "時間を守ろう",
    3: "卒業まで全力で",
    4: "挨拶をしっかりしよう",
    5: "友だちと協力しよう",
    6: "勉強・運動に励もう",
    7: "夏休みを有意義に",
    8: "ルールを守ろう",
    9: "運動会でがんばろう",
    10: "読書の習慣を",
    11: "感謝の気持ちを",
    12: "一年の締めくくりを",
}

HEADLINE = {
    1: "年頭にあたって",
    2: "寒さに負けず",
    3: "卒業式に向けて",
    4: "新年度のスタート",
    5: "春の遠足の季節",
    6: "梅雨のころ",
    7: "夏休みに向けて",
    8: "夏休みの過ごし方",
    9: "秋の行事へ",
    10: "学習に励んで",
    11: "読書週間",
    12: "一年のまとめ",
}

PRINCIPAL_BODY = {
    1: (
        "新年明けましておめでとうございます。皆様には健やかに新しい年を"
        "お迎えのこととお喜び申し上げます。昨年は本校の教育にご理解・"
        "ご協力いただき誠にありがとうございました。本年も変わらぬご支援を"
        "よろしくお願いいたします。三学期が始まりました。子どもたちが"
        "健康で楽しく過ごせますよう、ご家庭と連携してまいります。"
    ),
    7: (
        "夏休みが近づいてまいりました。子どもたちが安全で充実した休みを"
        "過ごせるよう、生活リズムの維持や水辺の安全にご注意ください。"
        "暑さ対策としてこまめな水分補給をお願いいたします。"
    ),
}

MIDDLE_LEFT = {
    1: (
        "「三学期スタート」",
        "いよいよ三学期です。六年生にとっては最後の学期となります。"
        "日々を大切に過ごしましょう。",
        "・六年生を送る会の準備",
        "・新一年生を迎える準備",
        "・風邪には注意しましょう",
    ),
}

MIDDLE_RIGHT = {
    1: (
        "「校内書初め展」のご案内",
        "今年も書初め展を行います。",
        "一年・二年は硬筆、三年以上は毛筆です。",
        "ぜひご覧ください。",
        "期間　一月二十三日～三十日",
        "時間　午前九時～午後四時",
        "場所　各教室廊下",
    ),
}

H28_09_EXTRA = (
    "4年1組は審査で好評を得ました。絵画クラブの作品展では校内で注目を"
    "集めました。地域での活動は安全配慮のもと継続しています。"
)


def issue_to_month(issue: int) -> int:
    return ((issue - 1 + 3) % 12) + 1


def issue_date_parts(era_key: str, issue: int) -> tuple[str, int, int, int]:
    label, base = ERA_LABELS[era_key]
    month = issue_to_month(issue)
    year = base + 1 if month < 4 else base
    day = 8 if issue == 10 else 1
    return label, year, month, day


def ensure_blank_template() -> Path:
    if BLANK_CACHE.exists():
        return BLANK_CACHE
    if not TEMPLATE_SRC.exists():
        raise FileNotFoundError(f"Template not found: {TEMPLATE_SRC}")
    doc = fitz.open(str(TEMPLATE_SRC))
    page = doc[0]
    for b in page.get_text("dict")["blocks"]:
        if b["type"] != 0:
            continue
        for line in b["lines"]:
            for sp in line["spans"]:
                r = fitz.Rect(sp["bbox"]) + (-0.5, -0.5, 0.5, 0.5)
                page.add_redact_annot(r, fill=(1, 1, 1))
    page.apply_redactions()
    BLANK_CACHE.parent.mkdir(parents=True, exist_ok=True)
    doc.save(str(BLANK_CACHE))
    doc.close()
    return BLANK_CACHE


def vtext(
    page: fitz.Page,
    x: float,
    y: float,
    text: str,
    *,
    size: float = 10.5,
    gap: float = 10.2,
    color: tuple[float, float, float] = (0, 0, 0),
) -> None:
    cy = y
    for ch in text:
        page.insert_text(
            (x, cy),
            ch,
            fontsize=size,
            fontname=FONT_NAME,
            fontfile=FONT_FILE,
            color=color,
        )
        cy += gap


def htext(
    page: fitz.Page,
    x: float,
    y: float,
    text: str,
    *,
    size: float = 11,
    color: tuple[float, float, float] = (0, 0, 0),
) -> None:
    page.insert_text(
        (x, y),
        text,
        fontsize=size,
        fontname=FONT_NAME,
        fontfile=FONT_FILE,
        color=color,
    )


def wrap_vertical_columns(
    page: fitz.Page,
    text: str,
    x_start: float,
    y_start: float,
    x_step: float = -20,
    cols: int = 12,
    gap: float = 10.2,
) -> None:
    """Flow text into vertical columns right-to-left."""
    chars = list(text.replace("\n", ""))
    per_col = 22
    col = 0
    x = x_start
    idx = 0
    while idx < len(chars) and col < cols:
        chunk = chars[idx : idx + per_col]
        vtext(page, x, y_start, chunk, gap=gap)
        idx += per_col
        x += x_step
        col += 1


def month_calendar_rows(year: int, month: int, era_label: str) -> list[tuple[str, str, str, tuple]]:
    """day label, weekday kanji, event, color (0 black, 1 red, 2 blue saturday)."""
    import datetime

    rows: list[tuple[str, str, str, tuple]] = []
    wd_names = ["月", "火", "水", "木", "金", "土", "日"]
    last = calendar.monthrange(year, month)[1]
    events = {
        1: {1: "元旦", 8: "始業式", 13: "成人の日"},
        4: {8: "始業式", 15: "春の遠足"},
        7: {20: "終業式"},
        9: {15: "運動会"},
        12: {25: "クリスマス会"},
    }
    month_ev = events.get(month, {})
    for d in range(last, 0, -1):
        dt = datetime.date(year, month, d)
        wd = dt.weekday()
        wk = wd_names[wd]
        ev = month_ev.get(d, "")
        if wd == 5:
            col = (0, 0, 1)
        elif wd == 6 or d in (1, 13) and month == 1:
            col = (1, 0, 0)
        else:
            col = (0, 0, 0)
        rows.append((f"{d}日", wk, ev, col))
    # pad to 31 rows
    while len(rows) < 31:
        rows.append(("", "", "", (0, 0, 0)))
    return rows[:31]


def render_newsletter(output: Path, era_key: str, issue: int, extra: str | None = None) -> None:
    blank = ensure_blank_template()
    doc = fitz.open(str(blank))
    page = doc[0]

    era_label, year, month, day = issue_date_parts(era_key, issue)
    month_name = f"{month}月"

    # 右欄：号数・日付・学校名・校長（テンプレート右端に合わせる）
    vtext(page, 528, 72, f"第{issue}号", size=10.5)
    vtext(page, 508, 72, f"{era_label}年{month}月{day}日", size=10.5)
    vtext(page, 488, 72, SCHOOL, size=10.5)
    vtext(page, 468, 72, f"校長{PRINCIPAL_NAME}", size=10.5)

    # 年頭メッセージ（上段白枠・縦書き）
    headline = HEADLINE.get(month, "年頭にあたって")
    vtext(page, 448, 78, headline, size=11)
    vtext(page, 428, 78, f"校長{PRINCIPAL_NAME}", size=10.5)

    body = extra or PRINCIPAL_BODY.get(month) or PRINCIPAL_BODY[1]
    wrap_vertical_columns(page, body, 408, 95, x_step=-20, cols=14)

    # 生活目標（緑帯）
    goal = LIFE_GOALS.get(month, "元気にがんばろう")
    vtext(page, 52, 340, f"{month_name}の生活目標", size=10.5)
    vtext(page, 52, 430, f"「{goal}」", size=10.5)

    # 中段左
    left_lines = MIDDLE_LEFT.get(month, (f"「{month_name}の様子」", f"{month_name}の学級・クラブ活動の様子です。"))
    y = 340
    for i, line in enumerate(left_lines):
        vtext(page, 100 + i * 22, y, line, size=10.5)

    # 中段右
    right_lines = MIDDLE_RIGHT.get(month, (f"「{month_name}のお知らせ」", "詳細は担任までお問い合わせください。"))
    y = 340
    for i, line in enumerate(right_lines):
        vtext(page, 330 + i * 22, y, line, size=10.5)

    # 行事予定タイトル
    htext(page, 238, 588, f"{month_name}の行事予定", size=12)

    # カレンダー表（下段・31行・下から1日）
    rows = month_calendar_rows(year, month, era_label)
    y_bottom = 748
    row_step = 4.35
    for i, (day_l, wd, ev, rgb) in enumerate(rows):
        y = y_bottom - i * row_step
        if not day_l:
            continue
        htext(page, 50, y, day_l, size=7.5, color=rgb)
        htext(page, 72, y, wd, size=7.5, color=rgb)
        if ev:
            htext(page, 92, y, ev, size=7.5, color=rgb)

    doc.save(str(output))
    doc.close()


def parse_newsletter_stem(stem: str) -> tuple[str, int] | None:
    m = re.match(r"newsletter-(h\d+|r\d+)-(\d+)$", stem)
    if m:
        return m.group(1), int(m.group(2))
    if stem == "newsletter-h28-2016":
        return "h28", 9
    return None


def render_if_newsletter(output: Path, stem: str) -> bool:
    parsed = parse_newsletter_stem(stem)
    if not parsed:
        return False
    era_key, issue = parsed
    extra = H28_09_EXTRA if stem == "newsletter-h28-09" else None
    render_newsletter(output, era_key, issue, extra)
    return True
