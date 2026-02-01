import { PipbotSettings, ChatResponse, PipAction } from "./types";

export class PipbotAPI {
  constructor(private settings: PipbotSettings) {}

  async chat(
    message: string,
    context?: { currentFile?: string; currentContent?: string }
  ): Promise<ChatResponse> {
    const systemParts: string[] = [
      "You are Pip, a helpful assistant in Obsidian.",
      "When asked to create or modify files, include a JSON action block.",
      "Format: ```json:pip-actions\\n[{\"action\": \"...\", ...}]\\n```",
      "Supported actions: createFile, updateFile, appendToFile, deleteFile, renameFile, openFile",
    ];

    if (context?.currentFile) {
      systemParts.push(`\nUser is viewing: ${context.currentFile}`);
      if (context.currentContent) {
        systemParts.push(`\nFile content:\n${context.currentContent}`);
      }
    }

    const response = await fetch(
      `${this.settings.gatewayUrl}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.settings.gatewayToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "clawdbot:main",
          messages: [
            { role: "system", content: systemParts.join("\n") },
            { role: "user", content: message },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const actions = this.parseActions(text);

    return {
      text: this.stripActionBlocks(text),
      actions,
    };
  }

  private parseActions(text: string): PipAction[] {
    const match = text.match(/```json:pip-actions\n([\s\S]*?)```/);
    if (!match) return [];
    try {
      return JSON.parse(match[1]);
    } catch {
      console.error("Failed to parse pip-actions:", match[1]);
      return [];
    }
  }

  private stripActionBlocks(text: string): string {
    return text.replace(/```json:pip-actions\n[\s\S]*?```\n?/g, "").trim();
  }
}
