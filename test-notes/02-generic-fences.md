# Generic Colon-Fence Divs

These fences have non-callout classes and should render as a plain styled block with a grey left border.

::: {.my-custom-class}
This is a generic fenced div with class `my-custom-class`. It should have a grey left border but no callout colour or icon.
:::

::: {.columns}
This simulates a Quarto columns div. No special rendering in V1 — just the generic fence style.
:::

## No-attribute fence

A bare opening fence followed by a bare closing fence:

:::
This content is inside a fence with no attributes at all.
:::

## Fence with multiple classes

::: {.panel-tabset .special}
This fence has two classes: `panel-tabset` and `special`. Both should appear in the `data-qmd-classes` attribute on the rendered div (inspect the DOM).
:::
