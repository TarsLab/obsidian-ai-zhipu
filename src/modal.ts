import { App, FuzzyMatch, FuzzySuggestModal, Modal } from 'obsidian'
import { ApiCallInfo } from './apiCall'
import { t } from './lang/helper'
import { ERROR_MARK } from './mark'
import { PromptTemplate } from './prompt'

export class PromptTemplatesModel extends FuzzySuggestModal<PromptTemplate> {
	templates: PromptTemplate[]
	onChoose: (result: PromptTemplate) => void
	lastApiCall?: ApiCallInfo

	constructor(
		app: App,
		templates: PromptTemplate[],
		onChoose: (result: PromptTemplate) => void,
		lastApiCall?: ApiCallInfo
	) {
		super(app)
		this.templates = templates
		this.onChoose = onChoose
		this.lastApiCall = lastApiCall
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

		el.createEl('div').innerHTML = highlightedTitle
		if (title === this.lastApiCall?.template.title) {
			el.createEl('small', {
				text: t('Last used')
			})
		}
	}

	onChooseItem(template: PromptTemplate, evt: MouseEvent | KeyboardEvent) {
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
		const { template, messages, startTime, endTime, result, error, usage } = this.info
		const { contentEl } = this

		contentEl.createEl('h1', {
			text: template.title
		})

		for (const msg of messages) {
			if (msg.content) {
				// contentEl.createEl('h4', {
				// 	text: msg.role
				// })
				contentEl.createEl('textarea', {
					text: msg.content.toString(),
					attr: {
						style: 'width: 100%;',
						readonly: true,
						rows: 3
					}
				})
			}
		}

		const timeInfoFn = new Function('startTime', 'endTime', 'duration', `return \`${t('TimeInfoTemplate')}\`;`)
		const timeInfo = timeInfoFn(
			formatDate(startTime),
			endTime ? formatDate(endTime) : 'N/A',
			endTime ? formatDuration(endTime.getTime() - startTime.getTime()) : 'N/A'
		)
		contentEl.createEl('div').createEl('p', {
			attr: {
				style: 'white-space: pre-wrap;'
			}
		}).innerHTML = timeInfo

		if (result) {
			contentEl.createEl('h4', {
				text: t('Response')
			})
			contentEl.createEl('textarea', {
				text: result,
				attr: {
					style: 'width: 100%;',
					readonly: true,
					rows: 5
				}
			})
		}

		if (error) {
			contentEl.createEl('h4', {
				text: ERROR_MARK + ' Error'
			})
			contentEl.createEl('textarea', {
				text: error,
				attr: {
					style: 'width: 100%;',
					readonly: true,
					rows: 3
				}
			})
		}

		if (usage) {
			const usageTemplateFn = new Function(
				'prompt_tokens',
				'completion_tokens',
				'total_tokens',
				`return \`${t('UsageInfoTemplate')}\`;`
			)
			const { prompt_tokens, completion_tokens, total_tokens } = usage
			contentEl.createEl('div').createEl('p', {
				attr: {
					style: 'white-space: pre-wrap;'
				}
			}).innerHTML = usageTemplateFn(
				formatTokenNumber(prompt_tokens),
				formatTokenNumber(completion_tokens),
				formatTokenNumber(total_tokens)
			)
		}

		const detailsEl = contentEl.createEl('details')
		detailsEl.createEl('p', { text: JSON.stringify(template.params, null, 2) })
		detailsEl.createEl('summary', { text: 'Params' })
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

const formatDuration = (d: number) => `${(d / 1000).toFixed(2)}s`
const formatTokenNumber = (n: number) => n.toString().padStart(4)
