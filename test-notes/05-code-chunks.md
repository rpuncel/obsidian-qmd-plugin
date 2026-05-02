# Executable Code Chunks

In Reading View, code blocks with `{lang}` language identifiers should show a small language badge above the block and have a coloured top border.

## Python chunk

```{python}
import pandas as pd
df = pd.DataFrame({"x": [1, 2, 3], "y": [4, 5, 6]})
print(df)
```

## R chunk

```{r}
library(ggplot2)
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point()
```

## Julia chunk

```{julia}
using Statistics
x = [1, 2, 3, 4, 5]
println(mean(x))
```

## Ordinary code block (should NOT get a badge)

```python
# This is a regular fenced code block — no curly braces around the language.
# It should render normally with no qmd-code-lang badge.
print("hello world")
```

```
# No language at all — also no badge.
plain text block
```
