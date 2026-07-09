# Redesign brief: tarush.ai

## Context

This is a personal portfolio site whose defining feature is a **terminal interface** — visitors can navigate via `cd`-style commands and there's a boot sequence on load. Preserve that structure and metaphor completely. The problem is execution, not concept: the current build layers "movie-hacker" theatrics on top of the terminal idea (glow effects, flicker animations, "INITIALIZING PORTFOLIO_V3" boot spam, neon-green-on-black, emoji section headers, badge shields). The job is to keep the terminal navigation and boot-in experience while re-executing it with the discipline of an **actual, well-configured shell** — monospace, restrained, quiet, authentic to the metaphor rather than performing "hacker" on top of it.

**Do not change site content or copy** except the edits in the Content section below. Every existing project, description, section, and the AureliusGPT writeup stays. Where I haven't flagged content for change, leave it exactly as-is.

## Design principle (the whole thing in one line)

A real terminal earns its aesthetic through authenticity, not decoration. It's monospace, near-monochrome, and silent — it doesn't flicker, glow, or announce itself. Every choice should answer "would a genuinely well-configured shell (think a tasteful Starship/Powerlevel10k `.zshrc`) do this?" If the answer is no, cut it.

## What to remove (the "vibe-coded" tells)

- **All glow / text-shadow / flicker / scanline / CRT effects.** A modern terminal emulator renders crisp text. No blur, no pulsing, no screen-flicker.
- **The neon-green-on-pure-black palette.** Replace per the color spec below.
- **Boot-sequence theatrics** — anything like "INITIALIZING PORTFOLIO_V3," progress bars for show, fake loading spam. Keep a boot sequence, but make it a *real* terse startup log (see Motion spec).
- **Emoji in headings, section markers, and command output** (💼 💡 💻 🚀 📖 ⚠️ 🎯 👥 etc.). Terminals don't emoji their section headers. Remove all of them.
- **The vanity metrics** — "76 Subscribers," "5K Views," "Citadel Visits," "∞ Ideas Brewing." Cut this block entirely. Replace it with something a terminal actually shows: a clean `whoami` / status readout (name, role, location, current focus). A shell doesn't brag, and small counts read as weaker than no counts.
- **shields.io badge images** (the GitHub/HuggingFace/tech-stack shields). Replace with plain text links in the accent color.
- **"Coming Soon" / 🚧 placeholders.** Keep the commands, but have them return a real terse terminal response instead of a construction emoji (e.g. `ideas: no public entries yet` or a one-line message). Ships as intentional, not abandoned.

## What to preserve

- The terminal **navigation model**: typed commands, `cd <section>`, command input line, the sense of entering the site through a shell.
- The **boot-in on load** (re-executed, not removed).
- **Dark theme** as the default/primary (it fits the terminal — just warm-dark, not pure black).
- All existing **copy, projects, sections, and the full AureliusGPT technical writeup**.
- The "citadel" personal line if it exists in copy — keep it, just don't let it drive the visual theme.

## Content changes (the only ones)

Under the internships/experience section, the two lead portfolio entries should be:

1. **AI Research Scientist at Cisco** — description: **"Building the bridge to possible."**
2. **AI Research @ Dyssonance AI** — description: **"Building the next generation of AI memory systems."**

Both listed under internships. No other content edits.

## Typography

- **Single monospace family**, done well. Use a high-quality mono, not the system default: **Berkeley Mono** (if licensed), or free options **JetBrains Mono**, **IBM Plex Mono**, or **Commit Mono**. Pick one and use it everywhere. The discipline of true-mono-everywhere is what sells the authenticity.
- Set a real type scale — don't render everything at one size. Prompt/command lines, headings, body, and meta should have distinct sizes and weights (e.g. body ~15–16px, headings via weight and size, meta ~13px muted). Comfortable line-height (~1.6) for the prose/writeup sections so long-form reading (AureliusGPT) is pleasant.
- Left-aligned, ragged right. Generous line-height in prose blocks.

## Color & surface

Near-monochrome, warm-dark, one restrained accent. Draw from a respected terminal scheme's discipline rather than "hacker green."

- **Background:** warm near-black, not `#000`. e.g. `#16130F` / `#1A1815` (a warm charcoal, slight brown/warm cast reads more considered than cold black).
- **Foreground text:** warm off-white, not `#FFF`. e.g. `#E8E4DB`.
- **Muted / secondary** (paths, timestamps, meta, comments): `#8A857C`.
- **One accent**, used sparingly — for the prompt symbol, active command, links, one hover state. Choose a serious, non-neon tone: a warm amber `#D9A441`, or a muted classic terminal amber/gold, or a deep-but-not-neon cyan-slate. Given the warm-dark base, **amber/gold** is the natural, tasteful choice and evokes vintage-terminal without the neon. Avoid pure `#0F0` green, cyan, magenta.
- **Prompt color-coding** is authentic and welcome (e.g. accent-colored prompt symbol, muted path, default-color command) — that's what real shells do. Just keep it to 2–3 colors total.
- Optionally offer a light theme toggle (keep if it exists), but dark is primary.

## Motion (deliberate, mechanical, minimal)

- **Boot sequence on load:** a short, *real*-feeling startup log — a few lines that resolve quickly (mounting/loading in terse shell language), then the prompt appears. Terse and fast (well under ~1.5s total), not a performance. No progress bars for decoration. Think "a fast shell starting," not "a computer being hacked in a film."
- **Cursor:** a single steady block/beam cursor with a normal blink. No flicker on anything else.
- **Command execution:** when a `cd`/command runs, output appears cleanly (a quick fade or instant print) — no typing-animation gimmickry required, and definitely no glitch/scramble effects.
- **Respect `prefers-reduced-motion`:** skip the boot animation and cursor blink, render final state immediately.

## Layout & structure

- Constrain the content to a comfortable reading measure (terminal-appropriate width, not edge-to-edge full-bleed text). Generous margins/padding around the terminal frame.
- The terminal can be the whole viewport or a framed "window" — either is fine, but if framed, keep the window chrome minimal and real-looking (subtle, not a skeuomorphic toy). No heavy shadows or glassmorphism.
- **Navigation:** commands remain the primary nav. Consider also making section names clickable (accessibility + people who won't type) that simply run the corresponding command — but the typed path stays first-class.
- **Sections** (preserve existing set): home/whoami, work/projects, the AureliusGPT deep-dive, experience/internships (with the two updated entries), writing/podcast if present, ideas, contact. Keep whatever exists now; just restyle.

## The AureliusGPT writeup specifically

This is the site's strongest asset — treat it as a *reading experience* inside the terminal frame:
- Remove emoji section markers and shields.io badges; replace badges with plain accent-colored text links to GitHub / HuggingFace.
- Set the prose in the mono body size with comfortable line-height (~1.6–1.7) so it's genuinely readable at length.
- Code/architecture blocks on a subtly differentiated surface (a touch lighter/darker than the page bg) with a hairline border — no heavy chrome.
- A small typeset "spec sheet" (params: 845K · corpus: ~89K tokens · arch: PostNorm blocks · etc.) reads well as a clean aligned block — set it, don't badge it.

## Overall design mandate

Beyond removing the tells, actively push this toward genuine taste — the goal is a site that a discerning designer or senior engineer would look at and register as *considered*. Within the terminal frame, that means precision over flash: exact vertical rhythm and consistent spacing units, careful optical alignment of the prompt/columns/spec blocks, deliberate use of the muted color for hierarchy, and restraint everywhere the eye isn't meant to land. The terminal metaphor is the personality; don't add a second one. Spend all the boldness on executing this one idea impeccably, and keep everything else quiet. When a choice is between "more" and "cleaner," pick cleaner.

## Quality floor (non-negotiable)

- Fully responsive down to mobile (the terminal must be usable and legible on a phone — command input included).
- Visible keyboard focus states; the command input and any clickable nav must be keyboard-navigable.
- `prefers-reduced-motion` respected (boot + blink disabled, final state shown).
- Semantic HTML; real links for navigation where possible so it's crawlable and accessible, not purely JS-driven.
- No layout shift on boot completion.

## Before finishing

1. **Serve it on localhost** (e.g. a local dev/static server) and confirm it actually renders and runs — boot sequence completes, commands navigate correctly, every section resolves, no console errors. Give me the local URL so I can open and verify it myself.
2. **Screenshot the result** and self-critique: does this look like a real, tastefully configured terminal that a serious engineer actually uses — or like a "hacker terminal" from a movie? If any element is doing personality work through *decoration* (glow, flicker, emoji, neon, badges) rather than through *typographic and structural discipline*, cut it. Chanel rule: remove one accessory before shipping.