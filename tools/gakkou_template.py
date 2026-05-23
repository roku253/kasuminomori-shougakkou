"""Render 学校便り PDFs from gakkou01word2000 template (graphics preserved)."""
from __future__ import annotations

import calendar
import datetime
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

# --- Layout from gakkou01word2000.pdf (points, origin top-left) ---
HDR_ISSUE_X, HDR_DATE_X, HDR_SCHOOL_X, HDR_PRINCIPAL_X = 533.0, 519.0, 505.0, 492.0
HDR_Y = 215.0
HDR_SIZE = 9.0

PRINCIPAL_COL_X0 = 453.5
PRINCIPAL_COL_STEP = -20.0
PRINCIPAL_Y = 78.0
PRINCIPAL_SIZE = 10.5
PRINCIPAL_GAP = 10.5
PRINCIPAL_COLS = 14

LIFE_GOAL_X, LIFE_GOAL_Y = 55.0, 335.0
LIFE_GOAL_SIZE = 14.0
LIFE_GOAL_GAP = 14.0

MID_LEFT_X, MID_LEFT_Y = 254.0, 336.0
MID_CENTER_X, MID_CENTER_Y = 287.0, 337.0
MID_RIGHT_X, MID_RIGHT_Y = 493.0, 347.0
MID_EXTRA_X, MID_EXTRA_Y = 510.0, 455.0
MID_COL_STEP = 20.0
MID_SIZE = 10.5
MID_TITLE_SIZE = 12.0
MID_GAP = 10.5

CAL_TITLE_X, CAL_TITLE_Y = 238.0, 581.0
CAL_TITLE_SIZE = 12.0

# 31 columns: left = 31日, right = 1日
CAL_COL_X = [
    47.8, 63.8, 80.3, 96.8, 113.1, 129.6, 146.1, 162.3, 178.8, 195.3,
    211.6, 228.1, 244.4, 260.9, 277.4, 293.6, 310.1, 326.6, 342.9, 359.4,
    375.9, 392.2, 408.7, 425.2, 441.5, 458.0, 474.5, 490.7, 507.2, 523.5, 539.7,
]
CAL_DAY_Y, CAL_DAY_GAP = 613.0, 8.5
CAL_WD_Y = 652.0
CAL_EVT_Y, CAL_EVT_GAP = 666.0, 8.5
CAL_SIZE = 9.0

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
    2: (
        "寒い日が続きますが、子どもたちは元気に登校しています。"
        "感染症予防のため手洗い・うがいを続けてください。校内では"
        "学習・生活のルールを確認し、安全で規律ある学校生活を"
        "大切にしています。"
    ),
    3: (
        "卒業式が近づいてまいりました。六年生の皆さんには感謝の気持ちを"
        "伝え、残りの学校生活を大切に過ごしてほしいと思います。"
        "在校生も送る会の準備など、協力して取り組んでいます。"
    ),
    4: (
        "新年度が始まりました。新一年生の入学を心よりお祝い申し上げます。"
        "子どもたちが新しいクラスで友だちと仲良く、学びに意欲を持って"
        "過ごせるよう、家庭・学校が一緒になって見守ってまいります。"
    ),
    5: (
        "新緑の季節を迎え、子どもたちは遠足やクラブ活動などに"
        "元気に取り組んでいます。交通安全に注意し、規則正しい生活を"
        "心がけてください。春の遠足では協力して行動できるよう"
        "指導してまいります。"
    ),
    6: (
        "梅雨の時期となりました。気温の変化に注意し、体調管理に"
        "気をつけてください。校内では学習のまとめや生活の振り返りを"
        "行い、夏に向けて心身ともに整えています。"
    ),
    7: (
        "夏休みが近づいてまいりました。子どもたちが安全で充実した休みを"
        "過ごせるよう、生活リズムの維持や水辺の安全にご注意ください。"
        "暑さ対策としてこまめな水分補給をお願いいたします。"
    ),
    8: (
        "夏休み真っ最中です。毎日の生活リズムを大切にし、宿題や"
        "読書、運動などバランスよく過ごしてください。台風や暑さにも"
        "十分注意し、無理のない範囲で過ごしましょう。"
    ),
    9: (
        "二学期が本格的に始まりました。運動会や学習発表会など"
        "秋の行事に向けて、子どもたちはいきいきと活動しています。"
        "ご家庭でも声かけをお願いいたします。"
    ),
    10: (
        "秋深まる季節です。読書週間や学習まとめなど、学びに集中する"
        "時期となりました。子どもたちの成長を認めながら、無理なく"
        "励ましてください。"
    ),
    11: (
        "読書週間を実施し、本に親しむ機会を増やしています。"
        "日々の学習の習慣づけや感謝の気持ちを大切にし、年末に向けて"
        "心穏やかな学校生活を送れるよう指導してまいります。"
    ),
    12: (
        "一年の締めくくりの時期です。本年も本校の教育活動にご理解・"
        "ご協力を賜り厚く御礼申し上げます。子どもたちが一年の成果を"
        "振り返り、来年への意欲を持てるよう支援してまいります。"
    ),
}

MIDDLE_LEFT = {
    1: (
        "「三学期スタート」",
        "いよいよ三学期です。六年生にとっては最後の学期となります。",
        "日々を大切に過ごしましょう。",
        "・六年生を送る会の準備",
        "・新一年生を迎える準備",
    ),
    5: (
        "「春の遠足」",
        "各学年で遠足を実施します。",
        "持ち物・行動について担任よりお知らせします。",
        "・交通安全に注意",
        "・仲間と協力して行動",
    ),
}

MIDDLE_RIGHT = {
    1: (
        "「校内書初め展」のご案内",
        "今年も書初め展を行います。",
        "一年・二年は硬筆、三年以上は毛筆です。",
        "ぜひご覧ください。",
        "期間　一月下旬",
        "場所　各教室廊下",
    ),
    5: (
        "「保護者会のお知らせ」",
        "学級保護者会を開催します。",
        "詳細は学級だよりをご確認ください。",
        "ご出席のほどよろしくお願いします。",
    ),
}

MONTH_EVENTS = {
    1: {1: "元旦", 8: "始業式", 13: "成人の日"},
    2: {11: "建国記念の日"},
    3: {20: "卒業式", 21: "始業式"},
    4: {8: "始業式", 15: "春の遠足"},
    5: {5: "こどもの日"},
    6: {15: "PTA総会"},
    7: {20: "終業式"},
    9: {15: "運動会"},
    10: {10: "運動会"},
    11: {3: "文化祭"},
    12: {25: "クリスマス会"},
}

H28_09_EXTRA = (
    "4年1組は審査で好評を得ました。絵画クラブの作品展では校内で注目を"
    "集めました。地域での活動は安全配慮のもと継続しています。"
)

WD_NAMES = ["月", "火", "水", "木", "金", "土", "日"]
_ONES = "一二三四五六七八九"


def issue_to_month(issue: int) -> int:
    return ((issue - 1 + 3) % 12) + 1


def issue_date_parts(era_key: str, issue: int) -> tuple[str, int, int, int]:
    label, base = ERA_LABELS[era_key]
    month = issue_to_month(issue)
    year = base + 1 if month < 4 else base
    day = 8 if issue == 10 else 1
    return label, year, month, day


def kanji_day(n: int) -> str:
    if n <= 0:
        return ""
    if n == 10:
        return "十日"
    if n < 10:
        return _ONES[n - 1] + "日"
    if n == 20:
        return "二十日"
    if n < 20:
        return "十" + _ONES[n - 11] + "日"
    if n == 30:
        return "三十日"
    if n < 30:
        return "二十" + _ONES[n - 21] + "日"
    if n == 31:
        return "三十一日"
    return "三十" + _ONES[n - 31] + "日"


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
    gap: float | None = None,
    color: tuple[float, float, float] = (0, 0, 0),
) -> None:
    if gap is None:
        gap = size * 0.98
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
    *,
    x_step: float = -20,
    cols: int = 14,
    per_col: int = 22,
    size: float = 10.5,
    gap: float = 10.5,
) -> None:
    chars = list(text.replace("\n", ""))
    x = x_start
    idx = 0
    for _ in range(cols):
        if idx >= len(chars):
            break
        chunk = chars[idx : idx + per_col]
        vtext(page, x, y_start, chunk, size=size, gap=gap)
        idx += per_col
        x += x_step


def weekday_color(dt: datetime.date) -> tuple[float, float, float]:
    if dt.weekday() == 5:
        return (0, 0, 1)
    if dt.weekday() == 6:
        return (1, 0, 0)
    return (0, 0, 0)


def render_calendar(page: fitz.Page, year: int, month: int) -> None:
    last = calendar.monthrange(year, month)[1]
    events = MONTH_EVENTS.get(month, {})

    for day in range(1, last + 1):
        col_idx = 31 - day
        x = CAL_COL_X[col_idx]
        dt = datetime.date(year, month, day)
        rgb = weekday_color(dt)

        vtext(page, x, CAL_DAY_Y, kanji_day(day), size=CAL_SIZE, gap=CAL_DAY_GAP, color=rgb)
        htext(page, x, CAL_WD_Y, WD_NAMES[dt.weekday()], size=CAL_SIZE, color=rgb)

        ev = events.get(day, "")
        if ev:
            vtext(page, x, CAL_EVT_Y, ev, size=CAL_SIZE, gap=CAL_EVT_GAP, color=rgb)


def default_middle_left(month: int) -> tuple[str, ...]:
    m = f"{month}月"
    return (
        f"「{m}の様子」",
        f"{m}の学級・クラブ活動の様子です。",
        "子どもたちは元気に活動しています。",
    )


def default_middle_right(month: int) -> tuple[str, ...]:
    m = f"{month}月"
    return (
        f"「{m}のお知らせ」",
        "詳細は担任までお問い合わせください。",
        "学級だよりもあわせてご覧ください。",
    )


def render_newsletter(output: Path, era_key: str, issue: int, extra: str | None = None) -> None:
    blank = ensure_blank_template()
    doc = fitz.open(str(blank))
    page = doc[0]

    era_label, year, month, day = issue_date_parts(era_key, issue)
    month_name = f"{month}月"

    # 右欄ヘッダ（テンプレート y≈215）
    vtext(page, HDR_ISSUE_X, HDR_Y, f"第{issue}号", size=HDR_SIZE, gap=9.0)
    vtext(page, HDR_DATE_X, HDR_Y, f"{era_label}年{month}月{day}日", size=HDR_SIZE, gap=9.0)
    vtext(page, HDR_SCHOOL_X, HDR_Y, SCHOOL, size=HDR_SIZE, gap=9.0)
    vtext(page, HDR_PRINCIPAL_X, HDR_Y, f"校長{PRINCIPAL_NAME}", size=HDR_SIZE, gap=9.0)

    # 校長メッセージ（上段・縦書き列）
    headline = HEADLINE.get(month, "ごあいさつ")
    vtext(page, PRINCIPAL_COL_X0, PRINCIPAL_Y, headline, size=PRINCIPAL_SIZE, gap=PRINCIPAL_GAP)
    body = extra or PRINCIPAL_BODY[month]
    wrap_vertical_columns(
        page,
        body,
        PRINCIPAL_COL_X0 + PRINCIPAL_COL_STEP,
        PRINCIPAL_Y,
        x_step=PRINCIPAL_COL_STEP,
        cols=PRINCIPAL_COLS - 1,
        size=PRINCIPAL_SIZE,
        gap=PRINCIPAL_GAP,
    )

    # 生活目標（緑帯・縦書き）
    goal = LIFE_GOALS[month]
    vtext(
        page,
        LIFE_GOAL_X,
        LIFE_GOAL_Y,
        f"{month_name}の生活目標「{goal}」",
        size=LIFE_GOAL_SIZE,
        gap=LIFE_GOAL_GAP,
    )

    # 中段左
    left_lines = MIDDLE_LEFT.get(month, default_middle_left(month))
    for i, line in enumerate(left_lines):
        vtext(page, MID_LEFT_X + i * MID_COL_STEP, MID_LEFT_Y, line, size=MID_SIZE, gap=MID_GAP)

    # 中段右（タイトル＋本文列）
    right_lines = MIDDLE_RIGHT.get(month, default_middle_right(month))
    if right_lines:
        title = right_lines[0]
        vtext(page, MID_CENTER_X, MID_CENTER_Y, title, size=MID_TITLE_SIZE, gap=12.0)
        for i, line in enumerate(right_lines[1:]):
            vtext(page, MID_RIGHT_X + i * MID_COL_STEP, MID_RIGHT_Y, line, size=MID_SIZE, gap=MID_GAP)
        if len(right_lines) > 3:
            for i, line in enumerate(right_lines[3:6]):
                vtext(page, MID_EXTRA_X + i * MID_COL_STEP, MID_EXTRA_Y, line, size=MID_SIZE, gap=MID_GAP)

    # 行事予定タイトル（横書き）
    htext(page, CAL_TITLE_X, CAL_TITLE_Y, f"{month_name}の行事予定", size=CAL_TITLE_SIZE)

    render_calendar(page, year, month)

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
