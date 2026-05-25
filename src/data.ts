import { App, TFile, TFolder, normalizePath, stringifyYaml, parseYaml } from "obsidian";
import {
  Exercise,
  GymData,
  GymSettings,
  Plan,
  Session,
  SessionExerciseRef,
  Workout,
  WorkoutSet,
} from "./types";

/**
 * Data layer: reads + writes plan / session / exercise / workout files,
 * and derives data like "next session" and "personal records".
 */
export class GymStore {
  constructor(private app: App, private settings: GymSettings) {}

  // ---------- folder bootstrapping ----------

  async ensureFolders(): Promise<void> {
    const folders = [
      this.settings.plansFolder,
      this.settings.sessionsFolder,
      this.settings.exercisesFolder,
      this.settings.workoutsFolder,
    ];
    for (const folder of folders) {
      const path = normalizePath(folder);
      if (!this.app.vault.getAbstractFileByPath(path)) {
        await this.app.vault.createFolder(path).catch(() => {});
      }
    }
  }

  // ---------- read ----------

  async loadAll(): Promise<GymData> {
    const plans = await this.readFolder<Plan>(this.settings.plansFolder, "plan", this.parsePlan);
    const sessions = await this.readFolder<Session>(
      this.settings.sessionsFolder,
      "session",
      this.parseSession,
    );
    const exercises = await this.readFolder<Exercise>(
      this.settings.exercisesFolder,
      "exercise",
      (file, fm, body) => this.parseExercise(file, fm, body),
    );
    const workouts = await this.readFolder<Workout>(
      this.settings.workoutsFolder,
      "workout",
      this.parseWorkout,
    );
    // Workouts: most recent last → useful for charting
    workouts.sort((a, b) => a.date.localeCompare(b.date));
    return { plans, sessions, exercises, workouts };
  }

  private async readFolder<T>(
    folderPath: string,
    expectedType: string,
    parse: (file: TFile, fm: Record<string, unknown>, body: string) => T | null,
  ): Promise<T[]> {
    const folder = this.app.vault.getAbstractFileByPath(normalizePath(folderPath));
    if (!(folder instanceof TFolder)) return [];
    const items: T[] = [];
    const stack: TFolder[] = [folder];
    while (stack.length) {
      const f = stack.pop()!;
      for (const child of f.children) {
        if (child instanceof TFolder) {
          stack.push(child);
          continue;
        }
        if (!(child instanceof TFile) || child.extension !== "md") continue;
        const raw = await this.app.vault.cachedRead(child);
        const { frontmatter, body } = splitFrontmatter(raw);
        if (frontmatter.type !== expectedType) continue;
        const parsed = parse.call(this, child, frontmatter, body);
        if (parsed) items.push(parsed);
      }
    }
    return items;
  }

  private parsePlan = (file: TFile, fm: Record<string, unknown>, body: string): Plan => ({
    name: file.basename,
    path: file.path,
    sessions: asStringArray(fm.sessions),
    active: fm.active === true,
    notes: body.trim(),
  });

  private parseSession = (file: TFile, fm: Record<string, unknown>, body: string): Session => {
    const rawExercises = Array.isArray(fm.exercises) ? (fm.exercises as unknown[]) : [];
    const exercises: SessionExerciseRef[] = rawExercises.map((entry): SessionExerciseRef => {
      if (typeof entry === "string") return { exercise: entry };
      const e = entry as Record<string, unknown>;
      const ref: SessionExerciseRef = { exercise: String(e.exercise ?? "") };
      if (typeof e.sets === "number") ref.sets = e.sets;
      if (Array.isArray(e.rep_range) && e.rep_range.length === 2) {
        ref.repRange = [Number(e.rep_range[0]), Number(e.rep_range[1])];
      }
      if (typeof e.rest_seconds === "number") ref.restSeconds = e.rest_seconds;
      return ref;
    });
    return {
      name: file.basename,
      path: file.path,
      exercises,
      notes: body.trim(),
    };
  };

  private parseExercise(file: TFile, fm: Record<string, unknown>, body: string): Exercise {
    const range = Array.isArray(fm.rep_range) && fm.rep_range.length === 2
      ? [Number(fm.rep_range[0]), Number(fm.rep_range[1])]
      : this.settings.defaultRepRange;
    return {
      name: file.basename,
      path: file.path,
      muscleGroups: asStringArray(fm.muscle_groups),
      repRange: [range[0], range[1]],
      defaultSets: typeof fm.default_sets === "number" ? fm.default_sets : this.settings.defaultSets,
      restSeconds:
        typeof fm.rest_seconds === "number" ? fm.rest_seconds : this.settings.defaultRestSeconds,
      notes: body.trim(),
    };
  }

  private parseWorkout = (file: TFile, fm: Record<string, unknown>, body: string): Workout => {
    const rawSets = Array.isArray(fm.sets) ? (fm.sets as unknown[]) : [];
    const sets: WorkoutSet[] = rawSets.map((s) => {
      const e = s as Record<string, unknown>;
      return {
        exercise: String(e.exercise ?? ""),
        set: Number(e.set ?? 0),
        weight: Number(e.weight ?? 0),
        reps: Number(e.reps ?? 0),
        completed: e.completed !== false,
        pr: e.pr === true ? true : undefined,
      };
    });
    return {
      path: file.path,
      date: String(fm.date ?? file.basename.slice(0, 10)),
      plan: String(fm.plan ?? ""),
      session: String(fm.session ?? ""),
      sets,
      durationSeconds: typeof fm.duration_seconds === "number" ? fm.duration_seconds : undefined,
      notes: body.trim(),
    };
  };

  // ---------- create / write ----------

  async createPlan(name: string, sessionNames: string[]): Promise<TFile> {
    await this.ensureFolders();
    const path = normalizePath(`${this.settings.plansFolder}/${sanitize(name)}.md`);
    const fm = {
      type: "plan",
      sessions: sessionNames,
      active: true,
    };
    return this.writeFile(path, fm, `# ${name}\n\n_Trainingsplan_\n`);
  }

  async createSession(name: string, exercises: SessionExerciseRef[]): Promise<TFile> {
    await this.ensureFolders();
    const path = normalizePath(`${this.settings.sessionsFolder}/${sanitize(name)}.md`);
    const fm = {
      type: "session",
      exercises: exercises.map((e) => ({
        exercise: e.exercise,
        ...(e.sets !== undefined ? { sets: e.sets } : {}),
        ...(e.repRange !== undefined ? { rep_range: e.repRange } : {}),
        ...(e.restSeconds !== undefined ? { rest_seconds: e.restSeconds } : {}),
      })),
    };
    return this.writeFile(path, fm, `# ${name}\n\n_Trainingseinheit_\n`);
  }

  async createExercise(
    name: string,
    opts: {
      muscleGroups?: string[];
      repRange?: [number, number];
      sets?: number;
      restSeconds?: number;
    },
  ): Promise<TFile> {
    await this.ensureFolders();
    const path = normalizePath(`${this.settings.exercisesFolder}/${sanitize(name)}.md`);
    const fm = {
      type: "exercise",
      muscle_groups: opts.muscleGroups ?? [],
      rep_range: opts.repRange ?? this.settings.defaultRepRange,
      default_sets: opts.sets ?? this.settings.defaultSets,
      rest_seconds: opts.restSeconds ?? this.settings.defaultRestSeconds,
    };
    return this.writeFile(path, fm, `# ${name}\n`);
  }

  async saveWorkout(workout: Omit<Workout, "path">): Promise<TFile> {
    await this.ensureFolders();
    const stamp = `${workout.date}-${workout.session.replace(/\s+/g, "-")}`;
    const path = normalizePath(`${this.settings.workoutsFolder}/${sanitize(stamp)}.md`);
    const fm = {
      type: "workout",
      date: workout.date,
      plan: workout.plan,
      session: workout.session,
      duration_seconds: workout.durationSeconds,
      sets: workout.sets.map((s) => ({
        exercise: s.exercise,
        set: s.set,
        weight: s.weight,
        reps: s.reps,
        completed: s.completed,
        ...(s.pr ? { pr: true } : {}),
      })),
    };
    const body =
      `# ${workout.session} — ${formatDate(workout.date)}\n\n` +
      (workout.notes ? workout.notes + "\n" : "") +
      this.workoutMarkdownTable(workout.sets);
    return this.writeFile(path, fm, body);
  }

  private workoutMarkdownTable(sets: WorkoutSet[]): string {
    if (sets.length === 0) return "";
    const rows = sets.map(
      (s) =>
        `| ${s.exercise} | ${s.set} | ${s.weight} | ${s.reps} | ${s.completed ? "✓" : ""} | ${s.pr ? "🏆" : ""} |`,
    );
    return [
      "",
      "| Exercise | Set | Weight | Reps | Done | PR |",
      "| --- | --- | --- | --- | --- | --- |",
      ...rows,
      "",
    ].join("\n");
  }

  private async writeFile(
    path: string,
    frontmatter: Record<string, unknown>,
    body: string,
  ): Promise<TFile> {
    const content = `---\n${stringifyYaml(frontmatter)}---\n\n${body}`;
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      await this.app.vault.modify(existing, content);
      return existing;
    }
    return this.app.vault.create(path, content);
  }

  // ---------- derived queries ----------

  /**
   * Decide which session is next. Logic:
   *   1. Find the active plan (or fall back to first plan).
   *   2. Find the most recent workout that used a session from that plan.
   *   3. Return the next session in the plan's session list (wraps around).
   *   4. If no workouts exist yet, return the first session in the plan.
   */
  suggestNextSession(data: GymData): { plan: Plan | null; session: Session | null } {
    const plan = data.plans.find((p) => p.active) ?? data.plans[0] ?? null;
    if (!plan || plan.sessions.length === 0) return { plan, session: null };

    const sessionByName = new Map(data.sessions.map((s) => [s.name, s]));
    const planSessions = plan.sessions
      .map((n) => sessionByName.get(n))
      .filter((s): s is Session => !!s);
    if (planSessions.length === 0) return { plan, session: null };

    const lastInPlan = [...data.workouts]
      .reverse()
      .find((w) => w.plan === plan.name && plan.sessions.includes(w.session));
    if (!lastInPlan) return { plan, session: planSessions[0] };

    const idx = plan.sessions.indexOf(lastInPlan.session);
    const nextIdx = (idx + 1) % plan.sessions.length;
    const nextName = plan.sessions[nextIdx];
    return { plan, session: sessionByName.get(nextName) ?? planSessions[0] };
  }

  /**
   * Personal record per exercise: highest weight where reps >= 1.
   * Tiebreaker: most reps at that weight, then earliest date.
   */
  computePRs(data: GymData): Map<string, { weight: number; reps: number; date: string }> {
    const prs = new Map<string, { weight: number; reps: number; date: string }>();
    for (const w of data.workouts) {
      for (const s of w.sets) {
        if (!s.completed || s.reps < 1 || s.weight <= 0) continue;
        const prev = prs.get(s.exercise);
        if (!prev || s.weight > prev.weight || (s.weight === prev.weight && s.reps > prev.reps)) {
          prs.set(s.exercise, { weight: s.weight, reps: s.reps, date: w.date });
        }
      }
    }
    return prs;
  }

  /**
   * For a given exercise, find the most recent completed sets in the *previous* workout
   * that contained this exercise — used as hint placeholders in the workout view.
   */
  lastSetsForExercise(data: GymData, exerciseName: string): WorkoutSet[] {
    for (let i = data.workouts.length - 1; i >= 0; i--) {
      const sets = data.workouts[i].sets.filter(
        (s) => s.exercise === exerciseName && s.completed,
      );
      if (sets.length > 0) return sets;
    }
    return [];
  }
}

// ---------- helpers ----------

function splitFrontmatter(raw: string): { frontmatter: Record<string, unknown>; body: string } {
  if (!raw.startsWith("---")) return { frontmatter: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return { frontmatter: {}, body: raw };
  const yamlText = raw.slice(3, end).replace(/^\n/, "");
  const body = raw.slice(end + 4).replace(/^\n/, "");
  try {
    const fm = (parseYaml(yamlText) ?? {}) as Record<string, unknown>;
    return { frontmatter: fm, body };
  } catch {
    return { frontmatter: {}, body };
  }
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x));
}

function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "_").trim();
}

/**
 * Format an ISO date string (YYYY-MM-DD) as German DD.MM.YYYY.
 * Storage stays ISO for sortability; this is purely for display.
 */
export function formatDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}.${m[2]}.${m[1]}`;
}

/** Today as ISO YYYY-MM-DD, respecting local timezone. */
export function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}
