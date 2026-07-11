# ARadhana — LaTeX Documentation Template

Template only — every section is a placeholder marked with red `[TODO: …]`
tags. Content gets ported from the markdown base in `docs/*.md`; each section
file has a `% Port from:` comment naming its source file.

Typeset in **Linux Libertine / Biolinum** — the same typefaces the ACM
`acmart` class (ACM COMPASS proceedings) uses. The `.otf` files are vendored
in `fonts/`, so no TeX font packages are required — but the build must use
**XeLaTeX** (not pdflatex), which loads them via `fontspec`.

## Build

```bash
cd docs/latex
xelatex main && bibtex main && xelatex main && xelatex main
```

(or `latexmk -xelatex main` if latexmk is installed). Output: `main.pdf`.

## Layout

```
main.tex                 preamble, title page, section includes
references.bib           bibliography (ieeetr style)
figures/                 drop images here (\graphicspath is set)
sections/
  01-introduction        ← docs/01_overview.md
  02-problem-statement   ← WRITE FRESH (the auto-generated draft was rejected)
  03-objectives
  04-market-analysis     ← docs/02_market_analysis.md
  05-design-thinking     ← docs/03_design_thinking.md
  06-system-architecture ← docs/04_system_architecture.md
  07-database-schemas    ← docs/05_database_schemas.md
  08-gamification-engine ← docs/09_gamification_engine.md
  09-ar-pathfinder       ← docs/10_ar_pathfinder.md
  10-tech-stack          ← docs/08_packages.md
  11-results
  12-limitations-future-work
  13-conclusion
  appendix-a-api-reference   ← docs/06_api_reference.md
  appendix-b-folder-structure ← docs/07_folder_architecture.md
```

## Conveniences defined in the preamble

- `\todo{...}` — red inline TODO marker (search for these before submitting)
- `\code{...}` — inline monospace
- `\apiroute{GET}{/api/...}` — styled endpoint reference
- `lstlisting` with `language=json` for schema/API payload examples
- Brand colors: `orchidcrimson` (#DC143C) and `orchidnavy` (#003893)
