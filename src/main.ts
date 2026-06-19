import StatusBar from "./status-bar"
import {
	BetterPomodoroSettingsTab,
	DEFAULT_SETTINGS,
	type PluginSettings,
} from "./settings"
import { CustomView, PLUGIN_CUSTOM_VIEW_ID } from "./custom-view"
import { Notice, Plugin, TFile } from "obsidian"
import { Timer } from "./timer"
import { playSound } from "sound"

export default class BetterPomodoroPlugin extends Plugin {
	settings: PluginSettings
	timer: Timer
	statusBar: StatusBar
	// Needed to reflect settings
	customView: CustomView

	async onload() {
		await this.loadSettings()

		this.timer = new Timer(this.settings)

		this.timer.registerEventHandler("elapsed", () => {
			// Use a conditional expression because settings can changed during run
			// and the onload function would not be reloaded
			if (this.settings.playNotificationSound) {
				playSound(this.getFile(this.settings.customNotificationSound))
			}
		})

		// TODO: Custom message template
		this.timer.registerEventHandler("elapsed", () => {
			this.notify(`Time has elapsed`)
		})

		this.registerView(PLUGIN_CUSTOM_VIEW_ID, (leaf) => {
			this.customView = new CustomView(leaf, this.timer, this.settings)
			return this.customView
		})

		this.statusBar = new StatusBar(this.addStatusBarItem(), this.timer)
		this.statusBar.alterVisibility(this.settings.showStatusBar)

		this.addCommand({
			id: "toggle",
			name: "Toggle",
			callback: () => {
				this.timer.toggle()
			},
		})

		this.addCommand({
			id: "switch",
			name: "Switch",
			callback: () => {
				this.timer.switch()
			},
		})

		this.addCommand({
			id: "reset",
			name: "Reset",
			callback: () => {
				this.timer.reset()
			},
		})

		this.addSettingTab(new BetterPomodoroSettingsTab(this.app, this))
	}

	onunload() {
		// TODO:
	}

	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			(await this.loadData()) as Partial<PluginSettings>,
		)
	}

	loadCustomView() {
		if (this.settings.showCustomView) {
			var { workspace } = this.app
			var leaves = workspace.getLeavesOfType(PLUGIN_CUSTOM_VIEW_ID)
			if (!leaves.length) {
				var leaf = workspace.getRightLeaf(false)
				void leaf?.setViewState({
					type: PLUGIN_CUSTOM_VIEW_ID,
				})
			}
		}
	}

	hideCustomView() {
		var { workspace } = this.app
		workspace.detachLeavesOfType(PLUGIN_CUSTOM_VIEW_ID)
	}

	reflectSettingsChange(cb: (ctx: BetterPomodoroPlugin) => void) {
		cb(this)
	}

	async saveSettings() {
		await this.saveData(this.settings)
	}

	getFile(path: string) {
		var aFile = this.app.vault.getAbstractFileByPath(path)
		if (aFile instanceof TFile) {
			return this.app.vault.getResourcePath(aFile)
		}
		return ""
	}

	// TODO: show notification
	notify(text: string): void {
		if (this.settings.systemNotificationsPreferred) {
			systemNotify(text)
		} else {
			obsidianNotify(text)
		}
	}
}

function systemNotify(text: string) {
	var { Notification } = require("electron").remote

	new Notification({
		title: "Timer",
		body: text,
	}).show()
}

function obsidianNotify(text: string) {
	new Notice(text)
}
