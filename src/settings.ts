import { App, PluginSettingTab, Setting } from "obsidian";
import type GymPlugin from "./main";

export class GymSettingsTab extends PluginSettingTab {
  constructor(app: App, private plugin: GymPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Gym — Einstellungen" });

    containerEl.createEl("h3", { text: "Ordner" });

    new Setting(containerEl)
      .setName("Plans-Ordner")
      .setDesc("Wo Trainingspläne abgelegt werden.")
      .addText((t) =>
        t
          .setValue(this.plugin.settings.plansFolder)
          .onChange(async (v) => {
            this.plugin.settings.plansFolder = v || "Gym/Plans";
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl).setName("Sessions-Ordner").addText((t) =>
      t.setValue(this.plugin.settings.sessionsFolder).onChange(async (v) => {
        this.plugin.settings.sessionsFolder = v || "Gym/Sessions";
        await this.plugin.saveSettings();
      }),
    );

    new Setting(containerEl).setName("Exercises-Ordner").addText((t) =>
      t.setValue(this.plugin.settings.exercisesFolder).onChange(async (v) => {
        this.plugin.settings.exercisesFolder = v || "Gym/Exercises";
        await this.plugin.saveSettings();
      }),
    );

    new Setting(containerEl).setName("Workouts-Ordner").addText((t) =>
      t.setValue(this.plugin.settings.workoutsFolder).onChange(async (v) => {
        this.plugin.settings.workoutsFolder = v || "Gym/Workouts";
        await this.plugin.saveSettings();
      }),
    );

    containerEl.createEl("h3", { text: "Defaults" });

    new Setting(containerEl)
      .setName("Standard-Sets")
      .addText((t) =>
        t.setValue(String(this.plugin.settings.defaultSets)).onChange(async (v) => {
          const n = parseInt(v);
          if (!isNaN(n) && n > 0) {
            this.plugin.settings.defaultSets = n;
            await this.plugin.saveSettings();
          }
        }),
      );

    new Setting(containerEl)
      .setName("Standard-Rep-Range")
      .addText((t) =>
        t
          .setPlaceholder("min")
          .setValue(String(this.plugin.settings.defaultRepRange[0]))
          .onChange(async (v) => {
            const n = parseInt(v);
            if (!isNaN(n)) {
              this.plugin.settings.defaultRepRange[0] = n;
              await this.plugin.saveSettings();
            }
          }),
      )
      .addText((t) =>
        t
          .setPlaceholder("max")
          .setValue(String(this.plugin.settings.defaultRepRange[1]))
          .onChange(async (v) => {
            const n = parseInt(v);
            if (!isNaN(n)) {
              this.plugin.settings.defaultRepRange[1] = n;
              await this.plugin.saveSettings();
            }
          }),
      );

    new Setting(containerEl)
      .setName("Standard-Pause (Sekunden)")
      .addText((t) =>
        t.setValue(String(this.plugin.settings.defaultRestSeconds)).onChange(async (v) => {
          const n = parseInt(v);
          if (!isNaN(n) && n >= 0) {
            this.plugin.settings.defaultRestSeconds = n;
            await this.plugin.saveSettings();
          }
        }),
      );

    new Setting(containerEl)
      .setName("Gewichts-Einheit")
      .addDropdown((dd) =>
        dd
          .addOption("kg", "kg")
          .addOption("lbs", "lbs")
          .setValue(this.plugin.settings.weightUnit)
          .onChange(async (v) => {
            this.plugin.settings.weightUnit = v as "kg" | "lbs";
            await this.plugin.saveSettings();
          }),
      );
  }
}
