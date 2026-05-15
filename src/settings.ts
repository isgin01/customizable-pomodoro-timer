import {
	type App,
	type ToggleComponent,
	PluginSettingTab,
	Setting,
} from "obsidian"
import type BetterPomodoroPlugin from "./main"
import * as statusBar from "./status-bar"

export type PluginSettings = {
	workDurationSecs: number
	breakDurationSecs: number
	systemNotificationsPreferred: boolean
	continueAfterTimeIsUp: boolean
	showStatusBar: boolean
	showCustomView: boolean
	customNotificationSoundPath: string
}

export const DEFAULT_SETTINGS: PluginSettings = {
	workDurationSecs: 50 * 60,
	breakDurationSecs: 10 * 60,
	systemNotificationsPreferred: false,
	continueAfterTimeIsUp: false,
	showCustomView: true,
	showStatusBar: true,
	customNotificationSoundPath: "",
}

export class BetterPomodoroSettingsTab extends PluginSettingTab {
	plugin: BetterPomodoroPlugin

	constructor(app: App, plugin: BetterPomodoroPlugin) {
		super(app, plugin)
		this.plugin = plugin
	}

	display(): void {
		const { containerEl } = this

		containerEl.empty()

		new Setting(containerEl).setName("Status Bar").setHeading()

		new Setting(containerEl)
			.setName("Show Status Bar")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.showStatusBar)
					.onChange(async (val: boolean) => {
						this.plugin.settings.showStatusBar = val
						await this.plugin.saveSettings()

						// TODO:
						this.plugin.reflectSettingsChange((ctx) => {
							statusBar.alterVisibility(val, ctx.statusBarItem)
						})
					})
			})

		new Setting(containerEl).setName("Timer View").setHeading()

		new Setting(containerEl)
			.setName("Show Custom View")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.showCustomView)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.showCustomView = newValue
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (newValue) {
								ctx.loadCustomView()
							} else {
								ctx.hideCustomView()
							}
						})
					})
			})

		new Setting(containerEl).setName("Timer options").setHeading()

		new Setting(containerEl).setName("Work duration").addText((text) => {
			text.setPlaceholder("Enter time in minutes")
				.setValue(String(this.plugin.settings.workDurationSecs / 60))
				.onChange(async (i: string) => {
					let minutes = validateNumericInput(i)
					if (minutes) {
						this.plugin.settings.workDurationSecs = minutes * 60
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (!ctx.timer.getIsRunning()) {
								ctx.timer.reset()
							}
						})
					}
				})
		})

		new Setting(containerEl).setName("Break duration").addText((text) => {
			text.setPlaceholder("Enter time in minutes")
				.setValue(String(this.plugin.settings.breakDurationSecs / 60))
				.onChange(async (i: string) => {
					let minutes = validateNumericInput(i)
					if (minutes) {
						this.plugin.settings.breakDurationSecs = minutes * 60
						await this.plugin.saveSettings()

						this.plugin.reflectSettingsChange((ctx) => {
							if (!ctx.timer.getIsRunning()) {
								ctx.timer.reset()
							}
						})
					}
				})
		})

		new Setting(containerEl)
			.setName("Continue running after time is up")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.continueAfterTimeIsUp)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.continueAfterTimeIsUp = newValue
						await this.plugin.saveSettings()
					})
			})

		new Setting(containerEl).setName("Notifications").setHeading()

		new Setting(containerEl)
			.setName("Prefer system notification")
			.addToggle((component: ToggleComponent) => {
				component
					.setValue(this.plugin.settings.systemNotificationsPreferred)
					.onChange(async (newValue: boolean) => {
						this.plugin.settings.systemNotificationsPreferred =
							newValue
						await this.plugin.saveSettings()
					})
			})

		// TODO: sound toggle

		// TODO: sound path
		// new Settings(containerEl)
		// 	.setName("Custom notification sound")
		// 	.setValue("")
		// 	.setPlaceholder("path to the sound")

		// TODO: add button to check the sound
	}
}

// Check if given value is a valid amount of minutes
export function validateNumericInput(i: string): false | number {
	let num = Number(i)
	if (isNaN(num)) {
		return false
	}
	return num
}
