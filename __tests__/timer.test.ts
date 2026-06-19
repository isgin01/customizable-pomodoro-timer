import { Timer } from "../src/timer"
import { DEFAULT_SETTINGS, PluginSettings } from "../src/settings"

jest.useFakeTimers()

var sec = 1000

it("toggle", () => {
	var timer = new Timer(DEFAULT_SETTINGS)
	expect(timer.running).toBe(false)
	timer.toggle()
	expect(timer.running).toBe(true)
	timer.toggle()
	expect(timer.running).toBe(false)
})

it("event handler is called correct amount of times", () => {
	var timer = new Timer(DEFAULT_SETTINGS)

	let cb = jest.fn()
	timer.registerEventHandler("tick", cb)
	timer.toggle()

	jest.advanceTimersByTime(sec)
	expect(cb).toHaveBeenCalledTimes(1)
	jest.advanceTimersByTime(sec)
	expect(cb).toHaveBeenCalledTimes(2)
	jest.advanceTimersByTime(sec * 60)
	expect(cb).toHaveBeenCalledTimes(62)
	jest.advanceTimersByTime(sec * 60 * 60 * 10)
	expect(cb).toHaveBeenCalledTimes(36062)

	timer.toggle() // stop
	jest.advanceTimersByTime(sec * 60)
	expect(cb).toHaveBeenCalledTimes(36062)
})

it("HF time display", () => {
	let settings: PluginSettings = {
		...DEFAULT_SETTINGS,
		workSecs: 60 * 60 * 24,
	}
	var timer = new Timer(settings)

	expect(timer.HFTime).toBe("24:00:00")

	timer.toggle()

	jest.advanceTimersByTime(sec)
	expect(timer.HFTime).toBe("23:59:59")

	jest.advanceTimersByTime(sec * 60)
	expect(timer.HFTime).toBe("23:58:59")

	jest.advanceTimersByTime(sec * 60 * 60 * 23)
	expect(timer.HFTime).toBe("00:58:59")

	jest.advanceTimersByTime(sec * 60 * 58)
	expect(timer.HFTime).toBe("00:00:59")

	jest.advanceTimersByTime(sec * 59)
	expect(timer.HFTime).toBe("00:00:00")

	jest.advanceTimersByTime(sec * 60)
	expect(timer.HFTime).toBe("-00:01:00")

	jest.advanceTimersByTime(sec * 60 * 60 * 11)
	expect(timer.HFTime).toBe("-11:01:00")
})

it("switch", () => {
	let settings: PluginSettings = {
		...DEFAULT_SETTINGS,
		workSecs: 60 * 60,
		breakSecs: 60 * 10,
	}
	var timer = new Timer(settings)

	expect(timer.HFTime).toBe("01:00:00")
	timer.switch()
	expect(timer.HFTime).toBe("00:10:00")
})
