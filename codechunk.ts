import type { MarkdownPostProcessorContext } from "obsidian";

export class CodeChunkProcessor {
	process(el: HTMLElement, _ctx: MarkdownPostProcessorContext): void {
		const codeElements = el.findAll("code");

		for (const code of codeElements) {
			const pre = code.parentElement;
			if (!(pre instanceof HTMLElement) || pre.tagName !== "PRE") continue;

			let langName: string | null = null;

			// Check class attribute on pre or code for language-{lang} pattern
			const combinedClasses = pre.className + " " + code.className;
			const langClassMatch = combinedClasses.match(/language-\{(\w+)\}/);
			if (langClassMatch) {
				langName = langClassMatch[1];
			}

			// Check first line of code content for {lang} pattern
			if (!langName) {
				const firstLine = (code.innerText.split("\n")[0] ?? "").trim();
				const firstLineMatch = firstLine.match(/^\{([a-z]+)\}/);
				if (firstLineMatch) {
					langName = firstLineMatch[1];
				}
			}

			if (!langName) continue;

			const badge = document.createElement("span");
			badge.addClass("qmd-code-lang");
			badge.textContent = langName;

			pre.addClass("qmd-code-chunk");
			pre.parentElement?.insertBefore(badge, pre);
		}
	}
}
