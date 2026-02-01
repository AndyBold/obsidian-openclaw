import { Plugin, WorkspaceLeaf } from "obsidian";
import { PipView, PIP_VIEW_TYPE } from "./src/PipView";
import { PipbotAPI } from "./src/api";
import { ActionExecutor } from "./src/actions";
import { PipbotSettingTab } from "./src/settings";
import { PipbotSettings, DEFAULT_SETTINGS } from "./src/types";

export default class PipbotPlugin extends Plugin {
  settings: PipbotSettings;
  api: PipbotAPI;
  actionExecutor: ActionExecutor;

  async onload(): Promise<void> {
    await this.loadSettings();

    this.api = new PipbotAPI(this.settings);
    this.actionExecutor = new ActionExecutor(this.app);

    // Register the chat view
    this.registerView(PIP_VIEW_TYPE, (leaf) => new PipView(leaf, this));

    // Add ribbon icon to open chat
    this.addRibbonIcon("message-circle", "Open Pip Chat", () => {
      this.activateView();
    });

    // Add command to open chat
    this.addCommand({
      id: "open-pip-chat",
      name: "Open Pip Chat",
      callback: () => this.activateView(),
    });

    // Add command to ask about current note
    this.addCommand({
      id: "ask-pip-about-note",
      name: "Ask Pip about current note",
      callback: async () => {
        await this.activateView();
        // The view will be opened, user can then type their question
      },
    });

    // Settings tab
    this.addSettingTab(new PipbotSettingTab(this.app, this));

    console.log("OpenClaw loaded 🐉");
  }

  onunload(): void {
    console.log("OpenClaw unloaded");
  }

  async loadSettings(): Promise<void> {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(): Promise<void> {
    await this.saveData(this.settings);
    // Recreate API with new settings
    this.api = new PipbotAPI(this.settings);
  }

  async activateView(): Promise<void> {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(PIP_VIEW_TYPE);

    if (leaves.length > 0) {
      // View already exists, focus it
      leaf = leaves[0];
    } else {
      // Create new view in right sidebar
      leaf = workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: PIP_VIEW_TYPE, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }
}
