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

		containerEl.createEl('br')
		containerEl.createEl('h3', { text: t('Single Round Chat') })

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

		containerEl.createEl('br')
		containerEl.createEl('h3', { text: t('Multi Round Chat') })
		containerEl.createEl('p', { text: t('The starting mark of Multi-round chat is two consecutive lines of horizontal dashes, such as two lines of "---", and the ending mark is a single line of horizontal dashes.') })

		new Setting(containerEl)
			.setName('temperature')
			.setDesc(t('Sampling temperature controls the randomness of the output. A higher value makes the output more random and creative; a lower value makes the output more stable or deterministic.'))
			.addSlider((slider) =>
				slider
					.setLimits(0.01, 1, 0.01)
					.setValue(this.plugin.settings.multiRoundTemplate.params.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.multiRoundTemplate.params.temperature = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('top_p')
			.setDesc(t('0.1 means that the model decoder only considers taking tokens from the candidate set of the top 10% probability.'))
			.addSlider((slider) =>
				slider
					.setLimits(0.01, 0.99, 0.01)
					.setValue(this.plugin.settings.multiRoundTemplate.params.top_p)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.multiRoundTemplate.params.top_p = value
						await this.plugin.saveSettings()
					})
			)

		new Setting(containerEl)
			.setName('max_tokens')
			.setDesc(t('The maximum number of tokens to generate in the completion'))
			.addSlider((slider) =>
				slider
					.setLimits(1024, 8192, 64)
					.setValue(this.plugin.settings.multiRoundTemplate.params.max_tokens)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.multiRoundTemplate.params.max_tokens = value
						await this.plugin.saveSettings()
					})
			)
	}
}
