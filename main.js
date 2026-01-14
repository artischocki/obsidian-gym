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
var import_obsidian2 = require("obsidian");

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

// src/main.ts
var GymPlugin = class extends import_obsidian2.Plugin {
  async onload() {
    this.addCommand({
      id: "gym-create-exercise",
      name: "Gym: Create new exercise",
      callback: () => {
        new ExerciseNameModal(this.app, (name) => this.createExerciseNote(name)).open();
      }
    });
  }
  async createExerciseNote(exerciseName) {
    const folder = "Exercises";
    const safeName = this.sanitizeFileName(exerciseName);
    const path = (0, import_obsidian2.normalizePath)(`${folder}/${safeName}.md`);
    await this.ensureFolder(folder);
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof import_obsidian2.TFile) {
      new import_obsidian2.Notice(`Exercise already exists: ${path}`);
      await this.app.workspace.getLeaf(true).openFile(existing);
      return;
    }
    const content = this.exerciseTemplate(exerciseName);
    const file = await this.app.vault.create(path, content);
    new import_obsidian2.Notice(`Created exercise: ${exerciseName}`);
    await this.app.workspace.getLeaf(true).openFile(file);
  }
  exerciseTemplate(exerciseName) {
    const created = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    return `---
type: exercise
name: "${exerciseName.replaceAll(`"`, `\\"`)}"
created: ${created}
aliases: []
muscle_groups: []
equipment: []
---

# ${exerciseName}

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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsic3JjL21haW4udHMiLCAic3JjL0V4ZXJjaXNlTmFtZU1vZGFsLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBOb3RpY2UsIFBsdWdpbiwgbm9ybWFsaXplUGF0aCwgVEZpbGUgfSBmcm9tIFwib2JzaWRpYW5cIjtcbmltcG9ydCB7IEV4ZXJjaXNlTmFtZU1vZGFsIH0gZnJvbSBcIi4vRXhlcmNpc2VOYW1lTW9kYWxcIjtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgR3ltUGx1Z2luIGV4dGVuZHMgUGx1Z2luIHtcbiAgYXN5bmMgb25sb2FkKCkge1xuICAgIHRoaXMuYWRkQ29tbWFuZCh7XG4gICAgICBpZDogXCJneW0tY3JlYXRlLWV4ZXJjaXNlXCIsXG4gICAgICBuYW1lOiBcIkd5bTogQ3JlYXRlIG5ldyBleGVyY2lzZVwiLFxuICAgICAgY2FsbGJhY2s6ICgpID0+IHtcbiAgICAgICAgbmV3IEV4ZXJjaXNlTmFtZU1vZGFsKHRoaXMuYXBwLCAobmFtZSkgPT4gdGhpcy5jcmVhdGVFeGVyY2lzZU5vdGUobmFtZSkpLm9wZW4oKTtcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBwcml2YXRlIGFzeW5jIGNyZWF0ZUV4ZXJjaXNlTm90ZShleGVyY2lzZU5hbWU6IHN0cmluZykge1xuICAgIGNvbnN0IGZvbGRlciA9IFwiRXhlcmNpc2VzXCI7XG4gICAgY29uc3Qgc2FmZU5hbWUgPSB0aGlzLnNhbml0aXplRmlsZU5hbWUoZXhlcmNpc2VOYW1lKTtcbiAgICBjb25zdCBwYXRoID0gbm9ybWFsaXplUGF0aChgJHtmb2xkZXJ9LyR7c2FmZU5hbWV9Lm1kYCk7XG5cbiAgICAvLyBFbnN1cmUgZm9sZGVyIGV4aXN0c1xuICAgIGF3YWl0IHRoaXMuZW5zdXJlRm9sZGVyKGZvbGRlcik7XG5cbiAgICAvLyBEb25cdTIwMTl0IG92ZXJ3cml0ZSBleGlzdGluZ1xuICAgIGNvbnN0IGV4aXN0aW5nID0gdGhpcy5hcHAudmF1bHQuZ2V0QWJzdHJhY3RGaWxlQnlQYXRoKHBhdGgpO1xuICAgIGlmIChleGlzdGluZyBpbnN0YW5jZW9mIFRGaWxlKSB7XG4gICAgICBuZXcgTm90aWNlKGBFeGVyY2lzZSBhbHJlYWR5IGV4aXN0czogJHtwYXRofWApO1xuICAgICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZXhpc3RpbmcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGNvbnRlbnQgPSB0aGlzLmV4ZXJjaXNlVGVtcGxhdGUoZXhlcmNpc2VOYW1lKTtcblxuICAgIGNvbnN0IGZpbGUgPSBhd2FpdCB0aGlzLmFwcC52YXVsdC5jcmVhdGUocGF0aCwgY29udGVudCk7XG4gICAgbmV3IE5vdGljZShgQ3JlYXRlZCBleGVyY2lzZTogJHtleGVyY2lzZU5hbWV9YCk7XG4gICAgYXdhaXQgdGhpcy5hcHAud29ya3NwYWNlLmdldExlYWYodHJ1ZSkub3BlbkZpbGUoZmlsZSk7XG4gIH1cblxuICBwcml2YXRlIGV4ZXJjaXNlVGVtcGxhdGUoZXhlcmNpc2VOYW1lOiBzdHJpbmcpIHtcbiAgICBjb25zdCBjcmVhdGVkID0gbmV3IERhdGUoKS50b0lTT1N0cmluZygpLnNsaWNlKDAsIDEwKTsgLy8gWVlZWS1NTS1ERFxuICAgIHJldHVybiBgLS0tXG50eXBlOiBleGVyY2lzZVxubmFtZTogXCIke2V4ZXJjaXNlTmFtZS5yZXBsYWNlQWxsKGBcImAsIGBcXFxcXCJgKX1cIlxuY3JlYXRlZDogJHtjcmVhdGVkfVxuYWxpYXNlczogW11cbm11c2NsZV9ncm91cHM6IFtdXG5lcXVpcG1lbnQ6IFtdXG4tLS1cblxuIyAke2V4ZXJjaXNlTmFtZX1cblxuIyMgTm90ZXNcblxuIyMgQ3Vlc1xuXG4jIyBQcm9ncmVzc2lvblxuYDtcbiAgfVxuXG4gIHByaXZhdGUgYXN5bmMgZW5zdXJlRm9sZGVyKGZvbGRlclBhdGg6IHN0cmluZykge1xuICAgIGNvbnN0IGZvbGRlciA9IHRoaXMuYXBwLnZhdWx0LmdldEFic3RyYWN0RmlsZUJ5UGF0aChmb2xkZXJQYXRoKTtcbiAgICBpZiAoIWZvbGRlcikge1xuICAgICAgYXdhaXQgdGhpcy5hcHAudmF1bHQuY3JlYXRlRm9sZGVyKGZvbGRlclBhdGgpO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgc2FuaXRpemVGaWxlTmFtZShuYW1lOiBzdHJpbmcpIHtcbiAgICAvLyBSZW1vdmVzIGNoYXJhY3RlcnMgdGhhdCBicmVhayBmaWxlIHBhdGhzIGFjcm9zcyBPU2VzXG4gICAgcmV0dXJuIG5hbWVcbiAgICAgIC50cmltKClcbiAgICAgIC5yZXBsYWNlKC9bXFxcXC8jXjpbXFxdfD8qXCI8Pl0vZywgXCJcIilcbiAgICAgIC5yZXBsYWNlKC9cXHMrL2csIFwiIFwiKTtcbiAgfVxufVxuIiwgImltcG9ydCB7IEFwcCwgTW9kYWwsIFNldHRpbmcgfSBmcm9tIFwib2JzaWRpYW5cIjtcblxuZXhwb3J0IGNsYXNzIEV4ZXJjaXNlTmFtZU1vZGFsIGV4dGVuZHMgTW9kYWwge1xuICBwcml2YXRlIHZhbHVlID0gXCJcIjtcbiAgcHJpdmF0ZSBvblN1Ym1pdDogKHZhbHVlOiBzdHJpbmcpID0+IHZvaWQ7XG5cbiAgY29uc3RydWN0b3IoYXBwOiBBcHAsIG9uU3VibWl0OiAodmFsdWU6IHN0cmluZykgPT4gdm9pZCkge1xuICAgIHN1cGVyKGFwcCk7XG4gICAgdGhpcy5vblN1Ym1pdCA9IG9uU3VibWl0O1xuICB9XG5cbiAgb25PcGVuKCkge1xuICAgIGNvbnN0IHsgY29udGVudEVsIH0gPSB0aGlzO1xuICAgIGNvbnRlbnRFbC5lbXB0eSgpO1xuICAgIHRoaXMuc2V0VGl0bGUoXCJOZXcgZXhlcmNpc2VcIik7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuc2V0TmFtZShcIkV4ZXJjaXNlIG5hbWVcIilcbiAgICAgIC5hZGRUZXh0KCh0ZXh0KSA9PiB7XG4gICAgICAgIHRleHQuc2V0UGxhY2Vob2xkZXIoXCJlLmcuIEJhcmJlbGwgQmVuY2ggUHJlc3NcIilcbiAgICAgICAgICAub25DaGFuZ2UoKHYpID0+ICh0aGlzLnZhbHVlID0gdikpO1xuICAgICAgICAvLyBGb2N1cyBjdXJzb3JcbiAgICAgICAgd2luZG93LnNldFRpbWVvdXQoKCkgPT4gdGV4dC5pbnB1dEVsLmZvY3VzKCksIDApO1xuICAgICAgfSk7XG5cbiAgICBuZXcgU2V0dGluZyhjb250ZW50RWwpXG4gICAgICAuYWRkQnV0dG9uKChidG4pID0+XG4gICAgICAgIGJ0blxuICAgICAgICAgIC5zZXRCdXR0b25UZXh0KFwiQ3JlYXRlXCIpXG4gICAgICAgICAgLnNldEN0YSgpXG4gICAgICAgICAgLm9uQ2xpY2soKCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgbmFtZSA9IHRoaXMudmFsdWUudHJpbSgpO1xuICAgICAgICAgICAgaWYgKCFuYW1lKSByZXR1cm47XG4gICAgICAgICAgICB0aGlzLmNsb3NlKCk7XG4gICAgICAgICAgICB0aGlzLm9uU3VibWl0KG5hbWUpO1xuICAgICAgICAgIH0pXG4gICAgICApXG4gICAgICAuYWRkRXh0cmFCdXR0b24oKGJ0bikgPT5cbiAgICAgICAgYnRuLnNldEljb24oXCJjcm9zc1wiKS5zZXRUb29sdGlwKFwiQ2FuY2VsXCIpLm9uQ2xpY2soKCkgPT4gdGhpcy5jbG9zZSgpKVxuICAgICAgKTtcbiAgfVxuXG4gIG9uQ2xvc2UoKSB7XG4gICAgdGhpcy5jb250ZW50RWwuZW1wdHkoKTtcbiAgfVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsSUFBQUEsbUJBQXFEOzs7QUNBckQsc0JBQW9DO0FBRTdCLElBQU0sb0JBQU4sY0FBZ0Msc0JBQU07QUFBQSxFQUkzQyxZQUFZLEtBQVUsVUFBbUM7QUFDdkQsVUFBTSxHQUFHO0FBSlgsU0FBUSxRQUFRO0FBS2QsU0FBSyxXQUFXO0FBQUEsRUFDbEI7QUFBQSxFQUVBLFNBQVM7QUFDUCxVQUFNLEVBQUUsVUFBVSxJQUFJ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
