import { isLeft } from 'fp-ts/Either'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'
import * as yaml from 'js-yaml'
import { isUserMarkEnd, isUserMarkStart } from './mark'

export const Glm4 = 'glm-4',
	Cogview3 = 'cogview-3',
	Glm3Turbo = 'glm-3-turbo'

export const ImageGenerateParams = t.type({
	model: t.literal('cogview-3')
})

export const ChatParams = t.partial({
	model: t.union([t.literal(Glm4), t.literal(Glm3Turbo)]),
	temperature: t.number,
	top_p: t.number,
	max_tokens: t.number
})

export type ChatParams = t.TypeOf<typeof ChatParams>

export const KnowledgeChatParams = t.intersection([
	ChatParams,
	t.type({
		knowledge_id: t.string,
		prompt_template: t.string
	})
])

export type KnowledgeChatParams = t.TypeOf<typeof KnowledgeChatParams>

export const ApiParams = t.union([ImageGenerateParams, ChatParams, KnowledgeChatParams])

export type ApiParams = t.TypeOf<typeof ApiParams>

export interface PromptTemplate {
	readonly title: string
	readonly params: ApiParams
	readonly template: string
}

interface Line {
	index: number
	content: string
}

// https://help.obsidian.md/Plugins/Slides
const isDashDashDash = (line: string): boolean =>
	line.trim().startsWith('---') &&
	line
		.trim()
		.split('')
		.every((el) => el === '-') &&
	line.indexOf('-') < 3

export const getTemplates = (fileContent: string): PromptTemplate[] => {
	const lines: Line[] = fileContent.split('\n').map((el, index) => {
		return { content: el, index }
	})

	const dividers: Line[] = lines.filter((line) => isDashDashDash(line.content))
	const slidesLines = dividers.map((divider, index) =>
		lines.slice(divider.index + 1, dividers[index + 1] ? dividers[index + 1].index : undefined)
	)
	const templates = slidesLines.map((slide) => parseTemplate(slide)).filter((el) => el !== null) as PromptTemplate[]
	return templates
}

/*
	prompt里会不会包含一些特殊符号。比如markdown的语法。
	目前的结构是不允许slides 的 ‘---’ （被空行包围） 出现在prompt里的。这个语法用作分割符了，用户在编辑文档的时候会注意到这个问题的，从而避免这个问题。
*/
const parseTemplate = (lines: Line[]): PromptTemplate | null => {
	const headerIndex = lines.findIndex((line) => line.content.startsWith('## '))
	if (headerIndex === -1) {
		return null
	}
	const title = lines
		.slice(headerIndex, headerIndex + 1)
		.map((line) => line.content.slice(3))
		.join('\n')
		.trim()

	const commentStart = lines.findIndex((line) => line.content === '%%')
	const commentEnd = lines.findLastIndex((line) => line.content === '%%')
	let commentRaw: string | undefined = undefined
	if (commentStart != -1 && commentEnd > commentStart + 1) {
		commentRaw = lines
			.slice(commentStart + 1, commentEnd)
			.map((line) => line.content)
			.join('\n')
			.trim()
	}
	console.debug('commentRaw', commentRaw)
	const defaultParams: ChatParams = { model: Glm4 }
	const params = commentRaw ? parseComment(commentRaw) || defaultParams : defaultParams
	if (!params.model) {
		params.model = Glm4
	}
	const promptStart = lines.findIndex((line) => isUserMarkStart(line.content))
	const promptEnd = lines.findLastIndex((line) => isUserMarkEnd(line.content))
	if (promptStart === -1 || promptEnd === -1 || promptEnd <= promptStart) {
		return null
	}
	const prompt = lines
		.slice(promptStart + 1, promptEnd)
		.map((line) => line.content)
		.join('\n')
		.trim()

	return { title, params, template: prompt }
}

const parseComment = (comment: string): ApiParams | undefined => {
	try {
		const commentObject = yaml.load(comment)
		const decoded = ApiParams.decode(commentObject)
		if (isLeft(decoded)) {
			throw Error(`Could not validate data: ${PathReporter.report(decoded).join('\n')}`)
		}
		return decoded.right
	} catch (e) {
		console.error('parseComment', e)
		return undefined
	}
}
