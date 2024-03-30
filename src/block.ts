import {
	isAssistantMarkEnd,
	isAssistantMarkStart,
	isMarkEnd,
	isMarkStart,
	isUserMarkEnd,
	isUserMarkStart
} from './mark'

export const findCurrentBlock = (
	lines: string[],
	current: number
): {
	type: 'user' | 'assistant'
	content: string
	start: number
	end: number
} | null => {
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
	if (isUserMarkStart(lines[start]) && isUserMarkEnd(lines[end])) return { type: 'user', content: content, start, end }
	if (isAssistantMarkStart(lines[start]) && isAssistantMarkEnd(lines[end]))
		return { type: 'assistant', content: content, start, end }

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
