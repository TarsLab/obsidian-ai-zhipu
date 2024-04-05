export const LINE_BREAK = '  \n' // 两个空格加换行符, hard line break in markdown
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

/**
 * https://stackoverflow.com/questions/73691821/regex-for-matching-thematic-breaks-in-markdown
 * 
 * Explanation:

		^ - match start of line
		
		[ ]{0,3} - match optional up to 3 spaces

		([-*_]) - match either -, * or _ and put it in a group

		\s*\1\s*\1+\s* - match optional white spaces and the character from the first group twice

		$ - match end of line
 */
export const isHorizontalRuler = (line: string) => /^[ ]{0,3}([-*_])\s*(?:\1\s*){2,}$/gm.test(line)
