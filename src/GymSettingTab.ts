import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import type GymPlugin from "./main";
import { NewWorkoutPlanModal } from "./NewWorkoutPlanModal";
import type { WorkoutPlan } from "./settings";

export class GymSettingTab extends PluginSettingTab {
  plugin: GymPlugin;

  constructor(app: App, plugin: GymPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Gym Plugin Settings" });

    // --- your existing settings here (folder, toggles, etc.) ---

    containerEl.createEl("h3", { text: "Workout plans" });

    // Create new plan button
    new Setting(containerEl)
      .setName("Create a new workout plan")
      .setDesc("Workout plans are stored in plugin settings.")
      .addButton((btn) =>
        btn
          .setButtonText("New plan")
          .setCta()
          .onClick(() => {
            new NewWorkoutPlanModal(this.app, async (name) => {
              await this.addWorkoutPlan(name);
              this.display(); // re-render UI
            }).open();
          })
      );

    // List of plans
    const plans = this.plugin.settings.workoutPlans ?? [];

    if (plans.length === 0) {
      containerEl.createEl("p", { text: "No workout plans yet." });
      return;
    }

    // Render each plan row
    plans.forEach((plan) => {
      const isActive = this.plugin.settings.activeWorkoutPlanId === plan.id;

      new Setting(containerEl)
        .setName(isActive ? `${plan.name} (active)` : plan.name)
        .setDesc(`ID: ${plan.id}`)
        .addButton((btn) => {
          btn
            .setButtonText(isActive ? "Active" : "Make active")
            .setCta(!isActive)
            .setDisabled(isActive)
            .onClick(async () => {
              this.plugin.settings.activeWorkoutPlanId = plan.id;
              await this.plugin.saveSettings();
              this.display(); // re-render
            });
        })
        .addText((text) => {
          text
            .setPlaceholder("Plan name")
            .setValue(plan.name)
            .onChange(async (value) => {
              plan.name = value;
              await this.plugin.saveSettings();
              // optional: re-render to update label instantly
              this.display();
            });
        })
        .addExtraButton((btn) =>
          btn
            .setIcon("trash")
            .setTooltip("Delete plan")
            .onClick(async () => {
              const ok = confirm(`Delete workout plan "${plan.name}"?`);
              if (!ok) return;

              await this.deleteWorkoutPlan(plan.id);

              // If you deleted the active plan, clear active
              if (this.plugin.settings.activeWorkoutPlanId === plan.id) {
                this.plugin.settings.activeWorkoutPlanId = null;
                await this.plugin.saveSettings();
              }

              this.display();
            })
        );
    });
  }

  private async addWorkoutPlan(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Prevent duplicates by name
    const exists = (this.plugin.settings.workoutPlans ?? []).some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      new Notice("A plan with that name already exists.");
      return;
    }

    const plan: WorkoutPlan = {
      id: this.newId(),
      name: trimmed,
    };

    this.plugin.settings.workoutPlans = [
      ...(this.plugin.settings.workoutPlans ?? []),
      plan,
    ];

    await this.plugin.saveSettings();
    new Notice(`Created plan: ${trimmed}`);
  }

  private async deleteWorkoutPlan(planId: string) {
    this.plugin.settings.workoutPlans = (this.plugin.settings.workoutPlans ?? []).filter(
      (p) => p.id !== planId
    );
    await this.plugin.saveSettings();
  }

  private newId(): string {
    // Works in modern Electron; fallback included
    // @ts-ignore
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

