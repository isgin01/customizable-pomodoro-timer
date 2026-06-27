import {
	Params,
	recoverableTimerState as RecoverableTimerState,
	Timer,
} from '../src/timer'

jest.useFakeTimers()

var work = { name: 'work', secs: 60 }
var _break = { name: 'break', secs: 10 }
var longBreak = { name: 'long', secs: 30 }

var standardModes = [work, _break, longBreak]

function getParameters(propsNeededToRunSuccessfully?: Partial<Params>): Params {
	let empty_settings: Params = {
		keepRunning: false,
		autostart: false,
	}

	return {
		...empty_settings,
		...propsNeededToRunSuccessfully,
	}
}

describe('features', () => {
	test('toggle', () => {
		var timer = new Timer(standardModes, getParameters())
		expect(timer.running).toBe(false)
		expect(timer.remaining).toBe(60)

		timer.toggle()
		expect(timer.running).toBe(true)
		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(59)

		timer.toggle()
		expect(timer.running).toBe(false)
		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(59)
	})

	test('reset time', () => {
		var timer = new Timer([work], getParameters())

		let testCb = jest.fn()
		timer.on(['reset'], testCb)
		expect(testCb).toHaveBeenCalledTimes(0)
		timer.reset()
		expect(testCb).toHaveBeenCalledTimes(1)

		timer.toggle()
		jest.advanceTimersByTime(1000 * 1)
		expect(timer.remaining).toBe(work.secs - 1)

		timer.reset()
		expect(timer.remaining).toBe(work.secs)
		expect(testCb).toHaveBeenCalledTimes(2)
	})

	test('switch', () => {
		let modes = [work, _break, longBreak]
		var timer = new Timer(modes, getParameters())
		expect(timer.currentMode.name).toBe('work')
		timer.switch()
		expect(timer.currentMode.name).toBe('break')
		timer.switch()
		expect(timer.currentMode.name).toBe('long')
		timer.switch()
		expect(timer.currentMode.name).toBe('work')
	})

	test('reset progres', () => {
		var timer = new Timer([work, _break, longBreak], getParameters())
		expect(timer.currentMode.name).toBe('work')
		timer.switch()
		expect(timer.currentMode.name).toBe('break')
		expect(timer.remaining).toBe(_break.secs)
		timer.resetProgress()
		expect(timer.currentMode.name).toBe('work')
		expect(timer.remaining).toBe(work.secs)

		// Check in case smb accidently makes them equal in the future
		expect(work.secs).not.toBe(_break.secs)
	})

	test('stop when elapsed', () => {
		var timer = new Timer(
			[work, _break],
			getParameters({ keepRunning: false }),
		)
		timer.toggle()
		jest.advanceTimersByTime(1000 * work.secs + 10)
		expect(timer.running).toBe(false)
		expect(timer.currentMode.name).toBe('break')
		expect(timer.remaining).toBe(10)
	})

	test('continue when elapsed', () => {
		var timer = new Timer(
			[work, _break],
			getParameters({ keepRunning: true }),
		)
		timer.toggle()
		jest.advanceTimersByTime(1000 * work.secs)
		expect(timer.running).toBe(true)
		expect(timer.currentMode.name).toBe('work')
		expect(timer.remaining).toBe(0)
		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(-1)
		jest.advanceTimersByTime(1000 * 3599)
		expect(timer.remaining).toBe(-3600)
	})

	test('autostart', () => {
		var timer = new Timer(standardModes, getParameters({ autostart: true }))
		expect(timer.currentMode.name).toBe('work')
		timer.toggle()
		jest.advanceTimersByTime(1000 * 60)
		expect(timer.currentMode.name).toBe('break')
		expect(timer.running).toBe(true)
		expect(timer.remaining).toBe(10)
		jest.advanceTimersByTime(1000 * 10)
		expect(timer.remaining).toBe(30)
	})
})

test('event handler func called correct amount of times', () => {
	var timer = new Timer(
		standardModes,
		getParameters({
			keepRunning: true,
		}),
	)

	let cb = jest.fn()
	timer.on(['tick'], cb)
	timer.toggle()

	jest.advanceTimersByTime(1000)
	expect(cb).toHaveBeenCalledTimes(1)
	jest.advanceTimersByTime(1000)
	expect(cb).toHaveBeenCalledTimes(2)
	jest.advanceTimersByTime(1000 * 60)
	expect(cb).toHaveBeenCalledTimes(62)
	jest.advanceTimersByTime(1000 * 60 * 60 * 10)
	expect(cb).toHaveBeenCalledTimes(36062)

	timer.toggle() // stop
	jest.advanceTimersByTime(1000 * 60)
	expect(cb).toHaveBeenCalledTimes(36062)
})

test('HF time display', () => {
	var timer = new Timer(
		[
			{
				name: 'work',
				secs: 60 * 60 * 24,
			},
		],
		getParameters({
			keepRunning: true,
		}),
	)

	expect(timer.HFTime).toBe('24:00:00')

	timer.toggle()

	jest.advanceTimersByTime(1000)
	expect(timer.HFTime).toBe('23:59:59')

	jest.advanceTimersByTime(1000 * 60)
	expect(timer.HFTime).toBe('23:58:59')

	jest.advanceTimersByTime(1000 * 60 * 60 * 23)
	expect(timer.HFTime).toBe('00:58:59')

	jest.advanceTimersByTime(1000 * 60 * 58)
	expect(timer.HFTime).toBe('00:00:59')

	jest.advanceTimersByTime(1000 * 59)
	expect(timer.HFTime).toBe('00:00:00')

	jest.advanceTimersByTime(1000 * 60)
	expect(timer.HFTime).toBe('-00:01:00')

	jest.advanceTimersByTime(1000 * 60 * 60 * 11)
	expect(timer.HFTime).toBe('-11:01:00')
})

describe('recover timer state from supplied initial state', () => {
	var recoverableState: RecoverableTimerState = {
		modeIdx: 0,
		unmodified: 10,
		remaining: 10,
		running: false,
	}

	test('init', () => {
		var timer = new Timer(standardModes, getParameters(), recoverableState)
		expect(timer.currentMode.name).toBe('work')
		expect(timer.unmodified).toBe(10)
		expect(timer.remaining).toBe(10)
		expect(timer.running).toBe(false)
	})

	test('running: true', () => {
		recoverableState.running = true
		var timer = new Timer(standardModes, getParameters(), recoverableState)
		expect(timer.running).toBe(true)
		expect(timer.remaining).toBe(10)
		jest.advanceTimersByTime(1000 * 5)
		expect(timer.remaining).toBe(5)
	})

	test('running: false', () => {
		recoverableState.running = false
		recoverableState.remaining = 5
		var timer = new Timer(standardModes, getParameters(), recoverableState)
		expect(timer.remaining).toBe(5)
		jest.advanceTimersByTime(1000)
		expect(timer.remaining).toBe(5)
	})
})

test('recoverable session state obtaining', () => {
	var timer = new Timer(standardModes, getParameters())
	expect(timer.recoverableState).toStrictEqual<RecoverableTimerState>({
		modeIdx: 0,
		running: false,
		unmodified: 60,
		remaining: 60,
	})
	timer.toggle()
	expect(timer.running).toBe(true)
	jest.advanceTimersByTime(1000 * 5)
	expect(timer.remaining).toBe(55)
})
