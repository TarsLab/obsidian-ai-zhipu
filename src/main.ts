import Handlebars from 'handlebars'
import { Editor, MarkdownView, Notice, Plugin, TFile, normalizePath } from 'obsidian'
import { RunnableToolFunctionWithParse } from 'openai/lib/RunnableFunction'
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions'
import { ApiCallInfo, newApiCallInfo, toChatCompletionStreamParams } from './apiCall'
import {
	MsgBlock,
	UserMsgBlock,
	findCurrentBlock,
	findMultiRoundRange,
	findNextEmptyAssistBlock,
	findPreMsgBlocks
} from './block'
import { ZhipuAI } from './client'
import { promptEnFileName, promptZhFileName, t } from './lang/helper'
import {
	ASSISTANT_MARK_END,
	ASSISTANT_MARK_START,
	ERROR_MARK,
	LINE_BREAK,
	USER_MARK_END,
	USER_MARK_START
} from './mark'
import { ApiCallInfoModal, PromptTemplatesModal } from './modal'
import { ChatParams, ImageGenerateParams, KnowledgeChatParams, PromptTemplate, getTemplates } from './prompt'
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

		console.debug('loading AI Zhipu plugin...')
		await this.createPromptFileIfNotExist()

		this.addCommand({
			id: 'generate',
			name: t('Generate from the selected text / line / block'),
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				if (this.settings.apiKey.length <= 1) {
					new Notice(t('ZhipuAI API Key is not provided.'))
					return
				}
				const lines = editor.getValue().split('\n')
				const current = editor.getCursor('to').line
				const multiRoundDivider = findMultiRoundRange(lines, current)
				if (multiRoundDivider) {
					let preBlocks: MsgBlock[] = []
					try {
						preBlocks = findPreMsgBlocks(lines, multiRoundDivider.start, current)
					} catch (e) {
						new Notice(e.message)
						return
					}
					const round = preBlocks.length === 0 ? 1 : preBlocks.length / 2 + 1
					new Notice(t('Round') + ' ' + round + ' ' + t('Chat'))
					this.generateText(editor, this.settings.multiRoundTemplate, preBlocks)
				} else {
					const onChoose = (template: PromptTemplate) => {
						this.generateText(editor, template)
					}
					const promptTemplates = await this.fetchPromptTemplates()
					new PromptTemplatesModal(this.app, promptTemplates, onChoose, this.apiCallInfo).open()
				}
			}
		})

		this.addCommand({
			id: 'select-block',
			name: t('Select ✨block✨'),
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const block = findCurrentBlock(editor.getValue().split('\n'), editor.getCursor('to').line)
				if (block) {
					const { start, end } = block
					editor.setSelection({ line: start + 1, ch: 0 }, { line: end - 1, ch: editor.getLine(end - 1).length })
				} else {
					new Notice(t('Cannot find a valid block.'))
				}
			}
		})

		this.addCommand({
			id: 'show-chat-detail',
			name: t('Show the chat details'),
			callback: () => {
				if (!this.apiCallInfo) {
					new Notice(t('No chat in this session yet.'))
					return
				}
				new ApiCallInfoModal(this.app, this.apiCallInfo).open()
			}
		})

		this.addCommand({
			id: 'open-template-file',
			name: t('Open prompt template file'),
			callback: async () => {
				const promptFilePath = normalizePath(`${this.settings.rootFolder}/${this.settings.promptFileName}.md`)
				const file = this.app.vault.getAbstractFileByPath(promptFilePath)
				if (!file) {
					new Notice(t('Cannot find prompt template file.'))
					return
				}
				await this.app.workspace.openLinkText('', file.path, true)
			}
		})
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new AIZhipuSettingTab(this.app, this))
	}

	onunload() {}

	async createPromptFileIfNotExist() {
		if (!(await this.app.vault.adapter.exists(normalizePath(this.settings.rootFolder)))) {
			await this.app.vault.createFolder(this.settings.rootFolder)
			new Notice(t('Create template folder') + ' ' + this.settings.rootFolder)
		}

		const promptEnFilePath = normalizePath(`${this.settings.rootFolder}/${promptEnFileName}.md`)
		if (!(await this.app.vault.adapter.exists(promptEnFilePath))) {
			await this.app.vault.create(promptEnFilePath, promptEn)
			new Notice(t('Create template file') + ' ' + promptEnFileName)
		}

		const promptZhFilePath = normalizePath(`${this.settings.rootFolder}/${promptZhFileName}.md`)
		if (!(await this.app.vault.adapter.exists(promptZhFilePath))) {
			await this.app.vault.create(promptZhFilePath, promptZh)
			new Notice(t('Create template file') + ' ' + promptZhFileName)
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
		let fileContent: string
		if (templateFile instanceof TFile) {
			fileContent = await this.app.vault.cachedRead(templateFile)
		} else {
			console.warn(`Cannot getAbstractFileByPath ${promptFilePath}`)
			console.warn(`load preset prompt`)
			fileContent = this.getPresetPromptFileContent()
		}
		return getTemplates(fileContent)
	}

	getPresetPromptFileContent() {
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

	createBlockFromSelection(editor: Editor): UserMsgBlock {
		const block: UserMsgBlock = {
			_tag: 'user',
			content: origin,
			start: editor.getCursor('from').line + 1,
			end: editor.getCursor('to').line + 3
		}
		editor.replaceSelection(
			LINE_BREAK + USER_MARK_START + LINE_BREAK + origin.trimEnd() + LINE_BREAK + USER_MARK_END + LINE_BREAK
		)
		return block
	}

	createBlockFromLine(editor: Editor, current: number): UserMsgBlock {
		const lineContent = editor.getLine(current)
		if (lineContent.trim().length === 0) {
			throw new Error('Nothing was selected')
		}
		editor.replaceRange(
			USER_MARK_START + LINE_BREAK + lineContent.trimEnd() + LINE_BREAK + USER_MARK_END,
			{ line: current, ch: 0 },
			{ line: current, ch: lineContent.length }
		)
		return {
			_tag: 'user',
			content: lineContent,
			start: current,
			end: current + 2
		}
	}

	async generateText(editor: Editor, template: PromptTemplate, preBlocks: MsgBlock[] = []) {
		let block = findCurrentBlock(editor.getValue().split('\n'), editor.getCursor('to').line)

		if (!block) {
			if (editor.getSelection().trim().length > 0) {
				block = this.createBlockFromSelection(editor)
			} else {
				const current = editor.getCursor('to').line
				if (editor.getLine(current).trim().length === 0) {
					new Notice(t('Nothing was selected'))
					return
				}
				block = this.createBlockFromLine(editor, current)
			}
		} else if (block._tag === 'assistant') {
			new Notice(
				t(
					'This is the block for generating content. Copy the selected text outside of this block, and then execute the command.'
				),
				1000 * 5
			)
			return
		} else if (block.content.trim().length === 0) {
			new Notice(t('Block is empty'))
			return
		}

		console.debug('block', block)

		// 找 comment

		editor.setSelection(
			{ line: block.start + 1, ch: 0 },
			{ line: block.end - 1, ch: editor.getLine(block.end - 1).length }
		)
		const selection = editor.getSelection()
		console.debug('block.content', block.content)
		console.debug('selection', selection)

		const nextEmptyBlock = findNextEmptyAssistBlock(editor.getValue().split('\n'), block.end + 1)
		if (nextEmptyBlock) {
			console.debug('nextEmptyBlock', nextEmptyBlock)
			// clear next empty block
			editor.replaceRange(
				'',
				{ line: nextEmptyBlock.start, ch: 0 },
				{ line: nextEmptyBlock.end, ch: editor.getLine(nextEmptyBlock.end).length }
			)
			new Notice(t('Regenerate block'))
		}

		let prompt = selection
		if (template.template && template.template.trim().length > 0 && template.template.trim() !== '{{selection}}') {
			const templateFn = Handlebars.compile(template.template)
			prompt = templateFn({ selection })
		}

		console.debug('prompt', prompt)
		console.debug('template', template)

		let LnToWrite = block.end

		const onConnect = () => {
			editor.replaceRange(LINE_BREAK + ASSISTANT_MARK_START + LINE_BREAK, {
				line: LnToWrite,
				ch: editor.getLine(LnToWrite).length
			})
			LnToWrite = LnToWrite + 2
		}
		const onContent = (diff: string) => {
			const lines = diff.split('\n')
			if (lines.length > 1) {
				editor.replaceRange(diff, { line: LnToWrite, ch: editor.getLine(LnToWrite).length })
				LnToWrite = LnToWrite + lines.length - 1
			} else {
				this.setLineThenScroll(editor, LnToWrite, diff)
			}
		}

		const preMsg: ChatCompletionMessageParam[] = preBlocks.map((block) =>
			block._tag === 'user' ? { role: 'user', content: block.content } : { role: 'assistant', content: block.content }
		)

		this.apiCallInfo = newApiCallInfo(template, [...preMsg, { role: 'user', content: prompt }])

		try {
			const client = await this.getClient()

			if (ImageGenerateParams.is(template.params)) {
				const response = await client.images.generate({
					prompt: prompt,
					model: this.apiCallInfo.template.params.model
				})
				console.debug('response', response)
				const url = response.data[0]?.url
				if (url) {
					onConnect()
					onContent(`![](${url})${LINE_BREAK}`)
				} else {
					onConnect()
					onContent(t('Failed to generate image') + LINE_BREAK)
				}

				this.apiCallInfo.endTime = new Date()
				this.apiCallInfo.result = response.data[0]?.url || null
			} else if (KnowledgeChatParams.is(template.params)) {
				const tools = [
					{
						type: 'retrieval',
						retrieval: {
							knowledge_id: template.params.knowledge_id,
							prompt_template: template.params.prompt_template
						}
					}
				] as object[] as RunnableToolFunctionWithParse<object>[] // 这里hack，因为 zhipu-ai 的函数调用类型和 openai 的类型定义不一样
				console.debug('prompt_template', template.params.prompt_template)
				const knowledgeChat = client.beta.chat.completions
					.runTools({
						...toChatCompletionStreamParams(this.apiCallInfo),
						stream: true,
						tools: tools
					})
					.on('connect', onConnect)
					.on('content', (diff) => onContent(diff))

				const final = await knowledgeChat.finalChatCompletion()
				const content = final.choices[0].message.content
				this.apiCallInfo.endTime = new Date()
				this.apiCallInfo.result = content
				this.apiCallInfo.usage = final.usage || null
			} else if (ChatParams.is(template.params)) {
				const chat = client.beta.chat.completions
					.stream(toChatCompletionStreamParams(this.apiCallInfo))
					.on('connect', onConnect)
					.on('content', (diff) => onContent(diff))

				const final = await chat.finalChatCompletion()
				const content = final.choices[0].message.content
				this.apiCallInfo.endTime = new Date()
				this.apiCallInfo.result = content
				this.apiCallInfo.usage = final.usage || null
			} else {
				throw new Error('Unknown template')
			}

			this.insertNewLineThenScroll(editor, LnToWrite, ASSISTANT_MARK_END + '  ')
		} catch (error) {
			console.error('error', error)
			this.apiCallInfo.error = `${error}`
			this.apiCallInfo.endTime = new Date()
			this.insertNewLineThenScroll(editor, LnToWrite, `${ERROR_MARK} ${error}` + '  ')
		}
	}

	insertNewLineThenScroll(editor: Editor, LnToWrite: number, text: string) {
		editor.replaceRange(LINE_BREAK + text, { line: LnToWrite, ch: editor.getLine(LnToWrite).length })
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
}
