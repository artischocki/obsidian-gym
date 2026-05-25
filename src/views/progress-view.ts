import { ItemView, WorkspaceLeaf } from "obsidian";
import { GymStore, formatDate } from "../data";
import { GymData, GymSettings, PROGRESS_VIEW_TYPE, Workout } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Progress dashboard.
 *
 * Sections:
 *   1. Personal-records grid (one card per exercise with a tracked PR)
 *   2. Training heatmap (last ~26 weeks, GitHub-style)
 *   3. Weight-over-time line chart per exercise (top-N by frequency)
 */
export class ProgressView extends ItemView {
  private store!: GymStore;
  private settings!: GymSettings;
  private data!: GymData;

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType(): string {
    return PROGRESS_VIEW_TYPE;
  }
  getDisplayText(): string {
    return "Gym Progress";
  }
  getIcon(): string {
    return "bar-chart-3";
  }

  configure(store: GymStore, settings: GymSettings, data: GymData): void {
    this.store = store;
    this.settings = settings;
    this.data = data;
    this.render();
  }

  refresh(data: GymData): void {
    this.data = data;
    this.render();
  }

  private render(): void {
    const c = this.contentEl;
    c.empty();
    c.addClass("gym-root");
    const root = c.createDiv({ cls: "gym-dashboard" });

    root.createEl("h1", { text: "Progress" });
    root.createEl("div", {
      cls: "gym-muted",
      text: `${this.data.workouts.length} Workouts • ${this.data.exercises.length} Übungen`,
    });

    this.renderPRs(root);
    this.renderHeatmap(root);
    this.renderCharts(root);

    if (this.data.workouts.length === 0) {
      root.createDiv({ cls: "gym-empty", text: "Noch keine Workouts geloggt." });
    }
  }

  // ---------- PRs ----------

  private renderPRs(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "gym-section" });
    section.createEl("h2", { text: "Personal Records" });
    const prs = this.store.computePRs(this.data);
    if (prs.size === 0) {
      section.createDiv({ cls: "gym-empty", text: "Noch keine PRs aufgestellt." });
      return;
    }
    const grid = section.createDiv({ cls: "gym-pr-grid" });
    const sorted = [...prs.entries()].sort((a, b) => b[1].weight - a[1].weight);
    for (const [name, pr] of sorted) {
      const card = grid.createDiv({ cls: "gym-pr-card" });
      card.createDiv({ cls: "gym-pr-exercise", text: name });
      card.createDiv({
        cls: "gym-pr-value",
        text: `${pr.weight}${this.settings.weightUnit} × ${pr.reps}`,
      });
      card.createDiv({ cls: "gym-pr-date", text: formatDate(pr.date) });
    }
  }

  // ---------- heatmap ----------

  private renderHeatmap(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "gym-section" });
    section.createEl("h2", { text: "Trainingsfrequenz" });

    const weeks = 26;
    const days = weeks * 7;
    const today = startOfDay(new Date());
    const setStart = new Date(today);
    setStart.setDate(setStart.getDate() - (days - 1));
    // align to Monday
    const dow = (setStart.getDay() + 6) % 7;
    setStart.setDate(setStart.getDate() - dow);

    const countByDay = new Map<string, number>();
    for (const w of this.data.workouts) {
      const key = w.date;
      countByDay.set(key, (countByDay.get(key) ?? 0) + 1);
    }

    const grid = section.createDiv({ cls: "gym-heatmap" });
    const cursor = new Date(setStart);
    const totalCells = days + ((7 - ((days + dow) % 7)) % 7);
    for (let i = 0; i < totalCells; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const count = countByDay.get(key) ?? 0;
      const cell = grid.createDiv({ cls: "gym-heatmap-cell" });
      if (count >= 4) cell.addClass("gym-h4");
      else if (count === 3) cell.addClass("gym-h3");
      else if (count === 2) cell.addClass("gym-h2");
      else if (count === 1) cell.addClass("gym-h1");
      cell.setAttr(
        "title",
        `${formatDate(key)}: ${count} Workout${count === 1 ? "" : "s"}`,
      );
      cursor.setDate(cursor.getDate() + 1);
    }

    const legend = section.createDiv({ cls: "gym-heatmap-legend" });
    legend.createSpan({ text: "weniger" });
    for (const cls of ["", "gym-h1", "gym-h2", "gym-h3", "gym-h4"]) {
      const d = legend.createDiv({ cls: "gym-heatmap-cell" + (cls ? " " + cls : "") });
      d.style.display = "inline-block";
    }
    legend.createSpan({ text: "mehr" });
  }

  // ---------- weight-over-time charts ----------

  private renderCharts(parent: HTMLElement): void {
    const section = parent.createDiv({ cls: "gym-section" });
    section.createEl("h2", { text: "Gewicht über Zeit" });

    // Build per-exercise series: take heaviest completed set per workout day.
    interface Point {
      x: number; // workout index
      date: string;
      maxWeight: number;
    }
    const seriesByExercise = new Map<string, Point[]>();
    for (const w of this.data.workouts) {
      const heaviestByExercise = new Map<string, number>();
      for (const s of w.sets) {
        if (!s.completed || s.weight <= 0 || s.reps < 1) continue;
        const prev = heaviestByExercise.get(s.exercise) ?? 0;
        if (s.weight > prev) heaviestByExercise.set(s.exercise, s.weight);
      }
      for (const [name, max] of heaviestByExercise) {
        if (!seriesByExercise.has(name)) seriesByExercise.set(name, []);
        seriesByExercise.get(name)!.push({
          x: 0, // assigned below
          date: w.date,
          maxWeight: max,
        });
      }
    }
    for (const points of seriesByExercise.values()) {
      points.forEach((p, i) => (p.x = i));
    }

    if (seriesByExercise.size === 0) {
      section.createDiv({ cls: "gym-empty", text: "Noch keine Daten." });
      return;
    }

    // Show top 8 most-frequent exercises
    const sorted = [...seriesByExercise.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 8);

    for (const [name, points] of sorted) {
      this.renderLineChart(section, name, points);
    }
  }

  private renderLineChart(
    parent: HTMLElement,
    title: string,
    points: { x: number; date: string; maxWeight: number }[],
  ): void {
    const wrap = parent.createDiv({ cls: "gym-chart-wrap" });
    wrap.createDiv({ cls: "gym-chart-title", text: title });

    if (points.length < 2) {
      wrap.createDiv({
        cls: "gym-muted",
        text:
          points.length === 1
            ? `${points[0].maxWeight}${this.settings.weightUnit} am ${formatDate(points[0].date)}`
            : "Noch nicht genug Daten",
      });
      return;
    }

    const W = 600;
    const H = 160;
    const padLeft = 30;
    const padRight = 10;
    const padTop = 10;
    const padBottom = 20;

    const maxW = Math.max(...points.map((p) => p.maxWeight));
    const minW = Math.min(...points.map((p) => p.maxWeight));
    const spanW = Math.max(1, maxW - minW);
    const spanX = Math.max(1, points.length - 1);

    const sx = (i: number): number =>
      padLeft + (i / spanX) * (W - padLeft - padRight);
    const sy = (w: number): number =>
      padTop + (1 - (w - minW) / spanW) * (H - padTop - padBottom);

    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("preserveAspectRatio", "none");
    svg.addClass("gym-chart-svg");

    // axis
    const axis = document.createElementNS(SVG_NS, "line");
    axis.setAttribute("x1", String(padLeft));
    axis.setAttribute("x2", String(W - padRight));
    axis.setAttribute("y1", String(H - padBottom));
    axis.setAttribute("y2", String(H - padBottom));
    axis.addClass("gym-chart-axis");
    svg.appendChild(axis);

    // y-axis labels (min/max)
    const lblMax = document.createElementNS(SVG_NS, "text");
    lblMax.setAttribute("x", "2");
    lblMax.setAttribute("y", String(padTop + 4));
    lblMax.addClass("gym-chart-label");
    lblMax.textContent = `${maxW}`;
    svg.appendChild(lblMax);

    const lblMin = document.createElementNS(SVG_NS, "text");
    lblMin.setAttribute("x", "2");
    lblMin.setAttribute("y", String(H - padBottom));
    lblMin.addClass("gym-chart-label");
    lblMin.textContent = `${minW}`;
    svg.appendChild(lblMin);

    // line
    const d = points
      .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.x)},${sy(p.maxWeight)}`)
      .join(" ");
    const line = document.createElementNS(SVG_NS, "path");
    line.setAttribute("d", d);
    line.addClass("gym-chart-line");
    svg.appendChild(line);

    // points
    for (const p of points) {
      const dot = document.createElementNS(SVG_NS, "circle");
      dot.setAttribute("cx", String(sx(p.x)));
      dot.setAttribute("cy", String(sy(p.maxWeight)));
      dot.setAttribute("r", "2.5");
      dot.addClass("gym-chart-point");
      const tt = document.createElementNS(SVG_NS, "title");
      tt.textContent = `${formatDate(p.date)}: ${p.maxWeight}${this.settings.weightUnit}`;
      dot.appendChild(tt);
      svg.appendChild(dot);
    }

    wrap.appendChild(svg);
  }
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
