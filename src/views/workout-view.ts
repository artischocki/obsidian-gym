import { ItemView, Notice, WorkspaceLeaf } from "obsidian";
import { GymStore } from "../data";
import {
  Exercise,
  GymData,
  GymSettings,
  Plan,
  Session,
  SessionExerciseRef,
  WORKOUT_VIEW_TYPE,
  WorkoutSet,
} from "../types";

interface ActiveSet {
  weight: number;
  reps: number;
  completed: boolean;
}

interface ActiveExercise {
  ref: SessionExerciseRef;
  resolved: Exercise | null;
  /** Effective sets count */
  sets: ActiveSet[];
  /** Effective rep range */
  repRange: [number, number];
  /** Effective rest seconds */
  restSeconds: number;
  /** Last-time hints */
  prevSets: WorkoutSet[];
}

/**
 * The live workout view. Tracks per-set weight/reps, marks completion,
 * runs a rest timer, and writes a workout log when finished.
 */
export class WorkoutView extends ItemView {
  private store!: GymStore;
  private settings!: GymSettings;
  private data!: GymData;
  private plan!: Plan;
  private session!: Session;
  private exercises: ActiveExercise[] = [];

  private restTimerSeconds = 0;
  private restInterval: number | null = null;
  private currentRestTarget = 0;

  private workoutStartedAt = Date.now();
  private onFinish: (() => void) | null = null;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return WORKOUT_VIEW_TYPE;
  }
  getDisplayText(): string {
    return this.session ? `Workout: ${this.session.name}` : "Workout";
  }
  getIcon(): string {
    return "dumbbell";
  }

  configure(
    store: GymStore,
    settings: GymSettings,
    data: GymData,
    plan: Plan,
    session: Session,
    onFinish: () => void,
  ): void {
    this.store = store;
    this.settings = settings;
    this.data = data;
    this.plan = plan;
    this.session = session;
    this.onFinish = onFinish;

    const exerciseByName = new Map(data.exercises.map((e) => [e.name, e]));
    this.exercises = session.exercises.map((ref) => {
      const resolved = exerciseByName.get(ref.exercise) ?? null;
      const setsCount = ref.sets ?? resolved?.defaultSets ?? this.settings.defaultSets;
      const repRange =
        ref.repRange ?? resolved?.repRange ?? this.settings.defaultRepRange;
      const restSeconds =
        ref.restSeconds ?? resolved?.restSeconds ?? this.settings.defaultRestSeconds;
      const prevSets = this.store.lastSetsForExercise(data, ref.exercise);
      return {
        ref,
        resolved,
        sets: Array.from({ length: setsCount }, (_, i) => ({
          weight: prevSets[i]?.weight ?? 0,
          reps: 0,
          completed: false,
        })),
        repRange,
        restSeconds,
        prevSets,
      };
    });

    this.workoutStartedAt = Date.now();
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.restInterval !== null) {
      window.clearInterval(this.restInterval);
      this.restInterval = null;
    }
  }

  // ---------- rendering ----------

  private render(): void {
    const container = this.contentEl;
    container.empty();
    container.addClass("gym-root");

    const root = container.createDiv({ cls: "gym-workout" });

    const header = root.createDiv({ cls: "gym-workout-header" });
    header.createDiv({ cls: "gym-workout-title", text: this.session.name });
    const meta = header.createDiv({ cls: "gym-workout-meta" });
    meta.setText(`${this.plan.name} • ${new Date().toLocaleDateString()}`);

    for (let ei = 0; ei < this.exercises.length; ei++) {
      this.renderExercise(root, ei);
    }

    this.renderRestTimerBar(root);
    this.renderFinishRow(root);
  }

  private renderExercise(parent: HTMLElement, ei: number): void {
    const e = this.exercises[ei];
    const block = parent.createDiv({ cls: "gym-exercise-block" });

    const head = block.createDiv({ cls: "gym-exercise-name" });
    head.createSpan({ text: e.ref.exercise });
    head.createSpan({
      cls: "gym-exercise-range",
      text: `${e.sets.length} × ${e.repRange[0]}–${e.repRange[1]}`,
    });

    for (let si = 0; si < e.sets.length; si++) {
      this.renderSetRow(block, ei, si);
    }

    // "Last time" hint
    if (e.prevSets.length > 0) {
      const hint = e.prevSets
        .map((s) => `${s.weight}${this.settings.weightUnit}×${s.reps}`)
        .join(", ");
      block.createDiv({ cls: "gym-prev-hint", text: `Letztes Mal: ${hint}` });
    }

    // Add-set / remove-set controls
    const controls = block.createDiv({ cls: "gym-button-row" });
    const addSet = controls.createEl("button", { text: "+ Set" });
    addSet.addEventListener("click", () => {
      e.sets.push({
        weight: e.sets[e.sets.length - 1]?.weight ?? 0,
        reps: 0,
        completed: false,
      });
      this.render();
    });
    const removeSet = controls.createEl("button", { text: "− Set" });
    removeSet.disabled = e.sets.length <= 1;
    removeSet.addEventListener("click", () => {
      e.sets.pop();
      this.render();
    });
  }

  private renderSetRow(parent: HTMLElement, ei: number, si: number): void {
    const e = this.exercises[ei];
    const s = e.sets[si];
    const row = parent.createDiv({ cls: "gym-set-row" });
    row.createSpan({ cls: "gym-set-index", text: String(si + 1) });

    const weightInput = row.createEl("input", { type: "number" });
    weightInput.placeholder = `weight (${this.settings.weightUnit})`;
    weightInput.step = "0.5";
    weightInput.min = "0";
    if (s.weight > 0) weightInput.value = String(s.weight);
    weightInput.addEventListener("input", () => {
      s.weight = parseFloat(weightInput.value) || 0;
    });

    const repsInput = row.createEl("input", { type: "number" });
    repsInput.placeholder = "reps";
    repsInput.min = "0";
    if (s.reps > 0) repsInput.value = String(s.reps);
    repsInput.addEventListener("input", () => {
      s.reps = parseInt(repsInput.value) || 0;
    });

    // PR indicator (live)
    const prMark = row.createSpan({ cls: "gym-set-pr" });
    const updatePrMark = (): void => {
      const isPr = this.wouldBePR(e.ref.exercise, s.weight, s.reps);
      prMark.setText(isPr ? "🏆" : "");
    };
    weightInput.addEventListener("input", updatePrMark);
    repsInput.addEventListener("input", updatePrMark);
    updatePrMark();

    const doneBtn = row.createEl("button", {
      cls: "gym-set-done" + (s.completed ? " gym-checked" : ""),
      text: s.completed ? "✓" : "",
    });
    doneBtn.addEventListener("click", () => {
      s.completed = !s.completed;
      doneBtn.toggleClass("gym-checked", s.completed);
      doneBtn.setText(s.completed ? "✓" : "");
      if (s.completed && s.reps > 0) {
        this.startRestTimer(e.restSeconds);
      }
    });
  }

  private renderFinishRow(parent: HTMLElement): void {
    const row = parent.createDiv({ cls: "gym-finish-row" });
    const cancel = row.createEl("button", { text: "Abbrechen" });
    cancel.addEventListener("click", () => {
      this.leaf.detach();
    });
    const finish = row.createEl("button", { text: "Workout speichern", cls: "mod-cta" });
    finish.addEventListener("click", () => void this.finishWorkout());
  }

  // ---------- rest timer ----------

  private renderRestTimerBar(parent: HTMLElement): void {
    const bar = parent.createDiv({ cls: "gym-rest-timer" });
    const label = bar.createSpan({ text: "Pause" });
    const timerEl = bar.createSpan({ cls: "gym-timer-running", text: "—" });

    const updateUI = (): void => {
      if (this.restInterval === null) {
        timerEl.setText("—");
        return;
      }
      const remaining = Math.max(0, this.currentRestTarget - this.restTimerSeconds);
      const mm = Math.floor(remaining / 60);
      const ss = remaining % 60;
      timerEl.setText(`${mm}:${String(ss).padStart(2, "0")}`);
      if (remaining === 0) {
        new Notice("Pause vorbei");
        this.stopRestTimer();
      }
    };

    const skip = bar.createEl("button", { text: "Skip" });
    skip.addEventListener("click", () => this.stopRestTimer());

    // Re-pin the timer UI to this DOM element on each render
    this.restTimerUI = updateUI;
    updateUI();
  }

  private restTimerUI: () => void = () => undefined;

  private startRestTimer(seconds: number): void {
    this.stopRestTimer();
    this.restTimerSeconds = 0;
    this.currentRestTarget = seconds;
    this.restInterval = window.setInterval(() => {
      this.restTimerSeconds += 1;
      this.restTimerUI();
    }, 1000);
    this.restTimerUI();
  }

  private stopRestTimer(): void {
    if (this.restInterval !== null) {
      window.clearInterval(this.restInterval);
      this.restInterval = null;
    }
    this.restTimerUI();
  }

  // ---------- PR detection ----------

  private prCache: Map<string, { weight: number; reps: number; date: string }> | null = null;
  private wouldBePR(exerciseName: string, weight: number, reps: number): boolean {
    if (weight <= 0 || reps < 1) return false;
    if (!this.prCache) this.prCache = this.store.computePRs(this.data);
    const existing = this.prCache.get(exerciseName);
    if (!existing) return true;
    if (weight > existing.weight) return true;
    if (weight === existing.weight && reps > existing.reps) return true;
    return false;
  }

  // ---------- finalize ----------

  private async finishWorkout(): Promise<void> {
    const sets: WorkoutSet[] = [];
    for (const e of this.exercises) {
      e.sets.forEach((s, idx) => {
        // Skip "empty" rows where nothing happened
        if (!s.completed && s.weight === 0 && s.reps === 0) return;
        sets.push({
          exercise: e.ref.exercise,
          set: idx + 1,
          weight: s.weight,
          reps: s.reps,
          completed: s.completed,
          pr: s.completed ? this.wouldBePR(e.ref.exercise, s.weight, s.reps) || undefined : undefined,
        });
      });
    }

    if (sets.length === 0) {
      new Notice("Keine Sätze erfasst — nichts zu speichern.");
      return;
    }

    const durationSeconds = Math.round((Date.now() - this.workoutStartedAt) / 1000);
    const file = await this.store.saveWorkout({
      date: new Date().toISOString().slice(0, 10),
      plan: this.plan.name,
      session: this.session.name,
      sets,
      durationSeconds,
      notes: "",
    });
    new Notice(`Workout gespeichert: ${file.basename}`);
    this.onFinish?.();
    this.leaf.detach();
  }
}
