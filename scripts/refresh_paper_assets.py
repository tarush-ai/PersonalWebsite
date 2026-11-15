#!/usr/bin/env python3
"""build_site.py — refresh the data, PDFs and figure inside the standalone project page site/fittingcorpus/.

    python3 scripts/refresh_paper_assets.py --source /path/to/fittingcorpus-research

site/fittingcorpus/ is a self-contained static page (index.html + static/). Copy the folder anywhere and
open index.html: every path is relative, the data are inlined in static/js/data.js (no fetch, so it
also works from file://), and nothing loads from a CDN.

WHERE THE NUMBERS COME FROM. Every number the charts draw is parsed from the paper's own generated
tables, paper/tables_audit.tex (which paper/tools/make_audit_tables.py writes from results/ at build
time), so the page can never disagree with the paper it presents:
    grid       Table "tab:grid"     the 8x8 fit x read readout scores under any-layer recovery
    contain    Table "tab:contain"   32-gram containment per fitting corpus
    ladder     Table "tab:ladder"    R and Kendall tau per family at 410M, 1B, 1.4B, 2.8B
    variance   Table "tab:variance" variance shares of the grid, both recovery rules
The handful of numbers quoted in prose in index.html (0.989, 22.7, 0.78, 2.46, ...) are quoted from
the paper's text and are not regenerated here.

This also copies paper/audit_paper_extended.pdf and paper/audit_paper_5pp.pdf into static/pdf/ and
converts figures/fig1_pipeline.pdf to static/img/pipeline.svg (needs poppler's pdftocairo).

WHAT THIS DOES NOT COVER. It does not rebuild the paper; run paper/build_audit.sh first if the paper
changed. It does not check the prose numbers in index.html against the paper.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, "site", "fittingcorpus")
TABLES = ""


def table_rows(tex: str, label: str) -> list[list[str]]:
    """The data rows of the tabular in the table carrying `label`, split on '&', LaTeX stripped."""
    i = tex.find(r"\label{%s}" % label)
    if i < 0:
        sys.exit(f"table {label} not found in {TABLES}")
    start = tex.rfind(r"\begin{table}", 0, i)
    end = tex.find(r"\end{table}", i)
    body = tex[start:end]
    body = body[body.find(r"\midrule"):body.rfind(r"\bottomrule")]
    rows = []
    for line in body.split("\\\\"):
        line = line.replace(r"\midrule", "").strip()
        if not line or "&" not in line:
            continue
        cells = [re.sub(r"\\textbf\{([^}]*)\}", r"\1", c).strip() for c in line.split("&")]
        rows.append(cells)
    return rows


def num(s: str) -> float:
    return float(s.replace("$", "").replace("{-}", "-").replace("+", ""))


def main() -> int:
    global ROOT, TABLES
    parser = argparse.ArgumentParser(description="Refresh paper assets from the research checkout; not required to deploy.")
    parser.add_argument("--source", required=True, help="Research checkout containing paper/ and figures/")
    args = parser.parse_args()
    ROOT = os.path.abspath(args.source)
    TABLES = os.path.join(ROOT, "paper", "tables_audit.tex")
    required = [TABLES, os.path.join(ROOT, "paper", "audit_paper_extended.pdf"),
                os.path.join(ROOT, "paper", "audit_paper_5pp.pdf"),
                os.path.join(ROOT, "figures", "fig1_pipeline.pdf")]
    missing = [path for path in required if not os.path.isfile(path)]
    if missing:
        parser.error("Missing research assets: " + ", ".join(missing))
    if not shutil.which("pdftocairo"):
        parser.error("pdftocairo is required to refresh the pipeline figure")
    tex = open(TABLES).read()

    # --- the 8x8 grid (any-layer), with the paper's own row and column means ---
    grid_rows = table_rows(tex, "tab:grid")
    header = re.search(r"\\cmidrule\(lr\)\{2-9\}\s*&([^\\]*)\\\\", tex[tex.find(r"\label{tab:grid}"):])
    reads = [c.strip() for c in header.group(1).split("&")][:8]
    fits, cells, row_mean, col_mean = [], [], [], []
    for r in grid_rows:
        if r[0] == "Mean":
            col_mean = [num(x) for x in r[1:9]]
            continue
        fits.append(r[0])
        cells.append([num(x) for x in r[1:9]])
        row_mean.append(num(r[9]))
    assert len(fits) == 8 and len(reads) == 8 and len(col_mean) == 8, (fits, reads, col_mean)

    # --- containment ---
    contain = {r[0]: {"group": r[1], "containment": num(r[2])} for r in table_rows(tex, "tab:contain")}

    # --- the ladder ---
    ladder = []
    for r in table_rows(tex, "tab:ladder"):
        if r[0] in ("", "Family") or r[0].startswith(r"\emph") or not re.match(r"^[A-Z]", r[0]):
            continue
        if not re.match(r"^\d+$", r[1]):
            continue
        ladder.append({"family": r[0], "pairs": int(r[1]),
                       "R": {"410M": num(r[2]), "1B": num(r[3]), "1.4B": num(r[4]), "2.8B": num(r[5])},
                       "tau": {"1B": num(r[6]), "1.4B": num(r[7]), "2.8B": num(r[8])}})
    assert len(ladder) == 5, ladder

    # --- variance shares ---
    variance = {}
    for r in table_rows(tex, "tab:variance"):
        def ci(s):
            m = re.match(r"\s*([-+\d.]+)\s*\[\s*([-+\d.]+),\s*([-+\d.]+)\]", s)
            return {"point": num(m.group(1)), "lo": num(m.group(2)), "hi": num(m.group(3))}
        variance[r[0]] = {"fit": ci(r[1]), "read": ci(r[2]), "residual": num(r[3]),
                          "fit_minus_read": ci(r[4]), "excludes_zero": r[5].strip() == "Yes"}
    assert set(variance) == {"Any-layer", "Majority-layer"}, variance

    # --- the unfitted logit lens, any-layer (Table crossover's last row; the floor of Fig. 2's scale) ---
    logit = [r for r in table_rows(tex, "tab:crossover") if r[0].startswith("Logit lens")]
    assert len(logit) == 1, logit
    logit_any = num(logit[0][1])

    data = {
        "source": "paper/tables_audit.tex (generated from results/ by paper/tools/make_audit_tables.py)",
        "logit_lens_any_layer": logit_any,
        "grid": {"fits": fits, "reads": reads, "cells": cells, "row_mean": row_mean, "col_mean": col_mean,
                 "after_pile": ["News 2024", "arXiv 2023", "Common Pile"]},
        "contain": contain,
        "ladder": ladder,
        "variance": variance,
    }
    js = ("// Generated by scripts/refresh_paper_assets.py from the paper's tables. Do not edit by hand.\n"
          "window.FC_DATA = " + json.dumps(data, indent=1) + ";\n")
    os.makedirs(os.path.join(OUT, "static", "js"), exist_ok=True)
    open(os.path.join(OUT, "static", "js", "data.js"), "w").write(js)

    os.makedirs(os.path.join(OUT, "static", "pdf"), exist_ok=True)
    shutil.copy2(os.path.join(ROOT, "paper", "audit_paper_extended.pdf"),
                 os.path.join(OUT, "static", "pdf", "fittingcorpus-extended.pdf"))
    shutil.copy2(os.path.join(ROOT, "paper", "audit_paper_5pp.pdf"),
                 os.path.join(OUT, "static", "pdf", "fittingcorpus-workshop.pdf"))
    os.makedirs(os.path.join(OUT, "static", "img"), exist_ok=True)
    subprocess.run(["pdftocairo", "-svg", os.path.join(ROOT, "figures", "fig1_pipeline.pdf"),
                    os.path.join(OUT, "static", "img", "pipeline.svg")], check=True)

    print(f"grid: {len(fits)}x{len(reads)}; row means {min(row_mean):.2f}-{max(row_mean):.2f} "
          f"(GitHub {row_mean[fits.index('GitHub')]:.2f}, StackExchange {row_mean[fits.index('StackExchange')]:.2f})")
    print(f"contain: {len(contain)} corpora; ladder: {len(ladder)} families; variance: "
          f"any-layer fit {variance['Any-layer']['fit']['point']}%")
    print(f"wrote {OUT}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
