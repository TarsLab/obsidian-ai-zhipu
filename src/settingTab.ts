import { App, PluginSettingTab, Setting } from 'obsidian'
import { promptEnFileName, promptZhFileName, t } from './lang/helper'
import AIZhipuPlugin from './main'

export class AIZhipuSettingTab extends PluginSettingTab {
	plugin: AIZhipuPlugin

	constructor(app: App, plugin: AIZhipuPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this
		containerEl.empty()
		containerEl.createEl('h2', { text: t('ZhipuAI API') })

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
			.setName(t('Model'))
			.setDesc(t('Select the model to use for content generation'))
			.addDropdown((dropdown) =>
				dropdown
					.addOption('glm-4', 'glm-4')
					.addOption('glm-3-turbo', 'glm-3-turbo')
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value
						await this.plugin.saveSettings()
					})
			)

		// new Setting(containerEl)
		// 	.setName(t('Image Model'))
		// 	.setDesc(t('Select the model to use for image generation'))
		// 	.addDropdown((dropdown) =>
		// 		dropdown
		// 			.addOption('cogview-3', 'cogview-3')
		// 			.setValue(this.plugin.settings.imageModel)
		// 			.onChange(async (value) => {
		// 				this.plugin.settings.imageModel = value
		// 				await this.plugin.saveSettings()
		// 			})
		// 	)

		new Setting(containerEl).setName(t('Prompt File')).addDropdown((dropdown) =>
			dropdown
				.addOption(promptZhFileName, promptZhFileName)
				.addOption(promptEnFileName, promptEnFileName)
				.setValue(this.plugin.settings.promptFileName ? this.plugin.settings.promptFileName : t('PromptTemplates'))
				.onChange(async (value) => {
					this.plugin.settings.promptFileName = value
					await this.plugin.saveSettings()
				})
		)
	}
}
