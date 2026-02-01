import { App, PluginSettingTab, Setting } from "obsidian";
import type OpenClawPlugin from "../main";
import { secureTokenStorage } from "./secureStorage";

export class OpenClawSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: OpenClawPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "OpenClaw Settings" });

    new Setting(containerEl)
      .setName("Gateway URL")
      .setDesc("URL of your OpenClaw gateway. Do not include a trailing slash.")
      .addText((text) =>
        text
          .setPlaceholder("http://127.0.0.1:18789")
          .setValue(this.plugin.settings.gatewayUrl)
          .onChange(async (value) => {
            // Strip trailing slashes to prevent 405 errors
            this.plugin.settings.gatewayUrl = value.replace(/\/+$/, "");
            await this.plugin.saveSettings();
          })
      );

    // Token security status
    const statusInfo = secureTokenStorage.getStatusInfo();
    const tokenSetting = new Setting(containerEl)
      .setName("Gateway Token")
      .setDesc("Authentication token for the OpenClaw gateway");

    // Show current security status
    const statusEl = containerEl.createDiv({ cls: "openclaw-token-status" });
    const statusIcon = statusInfo.secure ? "🔒" : "⚠️";
    statusEl.innerHTML = `<span class="openclaw-status-${statusInfo.secure ? 'secure' : 'insecure'}">${statusIcon} ${statusInfo.description}</span>`;

    // If using env var, just show info (no input needed)
    if (statusInfo.method === "envVar") {
      tokenSetting.addButton((btn) =>
        btn
          .setButtonText("Using Environment Variable")
          .setDisabled(true)
      );
    } else {
      // Get current token for display
      const currentToken = secureTokenStorage.getToken(
        this.plugin.settings.gatewayTokenEncrypted,
        this.plugin.settings.gatewayTokenPlaintext
      );

      tokenSetting.addText((text) => {
        text
          .setPlaceholder("Enter your token")
          .setValue(currentToken)
          .onChange(async (value) => {
            const { encrypted, plaintext } = secureTokenStorage.setToken(value);
            this.plugin.settings.gatewayTokenEncrypted = encrypted;
            this.plugin.settings.gatewayTokenPlaintext = plaintext;
            await this.plugin.saveSettings();
          });
        text.inputEl.type = "password";
      });
    }

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

    containerEl.createEl("h3", { text: "Audit Log" });

    new Setting(containerEl)
      .setName("Enable audit logging")
      .setDesc("Log all file actions to a markdown file for review")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.auditLogEnabled)
          .onChange(async (value) => {
            this.plugin.settings.auditLogEnabled = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Audit log path")
      .setDesc("Path to the audit log file (relative to vault root)")
      .addText((text) =>
        text
          .setPlaceholder("OpenClaw/audit-log.md")
          .setValue(this.plugin.settings.auditLogPath)
          .onChange(async (value) => {
            this.plugin.settings.auditLogPath = value || "OpenClaw/audit-log.md";
            await this.plugin.saveSettings();
          })
      );

    containerEl.createEl("h3", { text: "Connection Test" });

    const testContainer = containerEl.createDiv({ cls: "openclaw-test-container" });
    const testBtn = testContainer.createEl("button", { text: "Test Connection" });
    const testResult = testContainer.createEl("span", { cls: "openclaw-test-result" });

    testBtn.addEventListener("click", async () => {
      testResult.setText("Testing...");
      testResult.removeClass("openclaw-test-success", "openclaw-test-error");
      try {
        const response = await this.plugin.api.chat("Say 'Connection successful!' in 5 words or less", {});
        testResult.setText(`✓ ${response.text}`);
        testResult.addClass("openclaw-test-success");
      } catch (err) {
        testResult.setText(`✗ ${err instanceof Error ? err.message : "Failed"}`);
        testResult.addClass("openclaw-test-error");
      }
    });

    // Security info section
    containerEl.createEl("h3", { text: "Security Info" });
    
    const securityInfo = containerEl.createDiv({ cls: "openclaw-security-info" });
    securityInfo.innerHTML = `
      <p><strong>Token Storage Methods (in priority order):</strong></p>
      <ol>
        <li><strong>Environment Variable</strong> — Set <code>OPENCLAW_TOKEN</code> to keep the token out of Obsidian entirely</li>
        <li><strong>OS Keychain</strong> — Uses Electron safeStorage (Keychain on macOS, DPAPI on Windows, libsecret on Linux)</li>
        <li><strong>Plaintext</strong> — Stored in plugin settings. Avoid syncing <code>.obsidian/plugins/obsidian-openclaw/</code></li>
      </ol>
    `;
  }
}
