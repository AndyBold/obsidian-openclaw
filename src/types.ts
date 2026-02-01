export interface PipbotSettings {
  gatewayUrl: string;
  gatewayToken: string;
  showActionsInChat: boolean;
}

export const DEFAULT_SETTINGS: PipbotSettings = {
  gatewayUrl: "http://127.0.0.1:18789",
  gatewayToken: "",
  showActionsInChat: false,
};

export type PipAction =
  | { action: "createFile"; path: string; content: string }
  | { action: "updateFile"; path: string; content: string }
  | { action: "appendToFile"; path: string; content: string }
  | { action: "deleteFile"; path: string }
  | { action: "renameFile"; path: string; newPath: string }
  | { action: "openFile"; path: string };

export interface ChatMessage {
  role: "user" | "assistant" | "error";
  content: string;
  timestamp: number;
  actions?: PipAction[];
}

export interface ChatResponse {
  text: string;
  actions: PipAction[];
}
