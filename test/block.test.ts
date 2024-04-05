import dedent from 'ts-dedent'
import { findMultiRoundRange, findPreMsgBlocks } from '../src/block'

describe('findPreMsgBlocks', () => {
	it('should find pre blocks', () => {
		const content = dedent`
0这是开头

---
---

✨💡  
6 什么是纯函数？  
💡✨  
✨💬  
9 第1轮回答
💬✨  

✨💡  
13 纯函数的优点是什么？ 
💡✨    
✨💬  
16 第2轮回答  
💬✨  

19 新的一轮提问
		`
		const lines = content.split('\n')
		const current = 19
		const range = findMultiRoundRange(lines, current)
		expect(range).toMatchObject({ start: 4, end: 18 })
		if (range) {
			const preBlocks = findPreMsgBlocks(lines, range.start, range.end)
			expect(preBlocks[0]).toMatchObject({ _tag: 'user', content: '6 什么是纯函数？  ', start: 5, end: 7 })
			expect(preBlocks[1]).toMatchObject({ _tag: 'assistant', content: '9 第1轮回答', start: 8, end: 10 })
			expect(preBlocks[2]).toMatchObject({ _tag: 'user', content: '13 纯函数的优点是什么？ ', start: 12, end: 14 })
			expect(preBlocks[3]).toMatchObject({ _tag: 'assistant', content: '16 第2轮回答  ', start: 15, end: 17 })
		}
	})
})

describe('throw error in English', () => {
	beforeEach(() => {
		const mockLocalStorage = {
			getItem: jest.fn((key) => {
				console.log('getItem', key)
				if (key === 'language') return 'en'
				return undefined
			})
		}
		global.window = Object.create(window)
		Object.defineProperty(window, 'localStorage', {
			value: mockLocalStorage
		})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('should throw error: Expect start mark, but found end mark', () => {
		const content = dedent`
0这是开头

---
---

💡✨ 
✨💬  
7 第1轮回答
💬✨  

✨💡  
11 纯函数的优点是什么？ 
💡✨    
✨💬  
14 第2轮回答  
💬✨  

17 新的一轮提问
		`
		const lines = content.split('\n')
		const current = 17
		const range = findMultiRoundRange(lines, current)
		expect(range).toMatchObject({ start: 4, end: 16 })
		if (range) {
			const findFn = () => findPreMsgBlocks(lines, range.start, range.end)
			expect(findFn).toThrow('Expect start mark, but found end mark at line 6')
		}
	})
})
