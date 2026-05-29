import { ItemView, WorkspaceLeaf, setIcon } from "obsidian"

import { type Timer } from "./timer"
import { PluginSettings } from "settings"

export const PLUGIN_CUSTOM_VIEW_ID = "better-pomodoro-view"

export class CustomView extends ItemView {
	private timer: Timer
	private settings: PluginSettings

	private toggleBtn: HTMLButtonElement
	private resetBtn: HTMLButtonElement
	private switchBtn: HTMLButtonElement

	private remainingTimeCircle: SVGElement
	private elapsedTimeCircle: SVGCircleElement

	constructor(leaf: WorkspaceLeaf, timer: Timer, settings: PluginSettings) {
		super(leaf)
		this.timer = timer
		this.containerEl.empty()
		this.icon = "timer"
		this.settings = settings

		var container = this.containerEl.createDiv({
			cls: "custom-view-container",
		})
		var animationContainer = container.createDiv({
			cls: "animation-container",
		})
		var svg = animationContainer.createSvg("svg")

		// The order is important to make the elapsed circle appear above
		// the default one
		this.remainingTimeCircle = svg.createSvg("circle", {
			attr: { id: "default", cx: 70, cy: 70, r: 70, "stroke-width": 2 },
		})

		this.elapsedTimeCircle = svg.createSvg("circle", {
			attr: { id: "elapsed", cx: 70, cy: 70, r: 60, "stroke-width": 20 },
		})
		this.setElapsedCircleReach()

		svg.createSvg("circle", {
			attr: { id: "bg", cx: 70, cy: 70, r: 60, "stroke-width": 8 },
		})

		this.setColors()

		// TODO: work/break text
		// TODO: hover and click effects
		var timeContainer = container.createSpan({ cls: "time-container" })
		timeContainer.innerHTML = timer.getTimeLeft().HFTime
		var btnContainer = container.createDiv({ cls: "btn-container" })
		this.toggleBtn = btnContainer.createEl("button", {
			text: "Toggle",
			cls: "toggle",
		})
		this.resetBtn = btnContainer.createEl("button", {
			text: "Reset",
			cls: "reset",
		})
		this.switchBtn = btnContainer.createEl("button", {
			text: "Switch",
			cls: "switch",
		})

		this.toggleBtn.addEventListener("click", () => {
			this.timer.toggle()
			this.updateToggleBtnIcon()
		})
		this.updateToggleBtnIcon()

		this.resetBtn.addEventListener("click", () => {
			this.timer.reset()
			this.updateToggleBtnIcon()
		})
		setIcon(this.resetBtn, "reset")

		this.switchBtn.addEventListener("click", () => {
			this.timer.switch()
			this.updateToggleBtnIcon()
		})
		setIcon(this.switchBtn, "switch")

		this.timer.registerUpdateCallback("tick", (HFTime: string) => {
			timeContainer.innerText = HFTime
			this.setElapsedCircleReach()
		})
		this.timer.registerUpdateCallback("toggle", () => {
			this.updateToggleBtnIcon()
		})
	}

	setColors() {
		this.remainingTimeCircle.style.fill =
			this.settings.customViewColors.default
		this.elapsedTimeCircle.style.stroke =
			this.settings.customViewColors.elapsed
	}

	private updateModeBanner() {
		var m = this.timer.getCurrentMode()
	}

	private updateToggleBtnIcon() {
		setIcon(this.toggleBtn, this.timer.getIsRunning() ? "pause" : "play")
	}

	private setElapsedCircleReach() {
		this.elapsedTimeCircle.style.strokeDashoffset = String(
			(this.timer.getTimeLeft().secs / this.timer.getTotalSecs()) * 440,
		)
	}

	getViewType() {
		return PLUGIN_CUSTOM_VIEW_ID
	}

	getDisplayText() {
		return "Pomodoro view"
	}

	async onClose() {
		// TODO:
	}
}
