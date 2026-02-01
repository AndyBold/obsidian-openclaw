import { App, PluginSettingTab, Setting } from "obsidian";
import type PipbotPlugin from "../main";

export class PipbotSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: PipbotPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "OpenClaw Settings" });

    new Setting(containerEl)
      .setName("Gateway URL")
      .setDesc("URL of your OpenClaw gateway (default: http://127.0.0.1:18789)")
      .addText((text) =>
        text
          .setPlaceholder("http://127.0.0.1:18789")
          .setValue(this.plugin.settings.gatewayUrl)
          .onChange(async (value) => {
            this.plugin.settings.gatewayUrl = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Gateway Token")
      .setDesc("Authentication token for the OpenClaw gateway")
      .addText((text) => {
        text
          .setPlaceholder("Enter your token")
          .setValue(this.plugin.settings.gatewayToken)
          .onChange(async (value) => {
            this.plugin.settings.gatewayToken = value;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
      });

    new Setting(containerEl)
      .setName("Show actions in chat")
      .setDesc("Display file action indicators in chat messages")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showActionsInChat)
          .onChange(async (value) => {
            this.plugin.settings.showActionsInChat = value;
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Connection Test" });

    const testContainer = containerEl.createDiv({ cls: "pip-test-container" });
    const testBtn = testContainer.createEl("button", { text: "Test Connection" });
    const testResult = testContainer.createEl("span", { cls: "pip-test-result" });

    testBtn.addEventListener("click", async () => {
      testResult.setText("Testing...");
      try {
        const response = await this.plugin.api.chat("Say 'Connection successful!' in 5 words or less", {});
        testResult.setText(`✓ ${response.text}`);
        testResult.addClass("pip-test-success");
        testResult.removeClass("pip-test-error");
      } catch (err) {
        testResult.setText(`✗ ${err instanceof Error ? err.message : "Failed"}`);
        testResult.addClass("pip-test-error");
        testResult.removeClass("pip-test-success");
      }
    });
  }
}
