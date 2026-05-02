import {
	EditorState,
	Extension,
	RangeSetBuilder,
	StateField,
	Text,
	Transaction,
} from "@codemirror/state";
import {
	Decoration,
	DecorationSet,
	EditorView,
	WidgetType,
} from "@codemirror/view";

export class FenceMarkerWidget extends WidgetType {
	label: string;

	constructor(label: string) {
		super();
		this.label = label;
	}

	toDOM(_view: EditorView): HTMLElement {
		const span = document.createElement("span");
		span.addClass("cm-qmd-fence-label");
		span.textContent = this.label;
		return span;
	}
}

function buildDecorations(doc: Text): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();
	let depth = 0;

	for (let i = 1; i <= doc.lines; i++) {
		const line = doc.line(i);
		const text = line.text.trim();

		let cls: string | null = null;

		if (text === ":::") {
			if (depth > 0) {
				cls = "cm-qmd-fence-close";
				depth--;
			}
		} else if (text.startsWith(":::")) {
			cls = "cm-qmd-fence-open";
			depth++;
		} else if (depth > 0) {
			cls = "cm-qmd-fence-body";
		}

		if (cls) {
			builder.add(line.from, line.from, Decoration.line({ class: cls }));
		}
	}

	return builder.finish();
}

export const quartoDivStateField = StateField.define<DecorationSet>({
	create(state: EditorState): DecorationSet {
		return buildDecorations(state.doc);
	},

	update(decorations: DecorationSet, tr: Transaction): DecorationSet {
		if (!tr.docChanged) return decorations;
		return buildDecorations(tr.newDoc);
	},

	provide(field: StateField<DecorationSet>): Extension {
		return EditorView.decorations.from(field);
	},
});
