import { App, Modal, Setting } from "obsidian";

export class ExerciseNameModal extends Modal {
  private value = "";
  private onSubmit: (value: string) => void;

  constructor(app: App, onSubmit: (value: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle("New exercise");

    new Setting(contentEl)
      .setName("Exercise name")
      .addText((text) => {
        text.setPlaceholder("e.g. Barbell Bench Press")
          .onChange((v) => (this.value = v));
        // Focus cursor
        window.setTimeout(() => text.inputEl.focus(), 0);
      });

    new Setting(contentEl)
      .addButton((btn) =>
        btn
          .setButtonText("Create")
          .setCta()
          .onClick(() => {
            const name = this.value.trim();
            if (!name) return;
            this.close();
            this.onSubmit(name);
          })
      )
      .addExtraButton((btn) =>
        btn.setIcon("cross").setTooltip("Cancel").onClick(() => this.close())
      );
  }

  onClose() {
    this.contentEl.empty();
  }
}
