import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { GymStore } from "./data";
import { CreateExerciseModal } from "./modals/create-exercise-modal";
import { CreatePlanModal } from "./modals/create-plan-modal";
import { CreateSessionModal } from "./modals/create-session-modal";
import { StartWorkoutModal } from "./modals/start-workout-modal";
import { GymSettingsTab } from "./settings";
import {
  DEFAULT_SETTINGS,
  GymSettings,
  PROGRESS_VIEW_TYPE,
  Plan,
  Session,
  WORKOUT_VIEW_TYPE,
} from "./types";
import { ProgressView } from "./views/progress-view";
import { WorkoutView } from "./views/workout-view";

export default class GymPlugin extends Plugin {
  settings!: GymSettings;
  store!: GymStore;

  async onload(): Promise<void> {
    await this.loadSettings();
    this.store = new GymStore(this.app, this.settings);

    this.registerView(
      WORKOUT_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new WorkoutView(leaf),
    );
    this.registerView(
      PROGRESS_VIEW_TYPE,
      (leaf: WorkspaceLeaf) => new ProgressView(leaf),
    );

    this.addRibbonIcon("dumbbell", "Workout starten", () => void this.startWorkout());

    this.addCommand({
      id: "gym-start-workout",
      name: "Workout starten",
      callback: () => void this.startWorkout(),
    });
    this.addCommand({
      id: "gym-show-progress",
      name: "Progress-Dashboard öffnen",
      callback: () => void this.openProgress(),
    });
    this.addCommand({
      id: "gym-create-exercise",
      name: "Übung erstellen",
      callback: () => {
        new CreateExerciseModal(this.app, this.store, this.settings, () => undefined).open();
      },
    });
    this.addCommand({
      id: "gym-create-session",
      name: "Trainingseinheit erstellen",
      callback: async () => {
        const data = await this.store.loadAll();
        new CreateSessionModal(this.app, this.store, data.exercises, () => undefined).open();
      },
    });
    this.addCommand({
      id: "gym-create-plan",
      name: "Trainingsplan erstellen",
      callback: async () => {
        const data = await this.store.loadAll();
        new CreatePlanModal(this.app, this.store, data.sessions, () => undefined).open();
      },
    });

    this.addSettingTab(new GymSettingsTab(this.app, this));

    await this.store.ensureFolders();
  }

  async onunload(): Promise<void> {
    // Detaching views is handled by Obsidian on plugin unload — no extra work needed.
  }

  async loadSettings(): Promise<void> {
    const raw = (await this.loadData()) as Partial<GymSettings> | null;
    this.settings = { ...DEFAULT_SETTINGS, ...(raw ?? {}) };
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // store holds a reference to settings, so reassign for safety
    this.store = new GymStore(this.app, this.settings);
  }

  // ---------- commands ----------

  private async startWorkout(): Promise<void> {
    const data = await this.store.loadAll();
    if (data.sessions.length === 0) {
      new Notice("Du hast noch keine Trainingseinheiten — erstelle erst eine über 'Gym: Trainingseinheit erstellen'.");
      return;
    }
    new StartWorkoutModal(this.app, this.store, data, (plan, session) =>
      void this.openWorkoutView(plan, session),
    ).open();
  }

  private async openWorkoutView(plan: Plan, session: Session): Promise<void> {
    const data = await this.store.loadAll();
    // Close any existing workout view first
    this.app.workspace.detachLeavesOfType(WORKOUT_VIEW_TYPE);

    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: WORKOUT_VIEW_TYPE, active: true });
    const view = leaf.view;
    if (view instanceof WorkoutView) {
      view.configure(this.store, this.settings, data, plan, session, () => undefined);
    }
    this.app.workspace.revealLeaf(leaf);
  }

  private async openProgress(): Promise<void> {
    const data = await this.store.loadAll();
    this.app.workspace.detachLeavesOfType(PROGRESS_VIEW_TYPE);
    const leaf = this.app.workspace.getLeaf("tab");
    await leaf.setViewState({ type: PROGRESS_VIEW_TYPE, active: true });
    const view = leaf.view;
    if (view instanceof ProgressView) {
      view.configure(this.store, this.settings, data);
    }
    this.app.workspace.revealLeaf(leaf);
  }
}
