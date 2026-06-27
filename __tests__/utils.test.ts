import { isProperNumber } from '../src/utils'

describe(`${isProperNumber.name} tests`, () => {
	it('boundaries', () => {
		expect(isProperNumber('')).toBe(0)
		expect(isProperNumber('1')).toBe(1)
		expect(isProperNumber('30')).toBe(30)
		expect(isProperNumber('120')).toBe(120)
	})
	it('points', () => {
		expect(isProperNumber('0.5')).toBe(0.5)
		expect(isProperNumber('.5')).toBe(0.5)
		expect(isProperNumber('1.')).toBe(1)
	})
	it('not a number', () => {
		expect(isProperNumber('test')).toBe(false)
		expect(isProperNumber('$')).toBe(false)
		expect(isProperNumber('.')).toBe(false)
	})
	it('excessive symbols', () => {
		expect(isProperNumber('3,0')).toBe(false)
		expect(isProperNumber('0..5')).toBe(false)
		expect(isProperNumber('.5$')).toBe(false)
		expect(isProperNumber('1-20')).toBe(false)
	})
})
