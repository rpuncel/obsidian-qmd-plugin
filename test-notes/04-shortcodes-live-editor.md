# Shortcode Live-Editor Decorations

These shortcodes should appear in **italic purple** while editing (Live Preview mode). They have no effect in Reading View — this file tests the CodeMirror decoration only.

Open this file in **editing mode** (Live Preview) to see the decorations.

## Video shortcode

Inline shortcode: {{< video https://www.youtube.com/embed/example >}}

## Include shortcode

{{< include _header.qmd >}}

## Pagebreak shortcode

Some text before. {{< pagebreak >}} Some text after.

## Multiple on one line

First {{< kbd Ctrl+C >}} then {{< kbd Ctrl+V >}} to paste.

## Shortcode inside a sentence

Use {{< fa thumbs-up >}} to indicate approval.

## Non-shortcode (should NOT be decorated)

This uses double braces but is not a shortcode: {{ this is handlebars }} — should not be styled.

This also uses angle brackets but not the shortcode pattern: `<tag>` — should not be styled.
