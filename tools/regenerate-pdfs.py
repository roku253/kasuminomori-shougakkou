#!/usr/bin/env python3
"""Generate styled PDFs — run generate-pdf-documents.py."""
import runpy
from pathlib import Path

if __name__ == "__main__":
    runpy.run_path(str(Path(__file__).with_name("generate-pdf-documents.py")), run_name="__main__")
