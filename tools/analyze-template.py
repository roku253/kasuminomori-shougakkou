#!/usr/bin/env python3
import fitz

doc = fitz.open(r"c:\Users\roku5\Downloads\gakkou01word2000.pdf")
page = doc[0]
for i, img in enumerate(page.get_images(full=True)):
    print("image", i, "bbox", page.get_image_bbox(img))

# key text search
for term in ["学校だより", "第十号", "学び", "一月", "生活目標", "行事予定", "年頭"]:
    hits = page.search_for(term)
    print(term, hits)
