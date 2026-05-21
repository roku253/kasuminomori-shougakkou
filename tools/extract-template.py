#!/usr/bin/env python3
import fitz
from pathlib import Path

REF = Path(r"c:\Users\roku5\Downloads\gakkou01word2000.pdf")
OUT = Path(__file__).resolve().parents[1] / "assets" / "pdf-template"
OUT.mkdir(exist_ok=True)

doc = fitz.open(str(REF))
page = doc[0]
for i, img in enumerate(page.get_images()):
    xref = img[0]
    pix = fitz.Pixmap(doc, xref)
    if pix.n - pix.alpha > 3:
        pix = fitz.Pixmap(fitz.csRGB, pix)
    pix.save(str(OUT / f"img{i}.png"))

pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
pix.save(str(OUT / "reference-page.png"))

with open(OUT / "drawings.txt", "w", encoding="utf-8") as f:
    for d in page.get_drawings():
        r = d["rect"]
        f.write(f"rect {r.x0:.2f},{r.y0:.2f},{r.x1:.2f},{r.y1:.2f} fill={d.get('fill')} color={d.get('color')}\n")

print("saved to", OUT)
