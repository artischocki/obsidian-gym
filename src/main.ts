import { Notice, Plugin, normalizePath, TFile } from "obsidian";
import { ExerciseNameModal } from "./ExerciseNameModal";
import { GymSettingTab } from "./GymSettingTab";
import { DEFAULT_SETTINGS, type GymPluginSettings } from "./settings";

export default class GymPlugin extends Plugin {
  settings: GymPluginSettings;

  async onload() {
    await this.loadSettings();

    // Settings UI
    this.addSettingTab(new GymSettingTab(this.app, this));

    // Command
    this.addCommand({
      id: "gym-create-exercise",
      name: "Gym: Create new exercise",
      callback: () => {
        new ExerciseNameModal(this.app, (name) => this.createExerciseNote(name)).open();
      },
    });
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async createExerciseNote(exerciseName: string) {
    const folder = this.settings.exercisesFolder || "Exercises";
    const safeName = this.sanitizeFileName(exerciseName);
    const path = normalizePath(`${folder}/${safeName}.md`);

    await this.ensureFolder(folder);

    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      new Notice(`Exercise already exists: ${path}`);
      if (this.settings.openAfterCreate) {
        await this.app.workspace.getLeaf(true).openFile(existing);
      }
      return;
    }

    const content = this.exerciseTemplate(exerciseName);

    const file = await this.app.vault.create(path, content);
    new Notice(`Created exercise: ${exerciseName}`);

    if (this.settings.openAfterCreate) {
      await this.app.workspace.getLeaf(true).openFile(file);
    }
  }

  private exerciseTemplate(exerciseName: string) {
    const title = exerciseName.trim();
    const created = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    if (!this.settings.addFrontmatter) {
      return `# ${title}\n\n## Notes\n\n## Cues\n\n## Progression\n`;
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

  private async ensureFolder(folderPath: string) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  private sanitizeFileName(name: string) {
    return name
      .trim()
      .replace(/[\\/#^:[\]|?*"<>]/g, "")
      .replace(/\s+/g, " ");
  }
}
