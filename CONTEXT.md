# Domain Context: obsidian-qmd-plugin

An Obsidian plugin that provides visual rendering support for Quarto markdown extensions, enabling authors to write Quarto-flavored `.md`/`.qmd` documents inside Obsidian without losing readability.

---

## Glossary

### Core domain concepts

**Quarto**
A scientific and technical document format built on Pandoc that extends standard Markdown with constructs like colon-fence divs, shortcodes, executable code chunks, and cross-references. This plugin renders those extensions visually inside Obsidian.

**QMD / `.qmd`**
The file extension used by Quarto documents. The plugin treats `.qmd` and `.md` files identically — Obsidian renders them both as Markdown; the plugin post-processes the output.

**Obsidian**
The host editor. The plugin integrates via two complementary Obsidian extension points: `registerMarkdownPostProcessor` (Reading View) and `registerEditorExtension` (live-editor mode).

---

### Obsidian rendering modes

**Reading View**
Obsidian's fully-rendered preview mode. Post-processors run here, receiving rendered HTML from Obsidian's Markdown engine. Also called "preview mode" in Obsidian docs — prefer "Reading View" in this codebase to avoid ambiguity.

**Live-editor mode**
Obsidian's CodeMirror 6–based editing mode where the user edits source text and sees live decorations. Must be implemented as CM6 extensions (StateField, ViewPlugin, MatchDecorator). Also called "live preview" in Obsidian docs — use "live-editor mode" for extensions and "live preview" only when referring to the Obsidian UI concept.

**Post-processor chunking**
Obsidian invokes `MarkdownPostProcessor` callbacks on sub-sections of the document (separated by blank lines), not the full document at once. Fences that span multiple paragraphs will arrive as separate post-processor invocations. DOM sibling-walking cannot cross chunk boundaries; source-based reconstruction via `getSectionInfo` is the correct approach.

---

### Quarto constructs

**Colon-fence div / QuartoDiv**
The `:::` block construct — Quarto's primary mechanism for wrapping content in a classed `<div>`. Syntax: `::: {.classname}` … `:::`. Not standard Markdown; Obsidian renders `:::` lines as plain `<p>` tags. Prefer "colon-fence div" when discussing the Quarto syntax, "QuartoDiv" when discussing the plugin concept.

**Fence**
A single colon-fence block delimited by an opening `:::` line and a closing `:::` line. A fence can be nested inside another fence. "Fence" is used broadly; qualify with "opening fence", "closing fence", or "top-level fence" when the position matters.

**CalloutBlock**
A visual rendering of colon-fence divs whose class starts with `callout-` (e.g. `.callout-note`, `.callout-warning`, `.callout-important`, `.callout-tip`, `.callout-caution`). Renders as a styled box with a colored left border, icon, title, and body. A specialization of QuartoDiv — every CalloutBlock is a fence, but not every fence is a CalloutBlock.

**Tabset**
A `::: {.panel-tabset}` fence that renders child sections as interactive tabs. V1 scope: visual recognition only; tab-switching interactivity is out of scope.

**Shortcode**
Quarto's `{{< shortcode arg >}}` inline syntax for inline directives (e.g. `{{< video url >}}`, `{{< include file >}}`). Rendered visually in live-editor mode via `ShortcodeViewPlugin`; content resolution is out of scope.

**ExecutableCodeChunk**
A code fence whose language specifier uses curly braces: `` ```{r} ``, `` ```{python} ``, `` ```{julia} ``. Visually distinguished from ordinary code blocks by a language badge added by `CodeChunkProcessor`. Execution is out of scope.

**CrossReference**
`@fig-`, `@tbl-`, `@eq-`, `@sec-` inline citation-style references. Visual flagging only; reference resolution is out of scope.

---

### Plugin architecture concepts

**QuartoPlugin**
The Obsidian plugin entry point (`main.ts`). Owns registration of all extension mechanisms: post-processors and CM6 editor extensions. Extends Obsidian's `Plugin` base class.

**MarkdownPostProcessor**
Obsidian's Reading View extension point. Callbacks receive a rendered HTML element (`el: HTMLElement`) and a `MarkdownPostProcessorContext`. The plugin registers two: `ColonFenceProcessor` (fences and callouts) and `CodeChunkProcessor` (code chunk badges).

**ColonFenceProcessor**
The post-processor responsible for reconstructing colon-fence block structure in Reading View. Works from source line ranges (via `getSectionInfo`) rather than DOM siblings, because DOM sibling-walking cannot span post-processor chunk boundaries.

**CodeChunkProcessor**
The post-processor that scans `<pre><code>` blocks for executable code chunk language specifiers and inserts a visual language badge (`<span class="qmd-code-lang">`).

**FenceRange**
An exported interface representing one fully-parsed top-level fence: `startLine` (0-indexed), `endLine` (0-indexed), `attrs: QuartoDivAttributes`, and `bodySource` (source text between the opening and closing lines). Produced by `parseFenceRangesInSource`.

**QuartoDivAttributes**
A typed object holding parsed fence header attributes: `classes: string[]`, `title: string`, `collapse: boolean`. Exposes `isCallout(): boolean` and `calloutType(): string`. Produced by `parseQuartoDivAttributes`.

**parseFenceRangesInSource**
A pure function (in `colonfence.ts`) that scans the full file source and returns an array of top-level `FenceRange` objects. Uses a depth-counting stack to handle nested fences correctly. Only top-level (outermost) ranges are emitted.

**parseQuartoDivAttributes**
A shared pure utility function (in `quartoattrs.ts`) that parses a raw fence-opening line into a `QuartoDivAttributes` object. Handles both `::: {.class}` and `:::{.class}` syntax. Never throws; always returns a valid object with defaults.

**getSectionInfo**
The Obsidian API method (`ctx.getSectionInfo(el)`) that returns `{ text, lineStart, lineEnd }` — `text` is the full file source, `lineStart`/`lineEnd` are the 0-indexed line range of the current post-processor element. The primary mechanism for source-based fence reconstruction. If it returns `null`, the element was not rendered from the main source (e.g. from an inner `MarkdownRenderer.render` call) and must be skipped immediately.

**MarkdownRenderChild**
An Obsidian lifecycle component. Wrap the rendered body `div` in a `MarkdownRenderChild` and register it via `ctx.addChild(child)` so Obsidian manages its lifecycle — required for async `MarkdownRenderer.render` calls.

**QuartoDivStateField**
A CM6 `StateField<DecorationSet>` that adds line decorations to `:::` fence boundaries in live-editor mode. Rebuilt on every document change; returns immediately without rebuilding when `!tr.docChanged`.

**ShortcodeViewPlugin**
A CM6 `ViewPlugin` using `MatchDecorator` to apply `cm-qmd-shortcode` marks to `{{< ... >}}` shortcode ranges in live-editor mode.

**FenceMarkerWidget**
A CM6 `WidgetType` used by `QuartoDivStateField` to render visual markers at fence boundary lines.

---

### Key invariants

**Non-destructive rendering**
The plugin never alters source file content. Post-processors mutate only the rendered HTML DOM; editor extensions mutate only the CodeMirror decoration layer. APIs that modify vault files (`file.modify`, `editor.replaceRange`) are prohibited.

**Source-based reconstruction (not DOM sibling-walking)**
Colon-fence reconstruction must use `ctx.getSectionInfo(el)` and `parseFenceRangesInSource`. DOM sibling-walking is prohibited because it cannot span post-processor chunk boundaries.

**Depth-counted fence parsing**
`parseFenceRangesInSource` must use a stack-based depth counter to handle nested fences. A flat search for the next `:::` is prohibited — it produces incorrect results for nested constructs.

**Graceful degradation**
Any construct that cannot be fully rendered must at minimum be visually recognized. Unhandleable edge cases must leave the original DOM untouched and return without throwing. No uncaught exceptions; `console.debug` at most.

**Opener-section owns full rendering**
When a fence spans multiple post-processor invocations, the invocation whose `lineStart` matches the fence's `startLine` renders the entire block. All other invocations inside the range call `el.empty()` to suppress raw content.

---

### CSS naming conventions

`qmd-` prefix — all Reading View (preview-mode) CSS classes (e.g. `qmd-callout`, `qmd-callout-note`, `qmd-colon-fence`, `qmd-code-lang`).

`cm-qmd-` prefix — all live-editor CodeMirror CSS classes (e.g. `cm-qmd-fence-open`, `cm-qmd-fence-close`, `cm-qmd-shortcode`).

No inline styles — all styling lives in `styles.css`.

---

### Terms to avoid

| Avoid | Use instead | Why |
|---|---|---|
| "preview mode" (unqualified) | "Reading View" | Obsidian has two modes that could be called "preview"; Reading View is the post-processor context |
| "edit mode" | "live-editor mode" | "edit mode" is an older Obsidian concept; "live-editor mode" is precise |
| "DOM walking" or "sibling walking" for fences | "source-based reconstruction" | DOM sibling-walking is the prohibited approach |
| "div" (unqualified for Quarto constructs) | "colon-fence div" or "QuartoDiv" | "div" alone conflates Quarto construct with HTML element |
| "preview" when meaning "Reading View" | "Reading View" | Avoids confusion with "live preview" |

---

### V1 scope boundary

**In scope**: colon-fence div rendering, callout blocks, executable code chunk badges, shortcode live-editor marking.

**Out of scope (V1)**: tabset interactivity, callout collapse/expand toggle, cross-reference resolution, code execution, bibliography rendering, new npm dependencies.
