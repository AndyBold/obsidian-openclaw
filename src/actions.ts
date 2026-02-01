import { App, TFile, TFolder, Notice } from "obsidian";
import { PipAction } from "./types";

export class ActionExecutor {
  constructor(private app: App) {}

  async execute(actions: PipAction[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const action of actions) {
      try {
        await this.executeOne(action);
        success++;
      } catch (err) {
        console.error(`Action failed:`, action, err);
        new Notice(`Failed: ${action.action} - ${err}`);
        failed++;
      }
    }

    if (success > 0) {
      new Notice(`Pip: ${success} action(s) completed`);
    }

    return { success, failed };
  }

  private async executeOne(action: PipAction): Promise<void> {
    const { vault } = this.app;

    switch (action.action) {
      case "createFile": {
        // Ensure parent folder exists
        const folder = action.path.substring(0, action.path.lastIndexOf("/"));
        if (folder && !vault.getAbstractFileByPath(folder)) {
          await vault.createFolder(folder);
        }
        await vault.create(action.path, action.content);
        break;
      }

      case "updateFile": {
        const file = vault.getAbstractFileByPath(action.path);
        if (!(file instanceof TFile)) {
          throw new Error(`File not found: ${action.path}`);
        }
        await vault.modify(file, action.content);
        break;
      }

      case "appendToFile": {
        const file = vault.getAbstractFileByPath(action.path);
        if (!(file instanceof TFile)) {
          throw new Error(`File not found: ${action.path}`);
        }
        const existing = await vault.read(file);
        await vault.modify(file, existing + action.content);
        break;
      }

      case "deleteFile": {
        const file = vault.getAbstractFileByPath(action.path);
        if (!file) {
          throw new Error(`File not found: ${action.path}`);
        }
        await vault.delete(file);
        break;
      }

      case "renameFile": {
        const file = vault.getAbstractFileByPath(action.path);
        if (!file) {
          throw new Error(`File not found: ${action.path}`);
        }
        await vault.rename(file, action.newPath);
        break;
      }

      case "openFile": {
        const file = vault.getAbstractFileByPath(action.path);
        if (!(file instanceof TFile)) {
          throw new Error(`File not found: ${action.path}`);
        }
        await this.app.workspace.getLeaf().openFile(file);
        break;
      }

      default:
        throw new Error(`Unknown action: ${(action as any).action}`);
    }
  }
}
