#!/usr/bin/env python3
import fitz
from pathlib import Path

REF = Path(r"c:\Users\roku5\Downloads\gakkou01word2000.pdf")
OUT = Path(__file__).resolve().parents[1] / "assets" / "pdf" / "_template-test.pdf"

doc = fitz.open(str(REF))
page = doc[0]

# Redact all text spans
blocks = page.get_text("dict")["blocks"]
for b in blocks:
    if b["type"] != 0:
        continue
    for line in b["lines"]:
        for sp in line["spans"]:
            r = fitz.Rect(sp["bbox"])
            r = r + (-1, -1, 1, 1)
            page.add_redact_annot(r, fill=(1, 1, 1))

page.apply_redactions()

# Insert sample vertical title
page.insert_text((520, 750), "霞ノ杜市立霞ノ杜小学校", fontsize=9, fontname="japan")

doc.save(str(OUT))
print("saved", OUT)
