import { App, Modal, Setting } from "obsidian";

export class NewWorkoutPlanModal extends Modal {
  private value = "";
  private onSubmit: (name: string) => void;

  constructor(app: App, onSubmit: (name: string) => void) {
    super(app);
    this.onSubmit = onSubmit;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle("New workout plan");

    new Setting(contentEl)
      .setName("Plan name")
      .addText((text) => {
        text.setPlaceholder("e.g. Push/Pull/Legs")
          .onChange((v) => (this.value = v));
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
