export class App {}
export class MarkdownRenderChild {
	constructor(public containerEl: HTMLElement) {}
}
export class MarkdownRenderer {
	static async render(
		_app: unknown,
		_markdown: string,
		_el: HTMLElement,
		_sourcePath: string,
		_component: unknown
	): Promise<void> {}
}
