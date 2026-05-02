// @vitest-environment jsdom

import { beforeAll, describe, expect, it } from "vitest";
import { CodeChunkProcessor } from "./codechunk";

declare global {
	interface HTMLElement {
		findAll(selector: string): HTMLElement[];
		addClass(cls: string): void;
	}
}

beforeAll(() => {
	HTMLElement.prototype.findAll = function (
		selector: string
	): HTMLElement[] {
		return Array.from(this.querySelectorAll(selector)) as HTMLElement[];
	};
	HTMLElement.prototype.addClass = function (cls: string): void {
		this.classList.add(cls);
	};
});

function makeEl(classLang: string | null, content: string): HTMLElement {
	const container = document.createElement("div");
	const pre = document.createElement("pre");
	const code = document.createElement("code");
	if (classLang) {
		pre.className = `language-${classLang}`;
		code.className = `language-${classLang}`;
	}
	code.textContent = content;
	pre.appendChild(code);
	container.appendChild(pre);
	document.body.appendChild(container);
	return container;
}

const processor = new CodeChunkProcessor();
const ctx = {} as never;

describe("CodeChunkProcessor", () => {
	it("adds badge via class-based detection for {python}", () => {
		const el = makeEl("{python}", "import pandas");
		processor.process(el, ctx);
		const badge = el.querySelector(".qmd-code-lang");
		expect(badge?.textContent).toBe("python");
		expect(el.querySelector("pre")?.classList.contains("qmd-code-chunk")).toBe(true);
	});

	it("adds badge via first-line detection for {r}", () => {
		const el = makeEl(null, "{r}\nlibrary(ggplot2)");
		processor.process(el, ctx);
		const badge = el.querySelector(".qmd-code-lang");
		expect(badge?.textContent).toBe("r");
	});

	it("does not add badge for a regular code block without braces", () => {
		const el = makeEl("python", "print('hello')");
		processor.process(el, ctx);
		expect(el.querySelector(".qmd-code-lang")).toBeNull();
	});

	it("does not add badge when there is no language at all", () => {
		const el = makeEl(null, "plain text block");
		processor.process(el, ctx);
		expect(el.querySelector(".qmd-code-lang")).toBeNull();
	});
});
