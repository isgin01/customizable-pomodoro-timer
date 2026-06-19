import { DEFAULT_SETTINGS } from "../src/settings"
import StatusBar from "../src/status-bar"
import { Timer } from "../src/timer"

class FakeStatusBar extends HTMLElement {
	constructor() {
		super()
	}
}

jest.useFakeTimers()

window.customElements.define("fake-status-bar", FakeStatusBar)

it("initialization", () => {
	let settings = { ...DEFAULT_SETTINGS }
	settings.workSecs = 40 * 60

	var timer = new Timer(settings)
	var element = new FakeStatusBar()
	new StatusBar(element, timer)

	expect(element.innerHTML).toContain("<span>00:40:00</span>")

	timer.toggle()
	expect(timer.mode).toBe("work")
	expect(timer.running).toBe(true)

	jest.advanceTimersByTime(1000 * 60)
	expect(element.innerHTML).toContain("<span>00:39:00</span>")
	jest.advanceTimersByTime(1000 * 60 * 39)
	expect(element.innerHTML).toContain("<span>00:00:00</span>")
	jest.advanceTimersByTime(1000 * 60 * 10)
	expect(element.innerHTML).toContain("<span>-00:10:00</span>")
})

it("clicks", () => {
	let settings = { ...DEFAULT_SETTINGS }
	settings.workSecs = 40 * 60

	var timer = new Timer(settings)
	var element = new FakeStatusBar()

	new StatusBar(element, timer)

	expect(element.className).toContain("mod-clickable")

	let fakeToggle = jest.spyOn(timer, "toggle")
	let clickEvent = new Event("click")
	element.dispatchEvent(clickEvent)
	expect(fakeToggle).toHaveBeenCalledTimes(1)
})
