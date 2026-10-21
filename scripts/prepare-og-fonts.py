#!/usr/bin/env python3
"""Maintainer-only: derive offline OG fonts with FontTools 4.60.2 + Brotli.
Usage: python scripts/prepare-og-fonts.py --noto-source /path/NotoSerifSC-variable.ttf
Source blob and licenses: CREDITS.md. Theme users do not run this script.
"""
import argparse
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset

parser = argparse.ArgumentParser()
parser.add_argument('--noto-source', required=True, type=Path)
args = parser.parse_args()
root = Path(__file__).resolve().parent.parent
sources = [
    (root / 'assets/fonts/newsreader-latin-var.woff2', 'newsreader-400.ttf', {'wght': 400, 'opsz': 72}),
    (args.noto_source, 'noto-serif-sc-400.ttf', {'wght': 400}),
]
for source, name, axes in sources:
    font = TTFont(source)
    font.flavor = None
    instantiateVariableFont(font, axes, inplace=True)
    options = subset.Options()
    options.hinting = False
    options.layout_features = ['kern']
    options.name_IDs = ['*']
    reducer = subset.Subsetter(options=options)
    reducer.populate(unicodes=font.getBestCmap().keys())
    reducer.subset(font)
    target = root / 'assets/fonts/og' / name
    target.parent.mkdir(parents=True, exist_ok=True)
    font.save(target)
    print(target)
