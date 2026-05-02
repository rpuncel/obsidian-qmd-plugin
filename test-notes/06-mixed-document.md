---
title: "Mixed Quarto Document"
author: "Test Author"
format: html
---

# Mixed Quarto Document

This note combines all supported features in a realistic document structure.

## Introduction

Use {{< fa book >}} to find related chapters. The following analysis uses Python.

```{python}
#| echo: false
#| label: fig-scatter
import matplotlib.pyplot as plt
plt.scatter([1,2,3], [4,5,6])
plt.title("Example")
```

## Key Findings

::: {.callout-important title="Main Result"}
The primary finding is statistically significant at p < 0.001.

See the scatter plot above for the visual summary.
:::

## Methodology

::: {.callout-note}
All data was collected between January and March 2024. Outliers were removed using the IQR method.
:::

Standard markdown still works: **bold**, *italic*, `inline code`, and [links](https://quarto.org).

### Data Processing

```{r}
#| warning: false
data <- read.csv("data.csv")
summary(data)
```

## Caveats

::: {.callout-warning title="Limitation"}
This analysis does not account for seasonal variation.

::: {.callout-tip title="Workaround"}
Apply the seasonal adjustment factor from Appendix B before comparing across quarters.
:::

Despite this limitation, the results are broadly valid.
:::

## Column Layout

::: {.columns}

::: {.column width="50%"}
**Left column**

Some content on the left side.
:::

::: {.column width="50%"}
**Right column**

Some content on the right side.
:::

:::

## Conclusion

Use {{< pagebreak >}} before the references section in the final PDF output.
