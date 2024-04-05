import { isHorizontalRuler } from '../src/mark'

describe('examples from https://spec.commonmark.org/0.31.2/#thematic-breaks', () => {
	it('Example 43', () => {
		expect(isHorizontalRuler('***')).toBe(true)
		expect(isHorizontalRuler('---')).toBe(true)
		expect(isHorizontalRuler('___')).toBe(true)
	})

	describe('Wrong characters', () => {
		it('Example 44', () => {
			expect(isHorizontalRuler('+++')).toBe(false)
		})

		it('Example 45', () => {
			expect(isHorizontalRuler('===')).toBe(false)
		})
	})

	describe('Not enough characters', () => {
		it('Example 46', () => {
			expect(isHorizontalRuler('--')).toBe(false)
			expect(isHorizontalRuler('**')).toBe(false)
			expect(isHorizontalRuler('__')).toBe(false)
		})
	})

	describe('Up to three spaces of indentation are allowed', () => {
		it('Example 47', () => {
			expect(isHorizontalRuler(' ***')).toBe(true)
			expect(isHorizontalRuler('  ***')).toBe(true)
			expect(isHorizontalRuler('   ***')).toBe(true)
		})

		it('Example 48', () => {
			expect(isHorizontalRuler('    ***')).toBe(false)
		})
	})

	describe('More than three characters may be used', () => {
		it('Example 50', () => {
			expect(isHorizontalRuler('_____________________________________')).toBe(true)
		})
	})

	describe('Spaces and tabs are allowed between the characters', () => {
		it('Example 51', () => {
			expect(isHorizontalRuler(' - - -')).toBe(true)
		})

		it('Example 52', () => {
			expect(isHorizontalRuler(' **  * ** * ** * **')).toBe(true)
		})
		it('Example 53', () => {
			expect(isHorizontalRuler('-     -      -      -')).toBe(true)
		})
	})

	describe('Spaces and tabs are allowed at the end', () => {
		it('Example 54', () => {
			expect(isHorizontalRuler('- - - -    ')).toBe(true)
		})
	})

	describe('No other characters may occur in the line', () => {
		it('Example 55', () => {
			expect(isHorizontalRuler('_ _ _ _ a')).toBe(false)
			expect(isHorizontalRuler('a------')).toBe(false)
			expect(isHorizontalRuler('---a---')).toBe(false)
		})
	})

	describe('All of the characters other than spaces or tabs be the same', () => {
		it('Example 56', () => {
			expect(isHorizontalRuler(' *-*')).toBe(false)
		})
	})
})
