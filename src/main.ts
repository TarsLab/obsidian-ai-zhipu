import Handlebars from 'handlebars'
import { Editor, MarkdownView, Notice, Plugin, TFile, normalizePath } from 'obsidian'
import { ApiCallInfo, newApiCallInfo } from './apiCall'
import { ZhipuAI } from './client'
import { promptEnFileName, promptZhFileName, t } from './lang/helper'
import {
	ASSISTANT_MARK_END,
	ASSISTANT_MARK_START,
	ERROR_MARK,
	USER_MARK_END,
	USER_MARK_START,
	isAssistantMarkEnd,
	isAssistantMarkStart,
	isMarkEnd,
	isMarkStart,
	isUserMarkEnd,
	isUserMarkStart
} from './mark'
import { ApiCallInfoModal, PromptTemplatesModel } from './modal'
import { PromptTemplate, getTemplates, toPromptTemplate } from './prompt'
import { promptEn } from './promptEn'
import { promptZh } from './promptZh'
import { AIZhipuSettingTab } from './settingTab'
import { DEFAULT_SETTINGS, PluginSettings } from './settings'
import { Token, validOrCreate } from './token'

export default class AIZhipuPlugin extends Plugin {
	settings: PluginSettings
	token?: Token
	apiCallInfo?: ApiCallInfo

	async onload() {
		await this.loadSettings()

		console.log('loading AI Zhipu plugin...')
		await this.createPromptFileIfNotExist()

		this.addCommand({
			id: 'text-selected',
			name: 'Generate text from the selected text / current ✨block / current line',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				if (this.checkApiKey() === false) return
				this.generateText(editor)
			}
		})

		this.addCommand({
			id: 'img-selected',
			name: t('Generate image from the selected text'),
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if ((this.checkApiKey() && this.checkSelection(editor)) === false) return
				await this.generateImage(editor)
			}
		})

		this.addCommand({
			id: 'text-selected-template',
			name: 'Generate text using template from the selected text ',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (this.checkApiKey() === false) return
				const onChoose = (template: PromptTemplate) => {
					this.generateText(editor, template)
				}
				const promptTemplates = await this.fetchPromptTemplates()
				new PromptTemplatesModel(this.app, promptTemplates, onChoose).open()
			}
		})

		this.addCommand({
			id: 'select-block',
			name: 'Select ✨block',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const block = this.findCurrentBlock(editor)
				if (block) {
					const { start, end } = block
					editor.setSelection({ line: start + 1, ch: 0 }, { line: end - 1, ch: editor.getLine(end - 1).length })
				} else {
					new Notice('Cannot find a valid block.')
				}
			}
		})

		this.addCommand({
			id: 'show-last-api-call',
			name: 'Show last API call in this session',
			callback: () => {
				if (!this.apiCallInfo) {
					new Notice('No API call yet.')
					return
				}
				new ApiCallInfoModal(this.app, this.apiCallInfo).open()
			}
		})
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AIZhipuSettingTab(this.app, this))
	}

	onunload() {}

	async createPromptFileIfNotExist() {
		if (!(await this.app.vault.adapter.exists(normalizePath(this.settings.rootFolder)))) {
			await this.app.vault.createFolder(this.settings.rootFolder)
			new Notice(t('create folder') + ' ' + this.settings.rootFolder)
		}

		const promptEnFilePath = normalizePath(`${this.settings.rootFolder}/${promptEnFileName}.md`)
		if (!(await this.app.vault.adapter.exists(promptEnFilePath))) {
			await this.app.vault.create(promptEnFilePath, promptEn)
			new Notice(t('create file') + ' ' + promptEnFileName)
		}

		const promptZhFilePath = normalizePath(`${this.settings.rootFolder}/${promptZhFileName}.md`)
		if (!(await this.app.vault.adapter.exists(promptZhFilePath))) {
			await this.app.vault.create(promptZhFilePath, promptZh)
			new Notice(t('create file') + ' ' + promptZhFileName)
		}
	}

	async loadSettings() {
		const promptFileName = t('PromptTemplates')
		this.settings = Object.assign({ promptFileName }, DEFAULT_SETTINGS, await this.loadData())
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	async fetchPromptTemplates() {
		const promptFilePath = normalizePath(`${this.settings.rootFolder}/${this.settings.promptFileName}.md`)
		const templateFile = this.app.vault.getAbstractFileByPath(promptFilePath)
		if (!templateFile) {
			console.warn(`Cannot getAbstractFileByPath ${promptFilePath}`)
			console.warn(`load prompt var`)
		}

		const fileContent = templateFile
			? await this.app.vault.cachedRead(templateFile as TFile)
			: this.getPromptFileContent()
		const templates = getTemplates(fileContent)
		return templates.map(toPromptTemplate)
	}

	getPromptFileContent() {
		return this.settings.promptFileName === promptZhFileName ? promptZh : promptEn
	}

	async getClient() {
		const { isValid, token } = await validOrCreate(this.token, this.settings.apiKey, this.settings.tokenExpireInMinutes)
		if (!isValid) {
			this.token = token
		}
		if (!this.token) throw new Error('Cannot get token.')
		const client = new ZhipuAI(this.token.id, this.settings.baseURL)
		return client
	}

	findCurrentBlock(editor: Editor): {
		type: 'user' | 'assistant'
		content: string
		start: number
		end: number
	} | null {
		const fileText = editor.getValue()
		const lines = fileText.split('\n')
		const current = editor.getCursor('to').line // TODO
		console.log('cursor_from', editor.getCursor('from').line, editor.getCursor('from').ch)
		console.log('cursor_to', editor.getCursor('to').line, editor.getCursor('to').ch)
		console.log('cursor_head', editor.getCursor('head').line, editor.getCursor('head').ch)
		console.log('cursor_anchor', editor.getCursor('anchor').line, editor.getCursor('anchor').ch)

		// 向上找 start 标记， 而且不能有 end 标记
		let start = isMarkEnd(lines[current]) ? current - 1 : current // 如果当前行是end标记，那么从上一行开始找。
		for (; start >= 0; start--) {
			if (isMarkStart(lines[start])) break
			if (isMarkEnd(lines[start])) return null
		}
		console.log('start', start, lines[start])

		// 向下找 end 标记，而且不能有 start 标记
		let end = start === current ? current + 1 : current // 如果当前行是start标记，那么从下一行开始找。
		for (; end < lines.length; end++) {
			if (isMarkEnd(lines[end])) break
			if (isMarkStart(lines[end])) return null
		}

		console.log('end', end, lines[end])
		if (start === -1 || end === lines.length) {
			return null
		}

		const content = lines.slice(start + 1, end).join('\n')
		if (isUserMarkStart(lines[start]) && isUserMarkEnd(lines[end]))
			return { type: 'user', content: content, start, end }
		if (isAssistantMarkStart(lines[start]) && isAssistantMarkEnd(lines[end]))
			return { type: 'assistant', content: content, start, end }

		return null
	}

	findAboveComment(editor: Editor) {}

	findNextEmptyAssistBlock(editor: Editor, from: number) {
		const fileText = editor.getValue()
		const lines = fileText.split('\n')
		let line = from
		let start = -1
		for (; line < lines.length; line++) {
			if (lines[line].trim().length > 0) {
				return null
			}
			if (line > from + 2) {
				return null
			}
			if (isAssistantMarkStart(lines[line])) {
				start = line
				break
			}
		}
		if (start === -1) return null
		let end = -1
		for (; line < lines.length; line++) {
			if (lines[line].trim().length > 0) {
				return null
			}
			if (line > start + 2) {
				return null
			}
			if (isAssistantMarkEnd(lines[line])) {
				end = line
				break
			}
		}
		return { start, end }
	}

	async generateText(editor: Editor, template?: PromptTemplate) {
		let block = this.findCurrentBlock(editor)

		if (!block) {
			const origin = editor.getSelection()

			if (origin.trim().length > 0) {
				block = {
					type: 'user',
					content: origin,
					start: editor.getCursor('from').line + 1,
					end: editor.getCursor('to').line + 3
				}
				editor.replaceSelection(`\n${USER_MARK_START}\n${origin}\n${USER_MARK_END}\n`)
			} else {
				const current = editor.getCursor('to').line
				const lineContent = editor.getLine(current)
				if (lineContent.trim().length === 0) {
					new Notice('Please select some text.')
					return
				}
				block = {
					type: 'user',
					content: lineContent,
					start: current,
					end: current + 2
				}
				editor.replaceRange(
					`${USER_MARK_START}\n${lineContent}\n${USER_MARK_END}`,
					{ line: current, ch: 0 },
					{ line: current, ch: lineContent.length }
				)
			}
		} else if (block.type === 'assistant') {
			// 是 assistance block
			new Notice('这是生成的区块。把选中的文件复制到这个区块外面，再执行。')
			return
		} else if (block.content.trim().length === 0) {
			// block 是空的
			new Notice('Block is empty.')
			return
		}

		console.log('block', block)

		// 找 comment

		editor.setSelection(
			{ line: block.start + 1, ch: 0 },
			{ line: block.end - 1, ch: editor.getLine(block.end - 1).length }
		)
		const selection = editor.getSelection()
		console.log('block.content', block.content)
		console.log('selection', selection)

		const nextEmptyBlock = this.findNextEmptyAssistBlock(editor, block.end)
		if (nextEmptyBlock) {
			console.log('nextEmptyBlock', nextEmptyBlock)
			// clear next empty block
			editor.replaceRange(
				'',
				{ line: nextEmptyBlock.start, ch: 0 },
				{ line: nextEmptyBlock.end, ch: editor.getLine(nextEmptyBlock.end).length }
			)
		}

		// eslint-disable-next-line no-constant-condition
		// if ('a' + 'b' === 'ab') return

		let prompt = selection
		if (template) {
			const templateFn = Handlebars.compile(template.template)
			prompt = templateFn({ selection })
		}
		console.debug('prompt', prompt)

		let LnToWrite = block.end

		this.apiCallInfo = newApiCallInfo({ model: this.settings.model, messages: [{ role: 'user', content: prompt }] })
		try {
			const client = await this.getClient()
			const runner = await client.beta.chat.completions
				.stream(this.apiCallInfo.params)
				.on('connect', () => {
					editor.replaceRange(`\n${ASSISTANT_MARK_START}\n`, { line: LnToWrite, ch: editor.getLine(LnToWrite).length })
					LnToWrite = LnToWrite + 2
				})
				.on('content', (diff) => {
					const lines = diff.split('\n')
					if (lines.length > 1) {
						editor.replaceRange(diff, { line: LnToWrite, ch: editor.getLine(LnToWrite).length })
						LnToWrite = LnToWrite + lines.length - 1
					} else {
						this.setLineThenScroll(editor, LnToWrite, diff)
					}
				})
			const final = await runner.finalChatCompletion()

			this.insertNewLineThenScroll(editor, LnToWrite, ASSISTANT_MARK_END)

			const content = final.choices[0].message.content
			this.apiCallInfo.endTime = new Date()
			this.apiCallInfo.result = content
			this.apiCallInfo.usage = final.usage || null
		} catch (error) {
			console.error('error', error)
			this.apiCallInfo.error = `${error}`
			this.apiCallInfo.endTime = new Date()
			this.insertNewLineThenScroll(editor, LnToWrite, `${ERROR_MARK} ${error}`)
		}
	}

	insertNewLineThenScroll(editor: Editor, LnToWrite: number, text: string) {
		editor.replaceRange(`\n${text}`, { line: LnToWrite, ch: editor.getLine(LnToWrite).length })
		LnToWrite++
		editor.setCursor({ line: LnToWrite, ch: editor.getLine(LnToWrite).length }) // 改到后面，不要到新的一行，方便连着用select block
		editor.scrollIntoView({ from: editor.getCursor('from'), to: editor.getCursor('to') })
		return LnToWrite
	}

	setLineThenScroll(editor: Editor, LnToWrite: number, text: string) {
		const textLine = editor.getLine(LnToWrite) + text
		editor.setLine(LnToWrite, textLine)
		editor.setCursor({ line: LnToWrite, ch: textLine.length })
		editor.scrollIntoView({ from: editor.getCursor('from'), to: editor.getCursor('to') })
	}

	async generateImage(editor: Editor) {
		const prompt = editor.getSelection()
		const currentLn = editor.getCursor('to').line
		if (prompt.length < 1) throw new Error('Cannot find prompt.')
		if (this.settings.apiKey.length <= 1) throw new Error('ZhipuAI API Key is not provided.')

		const newPrompt = prompt

		let LnToWrite = currentLn + 1
		editor.setLine(LnToWrite++, '\n')
		const client = await this.getClient()

		const indicator = 'AI Zhipu is Thinking'
		editor.setLine(LnToWrite, indicator)

		const response = await client.images.generate({
			prompt: newPrompt,
			model: this.settings.imageModel
		})
		console.log('response', response)
		const url = response.data[0]?.url
		if (url) {
			editor.setLine(LnToWrite, `![](${url})\n`)
		} else {
			editor.setLine(LnToWrite, `生成图片失败`)
		}
	}

	checkApiKey() {
		if (this.settings.apiKey.length <= 1) {
			new Notice(t('ZhipuAI API Key is not provided.'))
			return false
		}
		return true
	}

	checkSelection(editor: Editor) {
		if (editor.getSelection().length < 1) {
			new Notice(t('Cannot find selected text.'))
			return false
		}
		return true
	}
}
