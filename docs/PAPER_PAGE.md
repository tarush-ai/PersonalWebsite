# Paper page

`site/fittingcorpus/` is the current, self-contained public paper page. Both
`/fittingcorpus/` and `/research/fittingcorpus/` serve it. HTML references remain
relative to the folder, so the folder can also be hosted separately.

The previous root-level paper page is preserved locally in
`.local-review/archive/fittingcorpus-previous/` and is not deployed.

## Optional data refresh

Deployment uses the checked-in PDFs, figure and data.js; no rebuild is required.
To refresh them from the separate research repository:

```sh
python3 scripts/refresh_paper_assets.py --source /absolute/path/to/research-checkout
```

That checkout must contain `paper/tables_audit.tex`, `paper/audit_paper_extended.pdf`,
`paper/audit_paper_5pp.pdf`, and `figures/fig1_pipeline.pdf`. Install Poppler for
`pdftocairo`. The script checks these inputs before writing output.

It regenerates chart data and copies PDFs/figure. It does not rebuild the paper or
validate numeric claims embedded in the HTML prose. Review those after a paper change.
