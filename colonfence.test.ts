import { describe, it, expect, vi } from "vitest";
vi.mock("obsidian");
import { parseFenceRangesInSource } from "./colonfence";

describe("parseFenceRangesInSource", () => {
	it("returns empty array when no fences present", () => {
		const source = "# Header\n\nSome text without fences.";
		expect(parseFenceRangesInSource(source)).toEqual([]);
	});

	it("detects a simple single-paragraph callout", () => {
		const source = "::: {.callout-note}\nBody text.\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].startLine).toBe(0);
		expect(ranges[0].endLine).toBe(2);
		expect(ranges[0].attrs.isCallout()).toBe(true);
		expect(ranges[0].attrs.calloutType()).toBe("note");
		expect(ranges[0].bodySource).toBe("Body text.");
	});

	it("detects a multi-paragraph callout body", () => {
		const source =
			'::: {.callout-warning title="Watch Out"}\nFirst paragraph.\n\nSecond paragraph.\n:::';
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].startLine).toBe(0);
		expect(ranges[0].endLine).toBe(4);
		expect(ranges[0].bodySource).toBe(
			"First paragraph.\n\nSecond paragraph."
		);
	});

	it("handles callout not at line 0", () => {
		const source = "# Header\n\n::: {.callout-note}\nBody.\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].startLine).toBe(2);
		expect(ranges[0].endLine).toBe(4);
	});

	it("captures custom title attribute", () => {
		const source =
			'::: {.callout-note title="Custom Title Here"}\nBody.\n:::';
		const ranges = parseFenceRangesInSource(source);
		expect(ranges[0].attrs.title).toBe("Custom Title Here");
	});

	it("detects multiple top-level fences", () => {
		const source =
			"::: {.callout-note}\nFirst.\n:::\n\n::: {.callout-warning}\nSecond.\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(2);
		expect(ranges[0].startLine).toBe(0);
		expect(ranges[0].endLine).toBe(2);
		expect(ranges[1].startLine).toBe(4);
		expect(ranges[1].endLine).toBe(6);
	});

	it("returns only top-level ranges for nested fences", () => {
		const source =
			"::: {.callout-note}\n::: {.callout-tip}\nInner body.\n:::\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].startLine).toBe(0);
		expect(ranges[0].endLine).toBe(4);
	});

	it("detects generic (non-callout) fences", () => {
		const source = "::: {.python}\ncode\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].attrs.isCallout()).toBe(false);
	});
});
