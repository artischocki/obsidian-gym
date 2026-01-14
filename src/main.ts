import { Notice, Plugin, normalizePath, TFile } from "obsidian";
import { ExerciseNameModal } from "./ExerciseNameModal";

export default class GymPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "gym-create-exercise",
      name: "Gym: Create new exercise",
      callback: () => {
        new ExerciseNameModal(this.app, (name) => this.createExerciseNote(name)).open();
      },
    });
  }

  private async createExerciseNote(exerciseName: string) {
    const folder = "Exercises";
    const safeName = this.sanitizeFileName(exerciseName);
    const path = normalizePath(`${folder}/${safeName}.md`);

    // Ensure folder exists
    await this.ensureFolder(folder);

    // Don’t overwrite existing
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      new Notice(`Exercise already exists: ${path}`);
      await this.app.workspace.getLeaf(true).openFile(existing);
      return;
    }

    const content = this.exerciseTemplate(exerciseName);

    const file = await this.app.vault.create(path, content);
    new Notice(`Created exercise: ${exerciseName}`);
    await this.app.workspace.getLeaf(true).openFile(file);
  }

  private exerciseTemplate(exerciseName: string) {
    const created = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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

  private async ensureFolder(folderPath: string) {
    const folder = this.app.vault.getAbstractFileByPath(folderPath);
    if (!folder) {
      await this.app.vault.createFolder(folderPath);
    }
  }

  private sanitizeFileName(name: string) {
    // Removes characters that break file paths across OSes
    return name
      .trim()
      .replace(/[\\/#^:[\]|?*"<>]/g, "")
      .replace(/\s+/g, " ");
  }
}
