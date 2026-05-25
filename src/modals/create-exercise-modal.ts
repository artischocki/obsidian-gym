import { App, Modal, Notice, Setting } from "obsidian";
import { GymStore } from "../data";
import { GymSettings } from "../types";

export class CreateExerciseModal extends Modal {
  private name = "";
  private muscleGroups = "";
  private repMin: number;
  private repMax: number;
  private sets: number;
  private rest: number;

  constructor(
    app: App,
    private store: GymStore,
    private settings: GymSettings,
    private onCreated: () => void,
  ) {
    super(app);
    this.repMin = settings.defaultRepRange[0];
    this.repMax = settings.defaultRepRange[1];
    this.sets = settings.defaultSets;
    this.rest = settings.defaultRestSeconds;
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Übung erstellen" });

    new Setting(contentEl).setName("Name").addText((t) =>
      t.setPlaceholder("z.B. Bench Press").onChange((v) => (this.name = v)),
    );
    new Setting(contentEl)
      .setName("Muskelgruppen")
      .setDesc("Komma-getrennt, z.B. chest, triceps")
      .addText((t) => t.onChange((v) => (this.muscleGroups = v)));
    new Setting(contentEl)
      .setName("Rep range")
      .addText((t) =>
        t
          .setPlaceholder("min")
          .setValue(String(this.repMin))
          .onChange((v) => (this.repMin = parseInt(v) || this.repMin)),
      )
      .addText((t) =>
        t
          .setPlaceholder("max")
          .setValue(String(this.repMax))
          .onChange((v) => (this.repMax = parseInt(v) || this.repMax)),
      );
    new Setting(contentEl).setName("Sets").addText((t) =>
      t.setValue(String(this.sets)).onChange((v) => (this.sets = parseInt(v) || this.sets)),
    );
    new Setting(contentEl)
      .setName(`Pause (Sekunden)`)
      .addText((t) =>
        t.setValue(String(this.rest)).onChange((v) => (this.rest = parseInt(v) || this.rest)),
      );

    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Erstellen")
        .setCta()
        .onClick(async () => {
          if (!this.name.trim()) {
            new Notice("Bitte einen Namen eingeben");
            return;
          }
          await this.store.createExercise(this.name.trim(), {
            muscleGroups: this.muscleGroups
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            repRange: [this.repMin, this.repMax],
            sets: this.sets,
            restSeconds: this.rest,
          });
          new Notice(`Übung "${this.name}" angelegt`);
          this.close();
          this.onCreated();
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
