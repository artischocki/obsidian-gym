import { App, Modal, Notice } from "obsidian";
import { GymStore } from "../data";
import { GymData, Plan, Session } from "../types";

/**
 * Modal: shown when the user starts a workout.
 *
 * Behavior:
 *  - Shows the suggested-next session at the top, ready to start with one click.
 *  - Also lists every session in the active plan, so the user can override.
 *  - Below that, all other sessions in the vault.
 */
export class StartWorkoutModal extends Modal {
  constructor(
    app: App,
    private store: GymStore,
    private data: GymData,
    private onStart: (plan: Plan, session: Session) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("gym-start-modal");
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h2", { text: "Workout starten" });

    if (this.data.plans.length === 0) {
      contentEl.createEl("p", {
        text: "Noch keine Trainingspläne. Erstelle erst einen Plan über die Plugin-Befehle.",
        cls: "gym-empty",
      });
      return;
    }

    const { plan, session } = this.store.suggestNextSession(this.data);
    if (plan && session) {
      const card = contentEl.createDiv({ cls: "gym-suggested" });
      card.createDiv({ cls: "gym-suggested-label", text: `Vorschlag (${plan.name})` });
      card.createDiv({ cls: "gym-suggested-name", text: session.name });
      card.createEl("div", {
        cls: "gym-muted",
        text: `${session.exercises.length} Übung${session.exercises.length === 1 ? "" : "en"}`,
      });
      const row = card.createDiv({ cls: "gym-button-row" });
      const startBtn = row.createEl("button", { text: "Starten", cls: "mod-cta" });
      startBtn.addEventListener("click", () => {
        this.close();
        this.onStart(plan, session);
      });
    }

    // Override: pick any session, grouped by plan
    contentEl.createEl("h3", { text: "Andere Einheit wählen" });
    const sessionByName = new Map(this.data.sessions.map((s) => [s.name, s]));
    const listedSessionNames = new Set<string>();

    for (const p of this.data.plans) {
      const planSessions = p.sessions
        .map((n) => sessionByName.get(n))
        .filter((s): s is Session => !!s);
      if (planSessions.length === 0) continue;
      contentEl.createEl("div", { cls: "gym-muted", text: p.name });
      const ul = contentEl.createEl("ul", { cls: "gym-session-list" });
      for (const s of planSessions) {
        listedSessionNames.add(s.name);
        const li = ul.createEl("li", { text: s.name });
        li.addEventListener("click", () => {
          this.close();
          this.onStart(p, s);
        });
      }
    }

    // Sessions not attached to any plan
    const orphanSessions = this.data.sessions.filter((s) => !listedSessionNames.has(s.name));
    if (orphanSessions.length > 0) {
      contentEl.createEl("div", { cls: "gym-muted", text: "Ohne Plan" });
      const ul = contentEl.createEl("ul", { cls: "gym-session-list" });
      for (const s of orphanSessions) {
        const li = ul.createEl("li", { text: s.name });
        li.addEventListener("click", () => {
          const fallbackPlan = this.data.plans[0];
          if (!fallbackPlan) {
            new Notice("Keine Pläne vorhanden");
            return;
          }
          this.close();
          this.onStart(fallbackPlan, s);
        });
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
