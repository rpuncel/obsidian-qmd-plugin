# SPDD Analysis: Quarto Markdown Support in Obsidian Plugin

## Original Business Requirement

this repository is an attempt to support Quarto's markdown in Obsidian via a plugin. It does not necessarily work.

The idea is to use obsidian as a live editor that supports as many of quarto's markdown extensions as is reasonable. If live editor support isn't feasible technically, then at least supporting obsidian's preview mode should be possible

---

## Domain Concept Identification

### Existing Concepts (from codebase)

- **Plugin** (main.ts): The Obsidian plugin entry point — owns registration of all extension mechanisms; currently scaffolded from the Obsidian sample template with significant placeholder boilerplate (ribbon icon, sample commands, demo intervals)
- **MarkdownPostProcessor** (main.ts + colonfence.ts): Obsidian's preview/reading-mode extension point — receives rendered HTML chunks and allows DOM mutation; currently used for a broken `:::` colon-fence detector and a `:emoji:` inline replacer
- **EditorExtension / StateField** (statefield.ts): CodeMirror 6 extension point for live-preview (editing) mode — currently contains an `emojiListField` StateField that iterates lines looking for `:::` but has a syntax error and produces no decorations
- **MatchDecorator / ViewPlugin** (matchdecorator.ts): CodeMirror 6 pattern-matching decorator that replaces `[[word]]` ranges with a widget — implemented but **not registered** in main.ts; serves as a demonstration of the live-editor widget pattern
- **EmojiWidget** (emoji.ts): A CodeMirror `WidgetType` stub that renders a hard-coded 👉 emoji — imported by statefield.ts but never actually used in decorations

### New Concepts Required

- **QuartoDiv**: The `:::` colon-fence block construct (Quarto's primary mechanism for divs); governs callouts, columns, tabsets, and arbitrary classed divs — must be parsed and rendered in both preview mode and live editor
- **CalloutBlock**: A visual rendering of `.callout-note`, `.callout-warning`, `.callout-important`, `.callout-tip`, `.callout-caution` divs — styled boxes with title, icon, and body; a specialization of QuartoDiv
- **Tabset**: A rendering of `::: {.panel-tabset}` divs — interactive tabs rendered from heading-delimited sections inside the fence; a specialization of QuartoDiv
- **Shortcode**: Quarto's `{{< shortcode arg >}}` inline syntax — inline replacements (e.g., `{{< video url >}}`, `{{< include file >}}`); requires live-editor inline decoration or preview post-processing
- **ExecutableCodeChunk**: Code fences with execution language specifiers (` ```{r}`, ` ```{python}`, ` ```{julia}`) — distinguished from ordinary code fences by curly-brace language ids; Obsidian renders these as plain code blocks, so visual distinction requires post-processing or live decoration
- **CrossReference**: `@fig-`, `@tbl-`, `@eq-`, `@sec-` inline citation-style references — need to be visually flagged or resolved in the editor

### Key Business Rules

- **Preview-first fallback**: If live-editor rendering is not feasible for a given construct, preview/reading mode support is the minimum acceptable bar — the requirement explicitly permits this degraded mode
- **Quarto's `:::` is not standard Markdown**: Obsidian's built-in Markdown renderer does not understand colon fences; they arrive at the post-processor as raw `<p>` nodes containing `:::` text, not as structured blocks
- **Obsidian post-processor chunking**: Obsidian invokes post-processors on sub-sections of the document, not the full document — multi-paragraph constructs like colon-fence divs that span chunks require special handling
- **Live-editor extensions must be CodeMirror 6**: Obsidian's live preview mode is built on CodeMirror 6; any live-editor behavior must be implemented as a CM6 `Extension` (StateField, ViewPlugin, or MatchDecorator)
- **Non-destructive rendering**: The plugin must not alter the underlying `.md` file content — all rendering is decorative overlay only
- **Graceful degradation**: For Quarto constructs that cannot be meaningfully rendered (e.g., full tabset interactivity), the plugin should at minimum provide visual recognition (e.g., a styled border or label) rather than leaving raw `:::` text

---

## Strategic Approach

### Solution Direction

- Implement Quarto construct support using Obsidian's two complementary extension points: `registerMarkdownPostProcessor` for preview/reading mode and `registerEditorExtension` (CodeMirror 6) for live-preview mode
- Prioritize constructs by value and feasibility: colon-fence divs (highest value, core Quarto primitive) → callout blocks (high value, visually distinctive) → shortcodes → executable code chunk markers → cross-references
- Establish a clean plugin architecture first by removing sample-template boilerplate from main.ts, then add Quarto-specific processors incrementally
- Fix existing broken implementations (statefield.ts syntax error, colonfence.ts null-dereference) before building on them

### Key Design Decisions

- **Preview-mode colon-fence reconstruction strategy**: Obsidian renders `:::` lines as plain `<p>` tags — the post-processor must walk the DOM to find opening `:::` paragraphs, collect subsequent siblings until the closing `:::`, and wrap them in a styled `<div>` — trade-off: this is brittle against Obsidian's chunking behavior but is the only viable preview-mode approach → **recommended**: implement with awareness of chunking limits, document known gaps
- **Live-editor decoration approach**: Two options exist — (a) `MatchDecorator` (simpler, pattern-based, single-line) or (b) `StateField` with full line iteration (more powerful, can handle multiline). For colon fences, a `StateField` with line-by-line scanning is necessary since fences span multiple lines → **recommended**: `StateField` for block constructs (colon fences, code chunks), `MatchDecorator` or `ViewPlugin` for inline constructs (shortcodes, cross-references)
- **Attribute parsing for `:::` divs**: Quarto fences carry attributes like `{.callout-note title="My Note"}` — the plugin must parse these to determine rendering type. A lightweight regex-based attribute parser is sufficient given the constrained syntax → **recommended**: targeted regex, not a full parser
- **Scope of Quarto feature support**: Full Quarto parity is not feasible (execution, cross-reference resolution, bibliography) — the plugin should focus on structural/visual rendering only → **recommended**: explicitly document unsupported features; focus on callouts and colon-fence divs as V1
- **Template boilerplate removal**: The current main.ts contains sample-plugin artifacts (ribbon icon, sample modal, status bar text, demo click/interval handlers) that are unrelated to Quarto support → **recommended**: remove all boilerplate as a prerequisite step to reduce confusion

### Alternatives Considered

- **Remark/unified-based Markdown preprocessing**: Using a full Markdown AST parser (like remark with Quarto plugins) to pre-process `.qmd` files before Obsidian renders them — rejected because Obsidian's plugin API does not offer a Markdown-source-level intercept point; the post-processor only receives rendered HTML
- **Custom `.qmd` file type with a full custom renderer**: Registering a new view type for `.qmd` files that bypasses Obsidian's Markdown renderer entirely — rejected because it loses all of Obsidian's Markdown rendering for free (links, embeds, tables) and creates significant maintenance burden
- **Server-side Quarto rendering with iframe embed**: Running a local Quarto server and embedding rendered output — rejected because it requires external tooling, breaks offline use, and is outside the plugin's stated scope

---

## Risk & Gap Analysis

### Requirement Ambiguities

- **"As many of Quarto's markdown extensions as is reasonable"**: No prioritization or specific list of Quarto features is given — the scope is open-ended. Need to establish a concrete V1 feature list (e.g., callouts, colon-fence divs, shortcode markers) vs. deferred features (execution, cross-reference resolution, bibliography)
- **"Live editor support"**: It is unclear whether this means full live-preview rendering (replacing `:::` with styled boxes while typing) or just syntax highlighting / visual cuing while in edit mode — these have very different complexity profiles
- **"Obsidian's preview mode"**: Obsidian has both "Reading View" (full post-processing) and "Live Preview" (CodeMirror-based, partial post-processing) — which is the minimum acceptable bar?
- **"Does not necessarily work"**: The current codebase has known bugs (syntax error in statefield.ts, null-dereference in colonfence.ts) — it is unclear whether fixing these is in scope or whether a ground-up rebuild is preferred

### Edge Cases

- **Nested colon fences**: Quarto supports nested `:::` divs (e.g., columns inside a tabset) — the preview-mode DOM walk must handle nesting depth correctly
- **`:::` attributes on the same line vs. next line**: Quarto allows `:::{.classname}` (no space) and `::: {.classname}` (with space) — the parser must handle both
- **Colon fences crossing post-processor chunk boundaries**: If Obsidian splits the document into chunks at a paragraph inside a `:::` fence, the opening and closing `:::` may arrive in separate post-processor calls — this case may be unhandleable in preview mode
- **Quarto code chunk options as YAML comments**: ` ```{python}` blocks may contain `#| option: value` comment lines — these should arguably be styled differently from code body, but this is advanced
- **Callout fold state**: Quarto callouts can be collapsible (`collapse="true"`) — implementing toggle behavior in preview mode requires JavaScript event wiring, not just DOM restructuring
- **Whitespace and blank-line sensitivity**: The `:::` fence closing must be on its own line; extra content on the closing line may or may not be tolerated by different Quarto versions

### Technical Risks

- **statefield.ts syntax error**: The current `update` function has a dangling `}` after the `iterChanges` callback (lines 29–31) that does not match an opening brace — the file as written will not compile. This must be fixed before any live-editor work can proceed
- **colonfence.ts null-dereference**: `elem.find("p")` returns `null` when the div has no `<p>` child; calling `.innerText` on null throws at runtime. Must guard against null
- **Post-processor chunking is underdocumented**: Obsidian's chunking strategy is not officially documented — behavior may change across Obsidian versions, making multi-paragraph construct detection fragile
- **CodeMirror 6 StateField complexity for multiline blocks**: Building a StateField that correctly tracks nested `:::` blocks across lines — with incremental updates on edit — is non-trivial; incorrect range management causes visual artifacts or crashes
- **No test infrastructure**: The project has zero test tooling — all validation is manual Obsidian reload/test. Adding even a lightweight unit test harness for the DOM manipulation and string parsing logic would significantly reduce risk
- **Obsidian API stability**: The plugin targets `minAppVersion: 0.15.0` but uses `obsidian: latest` in devDependencies — breaking API changes across Obsidian versions are a deployment risk

### Acceptance Criteria Coverage

No formal acceptance criteria were provided in the business requirement. The following are inferred from the stated intent:

| AC# | Description | Addressable? | Gaps/Notes |
|-----|-------------|--------------|------------|
| 1 | Quarto colon-fence divs (`:::`) render visually in preview/reading mode | Yes | Requires fixing colonfence.ts null bug + robust DOM reconstruction; chunking edge case may leave gaps |
| 2 | Callout blocks (`.callout-note`, `.callout-warning`, etc.) render with appropriate styling in preview mode | Yes | Requires CSS in styles.css + attribute parsing |
| 3 | Live-editor (edit mode) shows visual indication of colon-fence blocks | Partial | Requires fixing statefield.ts syntax error + implementing actual decorations; full block widgets are complex |
| 4 | Shortcode syntax (`{{< >}}`) is visually recognized | Yes | Straightforward MatchDecorator or ViewPlugin; rendering content is out of scope |
| 5 | Executable code chunks (` ```{r}`, ` ```{python}`) are visually distinguished | Yes | Post-processor can add a class/badge; execution is out of scope |
| 6 | Plugin does not corrupt or alter underlying `.md`/`.qmd` file content | Yes | Both extension points are read-only by design |
| 7 | Plugin loads and unloads cleanly in Obsidian without errors | Partial | Requires fixing compile errors in statefield.ts before the plugin can load at all |
