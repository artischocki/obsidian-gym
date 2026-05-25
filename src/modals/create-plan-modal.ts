import { App, Modal, Notice, Setting } from "obsidian";
import { GymStore } from "../data";
import { Session } from "../types";

export class CreatePlanModal extends Modal {
  private name = "";
  private picked: string[] = [];

  constructor(
    app: App,
    private store: GymStore,
    private availableSessions: Session[],
    private onCreated: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Trainingsplan erstellen" });

    if (this.availableSessions.length === 0) {
      contentEl.createEl("p", {
        text: "Du brauchst erst Trainingseinheiten, bevor du einen Plan erstellen kannst.",
        cls: "gym-empty",
      });
      return;
    }

    new Setting(contentEl).setName("Name").addText((t) =>
      t.setPlaceholder("z.B. PPL").onChange((v) => (this.name = v)),
    );

    contentEl.createEl("h3", { text: "Einheiten (in Reihenfolge)" });
    const listEl = contentEl.createDiv();

    const rebuild = (): void => {
      listEl.empty();
      this.picked.forEach((name, i) => {
        const row = listEl.createDiv({ cls: "gym-row" });
        row.createEl("span", { text: `${i + 1}. ${name}` });

        const up = row.createEl("button", { text: "↑" });
        up.disabled = i === 0;
        up.addEventListener("click", () => {
          [this.picked[i - 1], this.picked[i]] = [this.picked[i], this.picked[i - 1]];
          rebuild();
        });

        const down = row.createEl("button", { text: "↓" });
        down.disabled = i === this.picked.length - 1;
        down.addEventListener("click", () => {
          [this.picked[i + 1], this.picked[i]] = [this.picked[i], this.picked[i + 1]];
          rebuild();
        });

        const rm = row.createEl("button", { text: "✕" });
        rm.addEventListener("click", () => {
          this.picked.splice(i, 1);
          rebuild();
        });
      });
    };

    new Setting(contentEl).setName("Einheit hinzufügen").addDropdown((dd) => {
      dd.addOption("", "— wählen —");
      for (const s of this.availableSessions) dd.addOption(s.name, s.name);
      dd.onChange((v) => {
        if (!v) return;
        this.picked.push(v);
        rebuild();
        dd.setValue("");
      });
    });

    rebuild();

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
            new Notice("Mindestens eine Einheit hinzufügen");
            return;
          }
          await this.store.createPlan(this.name.trim(), this.picked);
          new Notice(`Plan "${this.name}" angelegt`);
          this.close();
          this.onCreated();
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
