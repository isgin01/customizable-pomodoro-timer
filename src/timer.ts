import { type PluginSettings } from "settings"

type Event = "tick" | "elapsed" | "toggle"
type Callback = (time?: string) => void

type EventHandler = {
	event: Event
	cb: Callback
}

type Mode = "work" | "break"

type InitialState = {
	mode: Mode
	secsTODO: number
	secsLeft: number
	running: boolean
}

export class Timer {
	private readonly settings: PluginSettings

	private running: boolean
	private mode: Mode

	// TODO: need a better name, used to track how many seconds were when current mode started
	// in order for animations to work correctly
	private secsTODO: number
	private secsLeft: number

	private eventHandlers: EventHandler[] = []
	private intervalId: number | undefined

	constructor(settings: PluginSettings, initData?: InitialState) {
		// It's important to make sure that seetings are assigned first since
		// they can be used for other props initialization
		this.settings = settings

		if (initData) {
			this.running = initData.running
			this.mode = initData.mode
			this.secsTODO = initData.secsTODO
			this.secsLeft = initData.secsLeft
		} else {
			this.running = false
			this.mode = "work"
			this.resetSecs()
		}
	}

	private resetSecs() {
		this.secsTODO =
			this.mode == "work"
				? this.settings.workDurationSecs
				: this.settings.breakDurationSecs

		this.secsLeft = this.secsTODO
	}

	getIsRunning() {
		return this.running
	}

	getTotalSecs(): number {
		return this.secsTODO
	}

	getCurrentMode(): string {
		return this.mode
	}

	getTimeLeft(): {
		secs: number
		HFTime: string
	} {
		let seconds = this.secsLeft
		return {
			secs: seconds,
			HFTime: secondsToHF(seconds),
		}
	}

	registerEventHandler(event: Event, cb: Callback): void {
		this.eventHandlers.push({ event, cb })
	}

	toggle(): void {
		if (this.running) {
			this.stop()
		} else {
			this.start()
		}

		this.runEventHandlers("toggle")
	}

	private start(): void {
		this.running = true

		const oneSecondMillis = 1000

		// Use window.setInterval explicitly to avoid TS confusing
		// between NodeJS and Browser API
		this.intervalId = window.setInterval(() => {
			this.tick()
		}, oneSecondMillis)
	}

	private tick(): void {
		this.secsLeft--
		this.runEventHandlers("tick")
		if (this.secsLeft == 0) {
			this.runEventHandlers("elapsed")

			if (!this.settings.continueAfterTimeHasElapsed) {
				this.switch()
			}
		}
	}

	switch(): void {
		this.mode = this.mode == "work" ? "break" : "work"
		this.reset()
	}

	reset(): void {
		this.stop()
		this.resetSecs()
		this.runEventHandlers("tick")
		this.runEventHandlers("toggle")
	}

	private stop(): void {
		this.running = false

		window.clearInterval(this.intervalId)
	}

	private runEventHandlers(ev: Event) {
		this.eventHandlers.forEach((h) =>
			h.event == ev ? h.cb(this.getTimeLeft().HFTime) : undefined,
		)
	}

	destroy(): void {
		// TODO: add time left saving
	}
}

export function secondsToHF(secondsTotal: number) {
	// Add a minus sign to the string if the second count is negative
	// and make seconds positive to avoid getting minus signs when
	// dividing
	var humanTime = ""
	if (secondsTotal < 0) {
		humanTime = "-"
		secondsTotal *= -1
	}

	const secondsLeft = secondsTotal % 60
	const minutesTotal = (secondsTotal - secondsLeft) / 60
	const minutesLeft = minutesTotal % 60
	const hoursTotal = (minutesTotal - minutesLeft) / 60

	const paddedTimeUnits = [hoursTotal, minutesLeft, secondsLeft].map(
		(timeUnit) => String(timeUnit).padStart(2, "00"),
	)

	humanTime += paddedTimeUnits.join(":")

	return humanTime
}
