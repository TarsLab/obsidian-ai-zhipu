import { App, PluginSettingTab, Setting } from 'obsidian'
import { promptEnFileName, promptZhFileName, t } from './lang/helper'
import AIZhipuPlugin from './main'
import { DEFAULT_SETTINGS } from './settings'

export class AIZhipuSettingTab extends PluginSettingTab {
	plugin: AIZhipuPlugin

	constructor(app: App, plugin: AIZhipuPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()

		new Setting(containerEl)
			.setName(t('Zhipu API key'))
			.setDesc(t('Obtain key from https://open.bigmodel.cn'))
			.addText((text) =>
				text
					.setPlaceholder(t('Enter your key'))
					.setValue(this.plugin.settings.apiKey)
					.onChange(async (value) => {
						this.plugin.settings.apiKey = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName(t('Prompt template file'))
			.setDesc(
				t(
					"Template file support both Chinese and English languages, with the default being the software's language setting."
				)
			)
			.addDropdown((dropdown) =>
				dropdown
					.addOption(promptZhFileName, `${DEFAULT_SETTINGS.rootFolder}/${promptZhFileName}`)
					.addOption(promptEnFileName, `${DEFAULT_SETTINGS.rootFolder}/${promptEnFileName}`)
					.setValue(this.plugin.settings.promptFileName ? this.plugin.settings.promptFileName : t('PromptTemplates'))
					.onChange(async (value) => {
						this.plugin.settings.promptFileName = value
						await this.plugin.saveSettings()
					})
			)
	}
}
