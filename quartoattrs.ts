export interface QuartoDivAttributes {
	classes: string[];
	title: string;
	collapse: boolean;
	isCallout(): boolean;
	calloutType(): string;
}

export function parseQuartoDivAttributes(line: string): QuartoDivAttributes {
	const classMatches = line.match(/\.\w[-\w]*/g) ?? [];
	const classes = classMatches.map((c) => c.slice(1));

	const titleMatch = line.match(/title="([^"]*)"/);
	const title = titleMatch ? titleMatch[1] : "";

	const collapseMatch = line.match(/collapse="(true|false)"/);
	const collapse = collapseMatch ? collapseMatch[1] === "true" : false;

	return {
		classes,
		title,
		collapse,
		isCallout() {
			return this.classes.some((c: string) => c.startsWith("callout-"));
		},
		calloutType() {
			const found = this.classes.find((c: string) => c.startsWith("callout-"));
			return found ? found.slice("callout-".length) : "";
		},
	};
}
