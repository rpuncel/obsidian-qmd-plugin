# Nested Colon-Fence Divs

Tests the depth-counter logic — inner `:::` blocks must not prematurely close the outer block.

## One level of nesting

::: {.callout-note title="Outer Note"}
This is the outer callout.

::: {.callout-tip title="Inner Tip"}
This tip is nested inside the note. Both should render correctly.
:::

This text is still inside the outer note, after the inner tip.
:::

## Two levels of nesting

::: {.columns}
Outer columns fence.

::: {.column}
Left column content.
:::

::: {.column}
Right column content.
:::

End of the columns fence.
:::

## Sibling fences (not nested)

::: {.callout-note}
First callout.
:::

::: {.callout-warning}
Second callout — this should be a separate block, not nested inside the first.
:::
