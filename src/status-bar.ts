import { Menu } from "obsidian"
import { type Timer } from "./timer"

export default class StatusBar {
	private element: HTMLElement

	constructor(element: HTMLElement, timer: Timer) {
		this.element = element

		// Make the status bar clickable
		element.className += " mod-clickable"

		element.addEventListener("click", () => {
			timer.toggle()
		})

		// Menu that will appear on auxclick

		let menu = new Menu()

		menu.addItem((i) => {
			i.setTitle("Reset").onClick(() => timer.reset())
		})
		menu.addItem((i) => {
			i.setTitle("Switch").onClick(() => timer.switch())
		})

		element.addEventListener("auxclick", (ev) => {
			menu.showAtMouseEvent(ev)
		})

		let timeUpdateHandler = (HFTime: string) => {
			element.innerHTML = `<span>${HFTime}</span>`
		}

		// Set initial value

		timeUpdateHandler(timer.HFTime)

		timer.registerEventHandler("tick", timeUpdateHandler)
	}

	alterVisibility(show: boolean) {
		if (show) {
			this.element.style.display = "block"
		} else {
			this.element.style.display = "none"
		}
	}
}
