export const LINE_BREAK = '  \n'	// 两个空格加换行符, hard line break in markdown
export const USER_MARK_START = '✨💡'
export const USER_MARK_END = '💡✨'
export const ASSISTANT_MARK_START = '✨💬'
export const ASSISTANT_MARK_END = '💬✨'
export const ERROR_MARK = '❌'

export const isUserMarkStart = (line: string) =>
	line.trim() === USER_MARK_START && line.length - line.trimStart().length <= 2 // 前面的空格不允许超过2个
export const isUserMarkEnd = (line: string) =>
	line.trim() === USER_MARK_END && line.length - line.trimStart().length <= 2
export const isAssistantMarkStart = (line: string) =>
	line.trim() === ASSISTANT_MARK_START && line.length - line.trimStart().length <= 2
export const isAssistantMarkEnd = (line: string) =>
	line.trim() === ASSISTANT_MARK_END && line.length - line.trimStart().length <= 2

export const isMarkStart = (line: string) => isUserMarkStart(line) || isAssistantMarkStart(line)
export const isMarkEnd = (line: string) => isUserMarkEnd(line) || isAssistantMarkEnd(line)
export const isMark = (line: string) => isMarkStart(line) || isMarkEnd(line)

// https://help.obsidian.md/Plugins/Slides
export const isDashDashDash = (line: string): boolean =>
	line.trim().startsWith('---') &&
	line
		.trim()
		.split('')
		.every((el) => el === '-') &&
	line.indexOf('-') < 3
