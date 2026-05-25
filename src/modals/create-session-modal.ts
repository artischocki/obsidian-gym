import { App, Modal, Notice, Setting } from "obsidian";
import { GymStore } from "../data";
import { Exercise, SessionExerciseRef } from "../types";

export class CreateSessionModal extends Modal {
  private name = "";
  private picked: SessionExerciseRef[] = [];

  constructor(
    app: App,
    private store: GymStore,
    private availableExercises: Exercise[],
    private onCreated: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Trainingseinheit erstellen" });

    if (this.availableExercises.length === 0) {
      contentEl.createEl("p", {
        text: "Du hast noch keine Übungen. Erstelle erst Übungen.",
        cls: "gym-empty",
      });
      return;
    }

    new Setting(contentEl).setName("Name").addText((t) =>
      t.setPlaceholder("z.B. Push Day").onChange((v) => (this.name = v)),
    );

    contentEl.createEl("h3", { text: "Übungen" });
    const listEl = contentEl.createDiv();
    const rebuildList = (): void => {
      listEl.empty();
      this.picked.forEach((p, i) => {
        const row = listEl.createDiv({ cls: "gym-row" });
        row.createEl("span", { text: `${i + 1}.` });
        row.createEl("span", { text: p.exercise });
        const setsInput = row.createEl("input", { type: "number" });
        setsInput.placeholder = "sets";
        setsInput.value = p.sets !== undefined ? String(p.sets) : "";
        setsInput.style.width = "60px";
        setsInput.addEventListener("change", () => {
          const n = parseInt(setsInput.value);
          if (!isNaN(n)) p.sets = n;
        });

        const repMin = row.createEl("input", { type: "number" });
        repMin.placeholder = "min";
        repMin.style.width = "55px";
        repMin.addEventListener("change", () => {
          const n = parseInt(repMin.value);
          if (!isNaN(n)) p.repRange = [n, p.repRange?.[1] ?? n];
        });
        const repMax = row.createEl("input", { type: "number" });
        repMax.placeholder = "max";
        repMax.style.width = "55px";
        repMax.addEventListener("change", () => {
          const n = parseInt(repMax.value);
          if (!isNaN(n)) p.repRange = [p.repRange?.[0] ?? n, n];
        });

        const rm = row.createEl("button", { text: "✕" });
        rm.addEventListener("click", () => {
          this.picked.splice(i, 1);
          rebuildList();
        });
      });
    };

    new Setting(contentEl).setName("Übung hinzufügen").addDropdown((dd) => {
      dd.addOption("", "— wählen —");
      for (const ex of this.availableExercises) dd.addOption(ex.name, ex.name);
      dd.onChange((v) => {
        if (!v) return;
        this.picked.push({ exercise: v });
        rebuildList();
        dd.setValue("");
      });
    });

    rebuildList();

    new Setting(contentEl).addButton((b) =>
      b
        .setButtonText("Erstellen")
        .setCta()
        .onClick(async () => {
          if (!this.name.trim()) {
            new Notice("Name fehlt");
            return;
          }
          if (this.picked.length === 0) {
            new Notice("Mindestens eine Übung hinzufügen");
            return;
          }
          await this.store.createSession(this.name.trim(), this.picked);
          new Notice(`Einheit "${this.name}" angelegt`);
          this.close();
          this.onCreated();
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
