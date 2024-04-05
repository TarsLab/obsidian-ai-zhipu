import { t } from './lang/helper'
import {
	isAssistantMarkEnd,
	isAssistantMarkStart,
	isHorizontalRuler,
	isMark,
	isMarkEnd,
	isMarkStart,
	isUserMarkEnd,
	isUserMarkStart
} from './mark'

interface MultiRoundRange {
	_tag: 'multiRoundRange'
	start: number
	end: number
	comment?: string
}

export interface UserMsgBlock {
	_tag: 'user'
	content: string
	start: number
	end: number
}

export interface AssistantMsgBlock {
	_tag: 'assistant'
	content: string
	start: number
	end: number
}

export type MsgBlock = UserMsgBlock | AssistantMsgBlock

/**
 * 多轮会话的开始标记是连续两行的水平线，例如两行的“---”，结束标记是一行水平线
 */
export const findMultiRoundRange = (lines: string[], end: number): MultiRoundRange | null => {
	let l = end
	for (; l >= 0; l--) {
		if (isHorizontalRuler(lines[l])) break	
	}
	if (l >= 1 && isHorizontalRuler(lines[l - 1])) {
		return { _tag: 'multiRoundRange', start: l + 1, end: end - 1 }
	}
	return null
}

export const findPreMsgBlocks = (lines: string[], start: number, end: number): MsgBlock[] => {
	let i = start
	for (; i < lines.length; i++) {
		if (isMark(lines[i])) {
			if (isMarkEnd(lines[i])) {
				throw new Error(t('Expect start mark, but found end mark at line ') + (i + 1))
			}
			break
		}
	}
	const blocks: MsgBlock[] = []
	do {
		const block = findMsgBlock(lines, i, end)
		if (block === null) break
		blocks.push(block)
		i = block.end + 1
	} while (i < end)
	return blocks
}

export const findMsgBlock = (lines: string[], start: number, end: number): MsgBlock | null => {
	let l = start
	for (; l < end; l++) {
		if (isMarkStart(lines[l])) break
		if (isMarkEnd(lines[l])) return null
	}
	if (l === end) return null
	const blockStart = l
	l++
	for (; l < end; l++) {
		if (isMarkEnd(lines[l])) break
		if (isMarkStart(lines[l])) return null
	}
	if (l === end || l <= blockStart + 1) return null
	const content = lines.slice(blockStart + 1, l).join('\n')

	if (isUserMarkStart(lines[blockStart]) && isUserMarkEnd(lines[l]))
		return { _tag: 'user', content: content, start: blockStart, end: l }
	if (isAssistantMarkStart(lines[blockStart]) && isAssistantMarkEnd(lines[l]))
		return { _tag: 'assistant', content: content, start: blockStart, end: l }
	return null
}

export const findBlockByCurrentLine = (lines: string[], current: number): UserMsgBlock | AssistantMsgBlock | null => {
	// 向上找 start 标记， 而且不能有 end 标记
	let start = isMarkEnd(lines[current]) ? current - 1 : current // 如果当前行是end标记，那么从上一行开始找。
	for (; start >= 0; start--) {
		if (isMarkStart(lines[start])) break
		if (isMarkEnd(lines[start])) return null
	}
	console.debug('start', start, lines[start])

	// 向下找 end 标记，而且不能有 start 标记
	let end = start === current ? current + 1 : current // 如果当前行是start标记，那么从下一行开始找。
	for (; end < lines.length; end++) {
		if (isMarkEnd(lines[end])) break
		if (isMarkStart(lines[end])) return null
	}

	console.debug('end', end, lines[end])
	if (start === -1 || end === lines.length) {
		return null
	}

	const content = lines.slice(start + 1, end).join('\n')
	if (isUserMarkStart(lines[start]) && isUserMarkEnd(lines[end])) return { _tag: 'user', content: content, start, end }
	if (isAssistantMarkStart(lines[start]) && isAssistantMarkEnd(lines[end]))
		return { _tag: 'assistant', content: content, start, end }

	return null
}

export const findNextEmptyAssistBlock = (lines: string[], from: number) => {
	let l = from
	let start = -1
	for (; l < lines.length; l++) {
		if (isAssistantMarkStart(lines[l])) {
			start = l
			break
		}

		if (lines[l].trim().length > 0) {
			return null
		}
		if (l > from + 2) {
			// too far
			return null
		}
	}
	if (start === -1) return null
	console.debug('start', start, lines[start])
	let end = -1
	for (l = start + 1; l < lines.length; l++) {
		if (isAssistantMarkEnd(lines[l])) {
			end = l
			break
		}
		if (lines[l].trim().length > 0) {
			return null
		}
		if (l > start + 3) {
			// too far
			return null
		}
	}
	if (end > start) return { start, end }
	return null
}
