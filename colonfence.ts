import type { MarkdownPostProcessorContext } from "obsidian";
import { App, MarkdownRenderChild, MarkdownRenderer } from "obsidian";
import { parseQuartoDivAttributes, QuartoDivAttributes } from "./quartoattrs";

export interface FenceRange {
	startLine: number;
	endLine: number;
	attrs: QuartoDivAttributes;
	bodySource: string;
}

export function parseFenceRangesInSource(source: string): FenceRange[] {
	const lines = source.split(/\r?\n/);
	const ranges: FenceRange[] = [];
	const stack: { startLine: number; attrs: QuartoDivAttributes }[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();
		if (!line.startsWith(":::")) continue;

		if (line === ":::" && stack.length > 0) {
			const top = stack.pop()!;
			if (stack.length === 0) {
				const bodySource = lines
					.slice(top.startLine + 1, i)
					.join("\n")
					.trim();
				ranges.push({
					startLine: top.startLine,
					endLine: i,
					attrs: top.attrs,
					bodySource,
				});
			}
		} else {
			stack.push({ startLine: i, attrs: parseQuartoDivAttributes(line) });
		}
	}

	return ranges;
}

export class ColonFenceProcessor {
	constructor(private app: App) {}

	async process(
		el: HTMLElement,
		ctx: MarkdownPostProcessorContext
	): Promise<void> {
		const info = ctx.getSectionInfo(el);
		if (!info) return;

		const ranges = parseFenceRangesInSource(info.text);
		const containing =
			ranges.find(
				(r) =>
					r.startLine <= info.lineStart && info.lineEnd <= r.endLine
			) ?? null;

		if (!containing) return;

		if (info.lineStart !== containing.startLine) {
			el.empty();
			return;
		}

		el.empty();
		const outer = document.createElement("div");
		outer.addClass("qmd-colon-fence");

		if (containing.attrs.isCallout()) {
			outer.addClass("qmd-callout");
			outer.addClass(`qmd-callout-${containing.attrs.calloutType()}`);

			const titleDiv = document.createElement("div");
			titleDiv.addClass("qmd-callout-title");
			titleDiv.textContent =
				containing.attrs.title ||
				capitalise(containing.attrs.calloutType());

			const bodyDiv = document.createElement("div");
			bodyDiv.addClass("qmd-callout-body");

			const child = new MarkdownRenderChild(bodyDiv);
			ctx.addChild(child);
			await MarkdownRenderer.render(
				this.app,
				containing.bodySource,
				bodyDiv,
				ctx.sourcePath,
				child
			);

			outer.appendChild(titleDiv);
			outer.appendChild(bodyDiv);
		} else {
			outer.addClass("qmd-generic-fence");

			if (containing.attrs.classes.length > 0) {
				outer.setAttribute(
					"data-qmd-classes",
					containing.attrs.classes.join(" ")
				);
			}

			const child = new MarkdownRenderChild(outer);
			ctx.addChild(child);
			await MarkdownRenderer.render(
				this.app,
				containing.bodySource,
				outer,
				ctx.sourcePath,
				child
			);
		}

		el.appendChild(outer);
	}
}

function capitalise(s: string): string {
	if (!s) return "";
	return s.charAt(0).toUpperCase() + s.slice(1);
}
