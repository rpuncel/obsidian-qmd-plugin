import {
	Decoration,
	DecorationSet,
	EditorView,
	MatchDecorator,
	ViewPlugin,
	ViewUpdate,
} from "@codemirror/view";

const shortcodeMatcher = new MatchDecorator({
	regexp: /\{\{<\s*\w+[^>]*>\}\}/g,
	decoration: () => Decoration.mark({ class: "cm-qmd-shortcode" }),
});

export const shortcodeViewPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = shortcodeMatcher.createDeco(view);
		}

		update(update: ViewUpdate) {
			this.decorations = shortcodeMatcher.updateDeco(update, this.decorations);
		}
	},
	{ decorations: (v) => v.decorations }
);
