import { ItemView, WorkspaceLeaf, MarkdownRenderer, TFile } from "obsidian";
import type PipbotPlugin from "../main";
import { ChatMessage } from "./types";

export const PIP_VIEW_TYPE = "pip-chat-view";

export class PipView extends ItemView {
  private messages: ChatMessage[] = [];
  private inputEl: HTMLTextAreaElement;
  private messagesEl: HTMLElement;
  private isLoading = false;

  constructor(leaf: WorkspaceLeaf, private plugin: PipbotPlugin) {
    super(leaf);
  }

  getViewType(): string {
    return PIP_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Pip";
  }

  getIcon(): string {
    return "message-circle";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("pip-chat-container");

    // Messages area
    this.messagesEl = container.createDiv({ cls: "pip-messages" });

    // Input area
    const inputContainer = container.createDiv({ cls: "pip-input-container" });
    
    this.inputEl = inputContainer.createEl("textarea", {
      cls: "pip-input",
      attr: { placeholder: "Ask Pip anything...", rows: "2" },
    });

    const buttonRow = inputContainer.createDiv({ cls: "pip-button-row" });
    
    const includeNoteToggle = buttonRow.createEl("label", { cls: "pip-toggle" });
    const checkbox = includeNoteToggle.createEl("input", { type: "checkbox" });
    checkbox.checked = true;
    includeNoteToggle.appendText(" Include current note");
    
    const sendBtn = buttonRow.createEl("button", {
      cls: "pip-send-btn",
      text: "Send",
    });

    // Event handlers
    sendBtn.addEventListener("click", () => this.sendMessage(checkbox.checked));
    this.inputEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        this.sendMessage(checkbox.checked);
      }
    });

    // Welcome message
    this.addMessage({
      role: "assistant",
      content: "Hey! 🐉 I'm Pip. Ask me anything, or ask me to create/edit notes.",
      timestamp: Date.now(),
    });
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }

  private async sendMessage(includeCurrentNote: boolean): Promise<void> {
    const message = this.inputEl.value.trim();
    if (!message || this.isLoading) return;

    this.inputEl.value = "";
    this.isLoading = true;

    // Add user message
    this.addMessage({
      role: "user",
      content: message,
      timestamp: Date.now(),
    });

    // Get context
    let context: { currentFile?: string; currentContent?: string } = {};
    if (includeCurrentNote) {
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile instanceof TFile) {
        context.currentFile = activeFile.path;
        context.currentContent = await this.app.vault.read(activeFile);
      }
    }

    // Show loading indicator
    const loadingEl = this.messagesEl.createDiv({ cls: "pip-message pip-loading" });
    loadingEl.setText("Pip is thinking...");

    try {
      const response = await this.plugin.api.chat(message, context);

      // Remove loading indicator
      loadingEl.remove();

      // Add assistant message
      this.addMessage({
        role: "assistant",
        content: response.text,
        timestamp: Date.now(),
        actions: response.actions,
      });

      // Execute actions
      if (response.actions.length > 0) {
        await this.plugin.actionExecutor.execute(response.actions);
      }
    } catch (err) {
      loadingEl.remove();
      this.addMessage({
        role: "assistant",
        content: `Error: ${err instanceof Error ? err.message : "Something went wrong"}`,
        timestamp: Date.now(),
      });
    }

    this.isLoading = false;
  }

  private addMessage(msg: ChatMessage): void {
    this.messages.push(msg);

    const messageEl = this.messagesEl.createDiv({
      cls: `pip-message pip-${msg.role}`,
    });

    const contentEl = messageEl.createDiv({ cls: "pip-message-content" });
    
    // Render markdown for assistant messages
    if (msg.role === "assistant") {
      MarkdownRenderer.render(
        this.app,
        msg.content,
        contentEl,
        "",
        this.plugin
      );
    } else {
      contentEl.setText(msg.content);
    }

    // Show actions if any
    if (msg.actions && msg.actions.length > 0 && this.plugin.settings.showActionsInChat) {
      const actionsEl = messageEl.createDiv({ cls: "pip-actions" });
      actionsEl.setText(`📁 ${msg.actions.length} file action(s)`);
    }

    // Scroll to bottom
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
  }
}
