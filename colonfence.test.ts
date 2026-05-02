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

	it("bodySource includes inner fence text and trailing content within outer", () => {
		// The inner ::: closer must not prematurely end the outer body.
		const source =
			"::: {.callout-note}\nBefore inner.\n\n::: {.callout-tip}\nInner body.\n:::\n\nAfter inner.\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].bodySource).toBe(
			"Before inner.\n\n::: {.callout-tip}\nInner body.\n:::\n\nAfter inner."
		);
	});

	it("returns one top-level range when two sibling inner fences are nested", () => {
		// Two inner ::: pairs inside one outer — depth counter must handle both closes.
		const source =
			"::: {.columns}\nOuter.\n\n::: {.column}\nLeft.\n:::\n\n::: {.column}\nRight.\n:::\n\nEnd.\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].startLine).toBe(0);
		expect(ranges[0].endLine).toBe(12);
	});

	it("detects generic (non-callout) fences", () => {
		const source = "::: {.python}\ncode\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].attrs.isCallout()).toBe(false);
	});

	it("detects a bare fence with no attributes", () => {
		const source = ":::\nsome content\n:::";
		const ranges = parseFenceRangesInSource(source);
		expect(ranges).toHaveLength(1);
		expect(ranges[0].startLine).toBe(0);
		expect(ranges[0].endLine).toBe(2);
		expect(ranges[0].bodySource).toBe("some content");
	});
});
