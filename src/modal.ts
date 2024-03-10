import { App, FuzzyMatch, FuzzySuggestModal, Modal } from 'obsidian'
import { ApiCallInfo } from './apiCall'
import { t } from './lang/helper'
import { ERROR_MARK } from './mark'
import { PromptTemplate } from './prompt'

export class PromptTemplatesModel extends FuzzySuggestModal<PromptTemplate> {
	templates: PromptTemplate[]
	onChoose: (result: PromptTemplate) => void

	constructor(app: App, templates: PromptTemplate[], onChoose: (result: PromptTemplate) => void) {
		super(app)
		this.templates = templates
		this.onChoose = onChoose
	}

	getItems(): PromptTemplate[] {
		return this.templates
	}

	getItemText(template: PromptTemplate): string {
		return template.title
	}

	renderSuggestion(template: FuzzyMatch<PromptTemplate>, el: HTMLElement) {
		const title = template.item.title
		let lastIndex = 0
		let highlightedTitle = ''

		// 遍历所有的匹配项
		for (const match of template.match.matches) {
			const before = title.slice(lastIndex, match[0])
			const matched = title.slice(match[0], match[0] + match[1])
			highlightedTitle += `${before}<strong>${matched}</strong>`
			lastIndex = match[0] + match[1]
		}

		// 添加最后一个匹配项后面的文本
		highlightedTitle += title.slice(lastIndex)

		// 创建一个新的 div 元素，用于显示标题
		const div = el.createEl('div')
		div.innerHTML = highlightedTitle

		el.createEl('small', {
			text: template.item.template,
			attr: {
				style: 'white-space: nowrap; overflow: hidden; text-overflow: ellipsis;'
			}
		})

		// console.log('matches', template.match.matches);
	}

	onChooseItem(template: PromptTemplate, evt: MouseEvent | KeyboardEvent) {
		// new Notice(`Selected ${book.title}`)
		this.onChoose(template)
	}
}

export class ApiCallInfoModal extends Modal {
	info: ApiCallInfo

	constructor(app: App, info: ApiCallInfo) {
		super(app)
		this.info = info
	}

	onOpen() {
		const { contentEl } = this

		contentEl.createEl('h1', {
			text: `Last API Call Info`
		})

		contentEl.createEl('h3', {
			text: 'Messages'
		})
		const { params, result, error } = this.info
		for (const msg of params.messages) {
			if (msg.content) {
				contentEl.createEl('h5', {
					text: msg.role
				})
				contentEl.createEl('textarea', {
					cls: 'full-width',
					text: msg.content.toString(),
					attr: {
						readonly: true,
						rows: 3
					}
				})
			}
		}

		if (result) {
			contentEl.createEl('h3', {
				text: 'Result'
			})
			contentEl.createEl('textarea', {
				text: result,
				cls: 'full-width',
				attr: {
					readonly: true,
					rows: 5
				}
			})
		}

		if (error) {
			contentEl.createEl('h3', {
				text: ERROR_MARK + ' Error'
			})
			contentEl.createEl('textarea', {
				text: error,
				cls: 'full-width',
				attr: {
					readonly: true,
					rows: 3
				}
			})
		}

		contentEl.createEl('h3', {
			text: 'Additional Info'
		})

		const timeInfo = `${t('Started at')} ${formatDate(this.info.startTime)},  ${t('ended at')} ${
			this.info.endTime ? formatDate(this.info.endTime) : 'N/A'
		}.  ${t('Duration')}: ${
			this.info.endTime ? formatDuration(this.info.endTime.getTime() - this.info.startTime.getTime()) : 'N/A'
		}`

		contentEl.createEl('p', {
			text: timeInfo
		})
		if (this.info.usage) {
			contentEl.createEl('pre', {
				text: JSON.stringify(this.info.usage, null, 2)
			})
		}
	}

	onClose() {
		const { contentEl } = this
		contentEl.empty()
	}
}

const formatDate = (d: Date) => {
	const hours = d.getHours().toString().padStart(2, '0')
	const minutes = d.getMinutes().toString().padStart(2, '0')
	const seconds = d.getSeconds().toString().padStart(2, '0')
	return `${hours}:${minutes}:${seconds}`
}

const formatDuration = (d: number) => `${(d / 1000).toFixed(2)} s`
