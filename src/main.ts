import { Plugin, Notice } from "obsidian";

export default class GymPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: "hello",
      name: "Say hello",
      callback: () => new Notice("Hello from Gym Plugin!")
    });
  }
}
