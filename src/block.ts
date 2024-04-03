import {
	isAssistantMarkEnd,
	isAssistantMarkStart,
	isDashDashDash,
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

export const findMultiRoundRange = (lines: string[], end: number): MultiRoundRange | null => {
	let l = end
	for (; l >= 0; l--) {
		if (isDashDashDash(lines[l])) {
			if (l > 0 && isDashDashDash(lines[l - 1])) {
				// 如果上一行也是分割符，那么就是当前slide的开始了
				// TODO, 把 comment 也找出来
				return { _tag: 'multiRoundRange', start: l + 1, end: end - 1 }
			}
		}
	}
	return null
}

export const findPreMsgBlocks = (lines: string[], start: number, end: number): MsgBlock[] => {
	// 多轮对话相对单轮对话，格式更严格。必须是userMsg, assistantMsg, userMsg, assistantMsg这样的顺序
	const blocks: MsgBlock[] = []
	let i = start
	for (; i < lines.length; i++) {
		if (isMark(lines[i])) {
			if (!isUserMarkStart(lines[i])) {
				throw new Error('Invalid start mark line ' + i)
			}
			break
		}
	}
	do {
		// 要么没有找到 userMsgBlock，要么找到了 userMsgBlock + assistantMsgBlock
		const userMsgBlock = findUserMsgBlock(lines, i, end)
		if (userMsgBlock === null) break

		const assistantMsgBlock = findAssistantMsgBlock(lines, userMsgBlock.end + 1, end)
		if (!assistantMsgBlock) {
			throw new Error('Expect assistant msg block after line ' + userMsgBlock.end + 1 + ' but not found')
		}
		blocks.push(userMsgBlock)
		blocks.push(assistantMsgBlock)
		i = assistantMsgBlock.end + 1
	} while (i < end)

	return blocks
}

export const findUserMsgBlock = (lines: string[], start: number, end: number): UserMsgBlock | null => {
	let l = start
	for (; l < end; l++) {
		if (isUserMarkStart(lines[l])) break
		if (isMark(lines[l])) return null
	}
	if (l === end) return null
	const blockStart = l
	l++
	for (; l < end; l++) {
		if (isUserMarkEnd(lines[l])) break
		if (isMark(lines[l])) return null
	}
	if (l === end || l <= blockStart + 1) return null
	const content = lines.slice(blockStart + 1, l).join('\n')
	return { _tag: 'user', content: content, start: blockStart, end: l }
}

export const findAssistantMsgBlock = (lines: string[], start: number, end: number): AssistantMsgBlock | null => {
	let l = start
	for (; l < end; l++) {
		if (isAssistantMarkStart(lines[l])) break
		if (isMark(lines[l])) return null
	}
	if (l === end) return null
	const blockStart = l
	l++
	for (; l < end; l++) {
		if (isAssistantMarkEnd(lines[l])) break
		if (isMark(lines[l])) return null
	}
	if (l === end || l <= blockStart + 1) return null
	const content = lines.slice(blockStart + 1, l).join('\n')
	return { _tag: 'assistant', content: content, start: blockStart, end: l }
}

export const findCurrentBlock = (lines: string[], current: number): UserMsgBlock | AssistantMsgBlock | null => {
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
