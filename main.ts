import { ColonFenceProcessor } from "./colonfence";
import { CodeChunkProcessor } from "./codechunk";
import { quartoDivStateField } from "./statefield";
import { shortcodeViewPlugin } from "./matchdecorator";
import { App, Plugin, PluginSettingTab, Setting } from "obsidian";

interface QuartoPluginSettings {
	enableLivePreview: boolean;
}

const DEFAULT_SETTINGS: QuartoPluginSettings = {
	enableLivePreview: true,
};

export default class QuartoPlugin extends Plugin {
	settings: QuartoPluginSettings;

	async onload() {
		await this.loadSettings();

		const colonfenceProcessor = new ColonFenceProcessor(this.app);
		const codeChunkProcessor = new CodeChunkProcessor();

		this.registerMarkdownPostProcessor(
			colonfenceProcessor.process.bind(colonfenceProcessor)
		);
		this.registerMarkdownPostProcessor(
			codeChunkProcessor.process.bind(codeChunkProcessor)
		);

		if (this.settings.enableLivePreview) {
			this.registerEditorExtension([quartoDivStateField, shortcodeViewPlugin]);
		}

		this.addSettingTab(new QuartoSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class QuartoSettingTab extends PluginSettingTab {
	plugin: QuartoPlugin;

	constructor(app: App, plugin: QuartoPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName("Live preview")
			.setDesc(
				"Enable CodeMirror decorations for colon-fence blocks and shortcodes while editing."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.enableLivePreview)
					.onChange(async (value) => {
						this.plugin.settings.enableLivePreview = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
