import { isUserMarkEnd, isUserMarkStart } from './mark'

export interface PromptTemplate {
	title: string
	template: string
	model?: string
	temperature?: number
	top_p?: number
}

/**
 * comment做容错处理。如果comment解析失败，
 */
export interface TemplateSlide {
	readonly title: string
	readonly comment?: string
	readonly prompt: string
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

const isNewline = (line: string): boolean => line.trim() === ''

export const toPromptTemplate = (templateSlide: TemplateSlide): PromptTemplate => {
	const { title, prompt } = templateSlide
	// const template = comment ? `${comment}\n\n${prompt}` : prompt
	return { title, template: prompt }
}

export const getTemplates = (fileContent: string): TemplateSlide[] => {
	const lines: Line[] = fileContent.split('\n').map((el, index) => {
		return { content: el, index }
	})

	const dividers: Line[] = []
	for (let i = 0; i < lines.length; i++) {
		if (isDashDashDash(lines[i].content)) {
			const aboveIsNewline = lines[i - 1] ? isNewline(lines[i - 1].content) : false
			const belowIsNewline = lines[i + 1] ? isNewline(lines[i + 1].content) : false
			if (aboveIsNewline && belowIsNewline) {
				dividers.push(lines[i])
			}
		}
	}

	const lastIndex = lines.length - 1
	const slide_ranges: [number, number][] = []
	for (let i = 0; i < dividers.length; i++) {
		const start = dividers[i].index + 1
		const end = dividers[i + 1] ? dividers[i + 1].index - 1 : lastIndex
		if (end > start) {
			slide_ranges.push([start, end])
		}
	}

	const slides_lines = slide_ranges.map((range) => lines.slice(range[0], range[1] + 1))
	const templates = slides_lines.map((slide) => parseTemplate(slide)).filter((el) => el !== null) as TemplateSlide[]
	return templates
}

/*
	prompt里会不会包含一些特殊符号。比如markdown的语法。
	目前的结构是不允许slides 的 ‘---’ （被空行包围） 出现在prompt里的。这个语法用作分割符了，用户在编辑文档的时候会注意到这个问题的，从而避免这个问题。
  先找到第一个符合的标题。标题之前的部分是注释，标题之后的部分是prompt。

 {{ 注释，技术参数 }}
*/
const parseTemplate = (lines: Line[]): TemplateSlide | null => {
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
	let comment: string | undefined = undefined
	if (commentStart != -1 && commentEnd > commentStart) {
		comment = lines
			.slice(commentStart + 1, commentEnd)
			.map((line) => line.content)
			.join('\n')
			.trim()
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

	return { title, comment: comment, prompt }
}
