import { requestUrl } from "obsidian";
import { OpenClawSettings, ChatResponse, OpenClawAction } from "./types";
import { secureTokenStorage } from "./secureStorage";

export class OpenClawAPI {
  constructor(private settings: OpenClawSettings) {}

  private getToken(): string {
    return secureTokenStorage.getToken(
      this.settings.gatewayTokenEncrypted,
      this.settings.gatewayTokenPlaintext
    );
  }

  async chat(
    message: string,
    context?: { currentFile?: string; currentContent?: string }
  ): Promise<ChatResponse> {
    const systemParts: string[] = [
      "You are OpenClaw, a helpful assistant in Obsidian.",
      "When asked to create or modify files, include a JSON action block.",
      "Format: ```json:openclaw-actions\\n[{\"action\": \"...\", ...}]\\n```",
      "Supported actions: createFile, updateFile, appendToFile, deleteFile, renameFile, openFile",
    ];

    if (context?.currentFile) {
      systemParts.push(`\nUser is viewing: ${context.currentFile}`);
      if (context.currentContent) {
        systemParts.push(`\nFile content:\n${context.currentContent}`);
      }
    }

    // Use Obsidian's requestUrl to bypass CORS restrictions
    const url = `${this.settings.gatewayUrl}/v1/chat/completions`;
    let response;
    try {
      response = await requestUrl({
        url,
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "clawdbot:main",
          messages: [
            { role: "system", content: systemParts.join("\n") },
            { role: "user", content: message },
          ],
        }),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Request to ${url} failed: ${msg}`);
    }

    if (response.status >= 400) {
      const body = typeof response.text === "string" ? response.text : "";
      throw new Error(`HTTP ${response.status} from ${url}\n${body}`.trim());
    }

    const data = response.json;
    const text = data.choices?.[0]?.message?.content ?? "";
    const actions = this.parseActions(text);

    return {
      text: this.stripActionBlocks(text),
      actions,
    };
  }

  private parseActions(text: string): OpenClawAction[] {
    const match = text.match(/```json:openclaw-actions\n([\s\S]*?)```/);
    if (!match) return [];
    try {
      return JSON.parse(match[1]);
    } catch {
      console.error("Failed to parse openclaw-actions:", match[1]);
      return [];
    }
  }

  private stripActionBlocks(text: string): string {
    return text.replace(/```json:openclaw-actions\n[\s\S]*?```\n?/g, "").trim();
  }
}
