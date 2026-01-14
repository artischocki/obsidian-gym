"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => GymPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian4 = require("obsidian");

// src/ExerciseNameModal.ts
var import_obsidian = require("obsidian");
var ExerciseNameModal = class extends import_obsidian.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.value = "";
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle("New exercise");
    new import_obsidian.Setting(contentEl).setName("Exercise name").addText((text) => {
      text.setPlaceholder("e.g. Barbell Bench Press").onChange((v) => this.value = v);
      window.setTimeout(() => text.inputEl.focus(), 0);
    });
    new import_obsidian.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Create").setCta().onClick(() => {
        const name = this.value.trim();
        if (!name) return;
        this.close();
        this.onSubmit(name);
      })
    ).addExtraButton(
      (btn) => btn.setIcon("cross").setTooltip("Cancel").onClick(() => this.close())
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/GymSettingTab.ts
var import_obsidian3 = require("obsidian");

// src/NewWorkoutPlanModal.ts
var import_obsidian2 = require("obsidian");
var NewWorkoutPlanModal = class extends import_obsidian2.Modal {
  constructor(app, onSubmit) {
    super(app);
    this.value = "";
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    this.setTitle("New workout plan");
    new import_obsidian2.Setting(contentEl).setName("Plan name").addText((text) => {
      text.setPlaceholder("e.g. Push/Pull/Legs").onChange((v) => this.value = v);
      window.setTimeout(() => text.inputEl.focus(), 0);
    });
    new import_obsidian2.Setting(contentEl).addButton(
      (btn) => btn.setButtonText("Create").setCta().onClick(() => {
        const name = this.value.trim();
        if (!name) return;
        this.close();
        this.onSubmit(name);
      })
    ).addExtraButton(
      (btn) => btn.setIcon("cross").setTooltip("Cancel").onClick(() => this.close())
    );
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/GymSettingTab.ts
var GymSettingTab = class extends import_obsidian3.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Gym Plugin Settings" });
    containerEl.createEl("h3", { text: "Workout plans" });
    new import_obsidian3.Setting(containerEl).setName("Create a new workout plan").setDesc("Workout plans are stored in plugin settings.").addButton(
      (btn) => btn.setButtonText("New plan").setCta().onClick(() => {
        new NewWorkoutPlanModal(this.app, async (name) => {
          await this.addWorkoutPlan(name);
          this.display();
        }).open();
      })
    );
    const plans = this.plugin.settings.workoutPlans ?? [];
    if (plans.length === 0) {
      containerEl.createEl("p", { text: "No workout plans yet." });
      return;
    }
    plans.forEach((plan) => {
      const isActive = this.plugin.settings.activeWorkoutPlanId === plan.id;
      new import_obsidian3.Setting(containerEl).setName(isActive ? `${plan.name} (active)` : plan.name).setDesc(`ID: ${plan.id}`).addButton((btn) => {
        btn.setButtonText(isActive ? "Active" : "Make active").setCta(!isActive).setDisabled(isActive).onClick(async () => {
          this.plugin.settings.activeWorkoutPlanId = plan.id;
          await this.plugin.saveSettings();
          this.display();
        });
      }).addText((text) => {
        text.setPlaceholder("Plan name").setValue(plan.name).onChange(async (value) => {
          plan.name = value;
          await this.plugin.saveSettings();
          this.display();
        });
      }).addExtraButton(
        (btn) => btn.setIcon("trash").setTooltip("Delete plan").onClick(async () => {
          const ok = confirm(`Delete workout plan "${plan.name}"?`);
          if (!ok) return;
          await this.deleteWorkoutPlan(plan.id);
          if (this.plugin.settings.activeWorkoutPlanId === plan.id) {
            this.plugin.settings.activeWorkoutPlanId = null;
            await this.plugin.saveSettings();
          }
          this.display();
        })
      );
    });
  }
  async addWorkoutPlan(name) {
    const trimmed = name.trim();
    if (!trimmed) return;
    const exists = (this.plugin.settings.workoutPlans ?? []).some(
      (p) => p.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      new import_obsidian3.Notice("A plan with that name already exists.");
      return;
    }
    const plan = {
      id: this.newId(),
      name: trimmed
    };
    this.plugin.settings.workoutPlans = [
      ...this.plugin.settings.workoutPlans ?? [],
      plan
    ];
    await this.plugin.saveSettings();
    new import_obsidian3.Notice(`Created plan: ${trimmed}`);
  }
  async deleteWorkoutPlan(planId) {
    this.plugin.settings.workoutPlans = (this.plugin.settings.workoutPlans ?? []).filter(
      (p) => p.id !== planId
    );
    await this.plugin.saveSettings();
  }
  newId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
};

// src/settings.ts
var DEFAULT_SETTINGS = {
  exercisesFolder: "Exercises",
  openAfterCreate: true,
  addFrontmatter: true,
  workoutPlans: [],
  activeWorkoutPlanId: null
};

// src/main.ts
var GymPlugin = class extends import_obsidian4.Plugin {
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new GymSettingTab(this.app, this));
    this.addCommand({
      id: "gym-create-exercise",
      name: "Gym: Create new exercise",
      callback: () => {
        new ExerciseNameModal(this.app, (name) => this.createExerciseNote(name)).open();
      }
    });
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async createExerciseNote(exerciseName) {
    const folder = this.settings.exercisesFolder || "Exercises";
    const safeName = this.sanitizeFileName(exerciseName);
    const path = (0, import_obsidian4.normalizePath)(`${folder}/${safeName}.md`);
    await this.ensureFolder(folder);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian4.TFile) {
      new import_obsidian4.Notice(`Exercise already exists: ${path}`);
      if (this.settings.openAfterCreate) {
        await this.app.workspace.getLeaf(true).openFile(existing);
      }
      return;
    }
    const content = this.exerciseTemplate(exerciseName);
    const file = await this.app.vault.create(path, content);
    new import_obsidian4.Notice(`Created exercise: ${exerciseName}`);
    if (this.settings.openAfterCreate) {
      await this.app.workspace.getLeaf(true).openFile(file);
    }
  }
  exerciseTemplate(exerciseName) {
    const title = exerciseName.trim();
    const created = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    if (!this.settings.addFrontmatter) {
      return `# ${title}

## Notes

## Cues

## Progression
`;
    }
    const escaped = title.replaceAll(`"`, `\\"`);
    return `---
type: exercise
name: "${escaped}"
created: ${created}
aliases: []
muscle_groups: []
equipment: []
---

# ${title}

## Notes

## Cues

## Progression
`;
  }
  async ensureFolder(folderPath) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }
  sanitizeFileName(name) {
    return name.trim().replace(/[\\/#^:[\]|?*"<>]/g, "").replace(/\s+/g, " ");
  }
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL0V4ZXJjaXNlTmFtZU1vZGFsLnRzIiwgInNyYy9HeW1TZXR0aW5nVGFiLnRzIiwgInNyYy9OZXdXb3Jrb3V0UGxhbk1vZGFsLnRzIiwgInNyYy9zZXR0aW5ncy50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHsgTm90aWNlLCBQbHVnaW4sIG5vcm1hbGl6ZVBhdGgsIFRGaWxlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgeyBFeGVyY2lzZU5hbWVNb2RhbCB9IGZyb20gXCIuL0V4ZXJjaXNlTmFtZU1vZGFsXCI7XG5pbXBvcnQgeyBHeW1TZXR0aW5nVGFiIH0gZnJvbSBcIi4vR3ltU2V0dGluZ1RhYlwiO1xuaW1wb3J0IHsgREVGQVVMVF9TRVRUSU5HUywgdHlwZSBHeW1QbHVnaW5TZXR0aW5ncyB9IGZyb20gXCIuL3NldHRpbmdzXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEd5bVBsdWdpbiBleHRlbmRzIFBsdWdpbiB7XG4gIHNldHRpbmdzOiBHeW1QbHVnaW5TZXR0aW5ncztcblxuICBhc3luYyBvbmxvYWQoKSB7XG4gICAgYXdhaXQgdGhpcy5sb2FkU2V0dGluZ3MoKTtcblxuICAgIC8vIFNldHRpbmdzIFVJXG4gICAgdGhpcy5hZGRTZXR0aW5nVGFiKG5ldyBHeW1TZXR0aW5nVGFiKHRoaXMuYXBwLCB0aGlzKSk7XG5cbiAgICAvLyBDb21tYW5kXG4gICAgdGhpcy5hZGRDb21tYW5kKHtcbiAgICAgIGlkOiBcImd5bS1jcmVhdGUtZXhlcmNpc2VcIixcbiAgICAgIG5hbWU6IFwiR3ltOiBDcmVhdGUgbmV3IGV4ZXJjaXNlXCIsXG4gICAgICBjYWxsYmFjazogKCkgPT4ge1xuICAgICAgICBuZXcgRXhlcmNpc2VOYW1lTW9kYWwodGhpcy5hcHAsIChuYW1lKSA9PiB0aGlzLmNyZWF0ZUV4ZXJjaXNlTm90ZShuYW1lKSkub3BlbigpO1xuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGxvYWRTZXR0aW5ncygpIHtcbiAgICB0aGlzLnNldHRpbmdzID0gT2JqZWN0LmFzc2lnbih7fSwgREVGQVVMVF9TRVRUSU5HUywgYXdhaXQgdGhpcy5sb2FkRGF0YSgpKTtcbiAgfVxuXG4gIGFzeW5jIHNhdmVTZXR0aW5ncygpIHtcbiAgICBhd2FpdCB0aGlzLnNhdmVEYXRhKHRoaXMuc2V0dGluZ3MpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjcmVhdGVFeGVyY2lzZU5vdGUoZXhlcmNpc2VOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLnNldHRpbmdzLmV4ZXJjaXNlc0ZvbGRlciB8fCBcIkV4ZXJjaXNlc1wiO1xuICAgIGNvbnN0IHNhZmVOYW1lID0gdGhpcy5zYW5pdGl6ZUZpbGVOYW1lKGV4ZXJjaXNlTmFtZSk7XG4gICAgY29uc3QgcGF0aCA9IG5vcm1hbGl6ZVBhdGgoYCR7Zm9sZGVyfS8ke3NhZmVOYW1lfS5tZGApO1xuXG4gICAgYXdhaXQgdGhpcy5lbnN1cmVGb2xkZXIoZm9sZGVyKTtcblxuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBuZXcgTm90aWNlKGBFeGVyY2lzZSBhbHJlYWR5IGV4aXN0czogJHtwYXRofWApO1xuICAgICAgaWYgKHRoaXMuc2V0dGluZ3Mub3BlbkFmdGVyQ3JlYXRlKSB7XG4gICAgICAgIGF3YWl0IHRoaXMuYXBwLndvcmtzcGFjZS5nZXRMZWFmKHRydWUpLm9wZW5GaWxlKGV4aXN0aW5nKTtcbiAgICAgIH1cbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBjb250ZW50ID0gdGhpcy5leGVyY2lzZVRlbXBsYXRlKGV4ZXJjaXNlTmFtZSk7XG5cbiAgICBjb25zdCBmaWxlID0gYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlKHBhdGgsIGNvbnRlbnQpO1xuICAgIG5ldyBOb3RpY2UoYENyZWF0ZWQgZXhlcmNpc2U6ICR7ZXhlcmNpc2VOYW1lfWApO1xuXG4gICAgaWYgKHRoaXMuc2V0dGluZ3Mub3BlbkFmdGVyQ3JlYXRlKSB7XG4gICAgICBhd2FpdCB0aGlzLmFwcC53b3Jrc3BhY2UuZ2V0TGVhZih0cnVlKS5vcGVuRmlsZShmaWxlKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGV4ZXJjaXNlVGVtcGxhdGUoZXhlcmNpc2VOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCB0aXRsZSA9IGV4ZXJjaXNlTmFtZS50cmltKCk7XG4gICAgY29uc3QgY3JlYXRlZCA9IG5ldyBEYXRlKCkudG9JU09TdHJpbmcoKS5zbGljZSgwLCAxMCk7IC8vIFlZWVktTU0tRERcblxuICAgIGlmICghdGhpcy5zZXR0aW5ncy5hZGRGcm9udG1hdHRlcikge1xuICAgICAgcmV0dXJuIGAjICR7dGl0bGV9XFxuXFxuIyMgTm90ZXNcXG5cXG4jIyBDdWVzXFxuXFxuIyMgUHJvZ3Jlc3Npb25cXG5gO1xuICAgIH1cblxuICAgIGNvbnN0IGVzY2FwZWQgPSB0aXRsZS5yZXBsYWNlQWxsKGBcImAsIGBcXFxcXCJgKTtcbiAgICByZXR1cm4gYC0tLVxudHlwZTogZXhlcmNpc2Vcbm5hbWU6IFwiJHtlc2NhcGVkfVwiXG5jcmVhdGVkOiAke2NyZWF0ZWR9XG5hbGlhc2VzOiBbXVxubXVzY2xlX2dyb3VwczogW11cbmVxdWlwbWVudDogW11cbi0tLVxuXG4jICR7dGl0bGV9XG5cbiMjIE5vdGVzXG5cbiMjIEN1ZXNcblxuIyMgUHJvZ3Jlc3Npb25cbmA7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGVuc3VyZUZvbGRlcihmb2xkZXJQYXRoOiBzdHJpbmcpIHtcbiAgICBjb25zdCBmb2xkZXIgPSB0aGlzLmFwcC52YXVsdC5nZXRBYnN0cmFjdEZpbGVCeVBhdGgoZm9sZGVyUGF0aCk7XG4gICAgaWYgKCFmb2xkZXIpIHtcbiAgICAgIGF3YWl0IHRoaXMuYXBwLnZhdWx0LmNyZWF0ZUZvbGRlcihmb2xkZXJQYXRoKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIHNhbml0aXplRmlsZU5hbWUobmFtZTogc3RyaW5nKSB7XG4gICAgcmV0dXJuIG5hbWVcbiAgICAgIC50cmltKClcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC8jXjpbXFxdfD8qXCI8Pl0vZywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEV4ZXJjaXNlTmFtZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHZhbHVlID0gXCJcIjtcbiAgcHJpdmF0ZSBvblN1Ym1pdDogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG9uU3VibWl0OiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5vblN1Ym1pdCA9IG9uU3VibWl0O1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuc2V0VGl0bGUoXCJOZXcgZXhlcmNpc2VcIik7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkV4ZXJjaXNlIG5hbWVcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJlLmcuIEJhcmJlbGwgQmVuY2ggUHJlc3NcIilcbiAgICAgICAgICAub25DaGFuZ2UoKHYpID0+ICh0aGlzLnZhbHVlID0gdikpO1xuICAgICAgICAvLyBGb2N1cyBjdXJzb3JcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGV4dC5pbnB1dEVsLmZvY3VzKCksIDApO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICAgIGJ0blxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQ3JlYXRlXCIpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKCFuYW1lKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLm9uU3VibWl0KG5hbWUpO1xuICAgICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oKGJ0bikgPT5cbiAgICAgICAgYnRuLnNldEljb24oXCJjcm9zc1wiKS5zZXRUb29sdGlwKFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5jbG9zZSgpKVxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgUGx1Z2luU2V0dGluZ1RhYiwgU2V0dGluZywgTm90aWNlIH0gZnJvbSBcIm9ic2lkaWFuXCI7XG5pbXBvcnQgdHlwZSBHeW1QbHVnaW4gZnJvbSBcIi4vbWFpblwiO1xuaW1wb3J0IHsgTmV3V29ya291dFBsYW5Nb2RhbCB9IGZyb20gXCIuL05ld1dvcmtvdXRQbGFuTW9kYWxcIjtcbmltcG9ydCB0eXBlIHsgV29ya291dFBsYW4gfSBmcm9tIFwiLi9zZXR0aW5nc1wiO1xuXG5leHBvcnQgY2xhc3MgR3ltU2V0dGluZ1RhYiBleHRlbmRzIFBsdWdpblNldHRpbmdUYWIge1xuICBwbHVnaW46IEd5bVBsdWdpbjtcblxuICBjb25zdHJ1Y3RvcihhcHA6IEFwcCwgcGx1Z2luOiBHeW1QbHVnaW4pIHtcbiAgICBzdXBlcihhcHAsIHBsdWdpbik7XG4gICAgdGhpcy5wbHVnaW4gPSBwbHVnaW47XG4gIH1cblxuICBkaXNwbGF5KCk6IHZvaWQge1xuICAgIGNvbnN0IHsgY29udGFpbmVyRWwgfSA9IHRoaXM7XG4gICAgY29udGFpbmVyRWwuZW1wdHkoKTtcblxuICAgIGNvbnRhaW5lckVsLmNyZWF0ZUVsKFwiaDJcIiwgeyB0ZXh0OiBcIkd5bSBQbHVnaW4gU2V0dGluZ3NcIiB9KTtcblxuICAgIC8vIC0tLSB5b3VyIGV4aXN0aW5nIHNldHRpbmdzIGhlcmUgKGZvbGRlciwgdG9nZ2xlcywgZXRjLikgLS0tXG5cbiAgICBjb250YWluZXJFbC5jcmVhdGVFbChcImgzXCIsIHsgdGV4dDogXCJXb3Jrb3V0IHBsYW5zXCIgfSk7XG5cbiAgICAvLyBDcmVhdGUgbmV3IHBsYW4gYnV0dG9uXG4gICAgbmV3IFNldHRpbmcoY29udGFpbmVyRWwpXG4gICAgICAuc2V0TmFtZShcIkNyZWF0ZSBhIG5ldyB3b3Jrb3V0IHBsYW5cIilcbiAgICAgIC5zZXREZXNjKFwiV29ya291dCBwbGFucyBhcmUgc3RvcmVkIGluIHBsdWdpbiBzZXR0aW5ncy5cIilcbiAgICAgIC5hZGRCdXR0b24oKGJ0bikgPT5cbiAgICAgICAgYnRuXG4gICAgICAgICAgLnNldEJ1dHRvblRleHQoXCJOZXcgcGxhblwiKVxuICAgICAgICAgIC5zZXRDdGEoKVxuICAgICAgICAgIC5vbkNsaWNrKCgpID0+IHtcbiAgICAgICAgICAgIG5ldyBOZXdXb3Jrb3V0UGxhbk1vZGFsKHRoaXMuYXBwLCBhc3luYyAobmFtZSkgPT4ge1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLmFkZFdvcmtvdXRQbGFuKG5hbWUpO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTsgLy8gcmUtcmVuZGVyIFVJXG4gICAgICAgICAgICB9KS5vcGVuKCk7XG4gICAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAvLyBMaXN0IG9mIHBsYW5zXG4gICAgY29uc3QgcGxhbnMgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy53b3Jrb3V0UGxhbnMgPz8gW107XG5cbiAgICBpZiAocGxhbnMubGVuZ3RoID09PSAwKSB7XG4gICAgICBjb250YWluZXJFbC5jcmVhdGVFbChcInBcIiwgeyB0ZXh0OiBcIk5vIHdvcmtvdXQgcGxhbnMgeWV0LlwiIH0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIFJlbmRlciBlYWNoIHBsYW4gcm93XG4gICAgcGxhbnMuZm9yRWFjaCgocGxhbikgPT4ge1xuICAgICAgY29uc3QgaXNBY3RpdmUgPSB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY3RpdmVXb3Jrb3V0UGxhbklkID09PSBwbGFuLmlkO1xuXG4gICAgICBuZXcgU2V0dGluZyhjb250YWluZXJFbClcbiAgICAgICAgLnNldE5hbWUoaXNBY3RpdmUgPyBgJHtwbGFuLm5hbWV9IChhY3RpdmUpYCA6IHBsYW4ubmFtZSlcbiAgICAgICAgLnNldERlc2MoYElEOiAke3BsYW4uaWR9YClcbiAgICAgICAgLmFkZEJ1dHRvbigoYnRuKSA9PiB7XG4gICAgICAgICAgYnRuXG4gICAgICAgICAgICAuc2V0QnV0dG9uVGV4dChpc0FjdGl2ZSA/IFwiQWN0aXZlXCIgOiBcIk1ha2UgYWN0aXZlXCIpXG4gICAgICAgICAgICAuc2V0Q3RhKCFpc0FjdGl2ZSlcbiAgICAgICAgICAgIC5zZXREaXNhYmxlZChpc0FjdGl2ZSlcbiAgICAgICAgICAgIC5vbkNsaWNrKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgdGhpcy5wbHVnaW4uc2V0dGluZ3MuYWN0aXZlV29ya291dFBsYW5JZCA9IHBsYW4uaWQ7XG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgICAgICAgICAgICB0aGlzLmRpc3BsYXkoKTsgLy8gcmUtcmVuZGVyXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICAgICAgLmFkZFRleHQoKHRleHQpID0+IHtcbiAgICAgICAgICB0ZXh0XG4gICAgICAgICAgICAuc2V0UGxhY2Vob2xkZXIoXCJQbGFuIG5hbWVcIilcbiAgICAgICAgICAgIC5zZXRWYWx1ZShwbGFuLm5hbWUpXG4gICAgICAgICAgICAub25DaGFuZ2UoYXN5bmMgKHZhbHVlKSA9PiB7XG4gICAgICAgICAgICAgIHBsYW4ubmFtZSA9IHZhbHVlO1xuICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgLy8gb3B0aW9uYWw6IHJlLXJlbmRlciB0byB1cGRhdGUgbGFiZWwgaW5zdGFudGx5XG4gICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgICAgIC5hZGRFeHRyYUJ1dHRvbigoYnRuKSA9PlxuICAgICAgICAgIGJ0blxuICAgICAgICAgICAgLnNldEljb24oXCJ0cmFzaFwiKVxuICAgICAgICAgICAgLnNldFRvb2x0aXAoXCJEZWxldGUgcGxhblwiKVxuICAgICAgICAgICAgLm9uQ2xpY2soYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgICBjb25zdCBvayA9IGNvbmZpcm0oYERlbGV0ZSB3b3Jrb3V0IHBsYW4gXCIke3BsYW4ubmFtZX1cIj9gKTtcbiAgICAgICAgICAgICAgaWYgKCFvaykgcmV0dXJuO1xuXG4gICAgICAgICAgICAgIGF3YWl0IHRoaXMuZGVsZXRlV29ya291dFBsYW4ocGxhbi5pZCk7XG5cbiAgICAgICAgICAgICAgLy8gSWYgeW91IGRlbGV0ZWQgdGhlIGFjdGl2ZSBwbGFuLCBjbGVhciBhY3RpdmVcbiAgICAgICAgICAgICAgaWYgKHRoaXMucGx1Z2luLnNldHRpbmdzLmFjdGl2ZVdvcmtvdXRQbGFuSWQgPT09IHBsYW4uaWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy5hY3RpdmVXb3Jrb3V0UGxhbklkID0gbnVsbDtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLnBsdWdpbi5zYXZlU2V0dGluZ3MoKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHRoaXMuZGlzcGxheSgpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgKTtcbiAgICB9KTtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgYWRkV29ya291dFBsYW4obmFtZTogc3RyaW5nKSB7XG4gICAgY29uc3QgdHJpbW1lZCA9IG5hbWUudHJpbSgpO1xuICAgIGlmICghdHJpbW1lZCkgcmV0dXJuO1xuXG4gICAgLy8gUHJldmVudCBkdXBsaWNhdGVzIGJ5IG5hbWVcbiAgICBjb25zdCBleGlzdHMgPSAodGhpcy5wbHVnaW4uc2V0dGluZ3Mud29ya291dFBsYW5zID8/IFtdKS5zb21lKFxuICAgICAgKHApID0+IHAubmFtZS50cmltKCkudG9Mb3dlckNhc2UoKSA9PT0gdHJpbW1lZC50b0xvd2VyQ2FzZSgpXG4gICAgKTtcbiAgICBpZiAoZXhpc3RzKSB7XG4gICAgICBuZXcgTm90aWNlKFwiQSBwbGFuIHdpdGggdGhhdCBuYW1lIGFscmVhZHkgZXhpc3RzLlwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCBwbGFuOiBXb3Jrb3V0UGxhbiA9IHtcbiAgICAgIGlkOiB0aGlzLm5ld0lkKCksXG4gICAgICBuYW1lOiB0cmltbWVkLFxuICAgIH07XG5cbiAgICB0aGlzLnBsdWdpbi5zZXR0aW5ncy53b3Jrb3V0UGxhbnMgPSBbXG4gICAgICAuLi4odGhpcy5wbHVnaW4uc2V0dGluZ3Mud29ya291dFBsYW5zID8/IFtdKSxcbiAgICAgIHBsYW4sXG4gICAgXTtcblxuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICAgIG5ldyBOb3RpY2UoYENyZWF0ZWQgcGxhbjogJHt0cmltbWVkfWApO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBkZWxldGVXb3Jrb3V0UGxhbihwbGFuSWQ6IHN0cmluZykge1xuICAgIHRoaXMucGx1Z2luLnNldHRpbmdzLndvcmtvdXRQbGFucyA9ICh0aGlzLnBsdWdpbi5zZXR0aW5ncy53b3Jrb3V0UGxhbnMgPz8gW10pLmZpbHRlcihcbiAgICAgIChwKSA9PiBwLmlkICE9PSBwbGFuSWRcbiAgICApO1xuICAgIGF3YWl0IHRoaXMucGx1Z2luLnNhdmVTZXR0aW5ncygpO1xuICB9XG5cbiAgcHJpdmF0ZSBuZXdJZCgpOiBzdHJpbmcge1xuICAgIC8vIFdvcmtzIGluIG1vZGVybiBFbGVjdHJvbjsgZmFsbGJhY2sgaW5jbHVkZWRcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgaWYgKHR5cGVvZiBjcnlwdG8gIT09IFwidW5kZWZpbmVkXCIgJiYgY3J5cHRvLnJhbmRvbVVVSUQpIHJldHVybiBjcnlwdG8ucmFuZG9tVVVJRCgpO1xuICAgIHJldHVybiBgJHtEYXRlLm5vdygpfS0ke01hdGgucmFuZG9tKCkudG9TdHJpbmcoMTYpLnNsaWNlKDIpfWA7XG4gIH1cbn1cblxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIE5ld1dvcmtvdXRQbGFuTW9kYWwgZXh0ZW5kcyBNb2RhbCB7XG4gIHByaXZhdGUgdmFsdWUgPSBcIlwiO1xuICBwcml2YXRlIG9uU3VibWl0OiAobmFtZTogc3RyaW5nKSA9PiB2b2lkO1xuXG4gIGNvbnN0cnVjdG9yKGFwcDogQXBwLCBvblN1Ym1pdDogKG5hbWU6IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5vblN1Ym1pdCA9IG9uU3VibWl0O1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuc2V0VGl0bGUoXCJOZXcgd29ya291dCBwbGFuXCIpO1xuXG4gICAgbmV3IFNldHRpbmcoY29udGVudEVsKVxuICAgICAgLnNldE5hbWUoXCJQbGFuIG5hbWVcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJlLmcuIFB1c2gvUHVsbC9MZWdzXCIpXG4gICAgICAgICAgLm9uQ2hhbmdlKCh2KSA9PiAodGhpcy52YWx1ZSA9IHYpKTtcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGV4dC5pbnB1dEVsLmZvY3VzKCksIDApO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICAgIGJ0blxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQ3JlYXRlXCIpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKCFuYW1lKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLm9uU3VibWl0KG5hbWUpO1xuICAgICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oKGJ0bikgPT5cbiAgICAgICAgYnRuLnNldEljb24oXCJjcm9zc1wiKS5zZXRUb29sdGlwKFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5jbG9zZSgpKVxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuIiwgImV4cG9ydCBpbnRlcmZhY2UgV29ya291dFBsYW4ge1xuICBpZDogc3RyaW5nO1xuICBuYW1lOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgR3ltUGx1Z2luU2V0dGluZ3Mge1xuICBleGVyY2lzZXNGb2xkZXI6IHN0cmluZztcbiAgb3BlbkFmdGVyQ3JlYXRlOiBib29sZWFuO1xuICBhZGRGcm9udG1hdHRlcjogYm9vbGVhbjtcblxuICB3b3Jrb3V0UGxhbnM6IFdvcmtvdXRQbGFuW107XG4gIGFjdGl2ZVdvcmtvdXRQbGFuSWQ6IHN0cmluZyB8IG51bGw7XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBHeW1QbHVnaW5TZXR0aW5ncyA9IHtcbiAgZXhlcmNpc2VzRm9sZGVyOiBcIkV4ZXJjaXNlc1wiLFxuICBvcGVuQWZ0ZXJDcmVhdGU6IHRydWUsXG4gIGFkZEZyb250bWF0dGVyOiB0cnVlLFxuXG4gIHdvcmtvdXRQbGFuczogW10sXG4gIGFjdGl2ZVdvcmtvdXRQbGFuSWQ6IG51bGwsXG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXFEOzs7QUNBckQsc0JBQW9DO0FBRTdCLElBQU0sb0JBQU4sY0FBZ0Msc0JBQU07QUFBQSxFQUkzQyxZQUFZLEtBQVUsVUFBbUM7QUFDdkQsVUFBTSxHQUFHO0FBSlgsU0FBUSxRQUFRO0FBS2QsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQVM7QUFDUCxVQUFNLEVBQUUsVUFBVSxJQUFJO0FBQ3RCLGNBQVUsTUFBTTtBQUNoQixTQUFLLFNBQVMsY0FBYztBQUU1QixRQUFJLHdCQUFRLFNBQVMsRUFDbEIsUUFBUSxlQUFlLEVBQ3ZCLFFBQVEsQ0FBQyxTQUFTO0FBQ2pCLFdBQUssZUFBZSwwQkFBMEIsRUFDM0MsU0FBUyxDQUFDLE1BQU8sS0FBSyxRQUFRLENBQUU7QUFFbkMsYUFBTyxXQUFXLE1BQU0sS0FBSyxRQUFRLE1BQU0sR0FBRyxDQUFDO0FBQUEsSUFDakQsQ0FBQztBQUVILFFBQUksd0JBQVEsU0FBUyxFQUNsQjtBQUFBLE1BQVUsQ0FBQyxRQUNWLElBQ0csY0FBYyxRQUFRLEVBQ3RCLE9BQU8sRUFDUCxRQUFRLE1BQU07QUFDYixjQUFNLE9BQU8sS0FBSyxNQUFNLEtBQUs7QUFDN0IsWUFBSSxDQUFDLEtBQU07QUFDWCxhQUFLLE1BQU07QUFDWCxhQUFLLFNBQVMsSUFBSTtBQUFBLE1BQ3BCLENBQUM7QUFBQSxJQUNMLEVBQ0M7QUFBQSxNQUFlLENBQUMsUUFDZixJQUFJLFFBQVEs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QUFLLFNBQVMsZ0JBQWdCO0FBQ2pDLGFBQU8sS0FBSyxLQUFLO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQUNuQjtBQUVBLFVBQU0sVUFBVSxNQUFNLFdBQVcsS0FBSyxLQUFLO0FBQzNDLFdBQU87QUFBQTtBQUFBLFNBRUYsT0FBTztBQUFBLFdBQ0wsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxJQU1kLEtBQUs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBUVA7QUFBQSxFQUVBLE1BQWMsYUFBYSxZQUFvQjtBQUM3QyxVQUFNLFNBQVMsS0FBSyxJQUFJLE1BQU0sc0JBQXNCLFVBQVU7QUFDOUQsUUFBSSxDQUFDLFFBQVE7QUFDWCxZQUFNLEtBQUssSUFBSSxNQUFNLGFBQWEsVUFBVTtBQUFBLElBQzlDO0FBQUEsRUFDRjtBQUFBLEVBRVEsaUJBQWlCLE1BQWM7QUFDckMsV0FBTyxLQUNKLEtBQUssRUFDTCxRQUFRLHNCQUFzQixFQUFFLEVBQ2hDLFFBQVEsUUFBUSxHQUFHO0FBQUEsRUFDeEI7QUFDRjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X29ic2lkaWFuIiwgImltcG9ydF9vYnNpZGlhbiIsICJpbXBvcnRfb2JzaWRpYW4iXQp9Cg==
