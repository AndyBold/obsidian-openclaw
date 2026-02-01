# Obsidian OpenClaw

Chat with OpenClaw directly from Obsidian. Create, edit, and manage notes through conversation.

## Features

- **Chat sidebar** - Talk to OpenClaw from the right sidebar
- **Context-aware** - Optionally include the current note in your conversation
- **File operations** - OpenClaw can create, update, append to, delete, and rename files
- **Markdown rendering** - Responses render as proper markdown
- **Secure token storage** - Uses OS keychain when available
- **Audit logging** - Optional logging of all file actions

## Installation

This plugin is installed using [BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool).

### Step 1: Install BRAT

1. Open Obsidian Settings → Community plugins
2. Click "Browse" and search for "BRAT"
3. Install and enable the BRAT plugin

### Step 2: Add OpenClaw via BRAT

1. Open Obsidian Settings → BRAT
2. Click "Add Beta plugin"
3. Enter the repository URL: `AndyBold/obsidian-openclaw`
4. Click "Add Plugin"
5. Enable "OpenClaw" in Settings → Community plugins

### Step 3: Configure

1. Open Obsidian Settings → OpenClaw
2. Set your **Gateway URL** (e.g., `https://your-machine.tailnet.ts.net` or `http://127.0.0.1:18789`)
   - Do not include a trailing slash
3. Set your **Gateway Token** (from your Clawdbot config)
4. Click "Test Connection" to verify

## Opening the Chat Sidebar

There are several ways to open the OpenClaw chat panel:

1. **Ribbon icon** - Click the chat bubble icon (💬) in the left ribbon
2. **Command palette** - Press `Cmd/Ctrl+P` and search for "Open OpenClaw Chat"
3. **Hotkey** - Assign a custom hotkey in Settings → Hotkeys, search for "OpenClaw"

The chat panel opens in the right sidebar. You can drag it to a different position if preferred.

## Usage

1. Open the OpenClaw chat sidebar (see above)
2. Type your message and press `Cmd/Ctrl+Enter` or click **Send**
3. Toggle "Include current note" to give OpenClaw context about what you're working on

### Example prompts

- "Summarize this note"
- "Create a new note called 'Meeting Notes' with today's date"
- "Add a TODO section to the end of this file"
- "Rename this file to include today's date"

## File Actions

When you ask OpenClaw to work with files, it returns structured actions that the plugin executes:

| Action | Description | Requires Confirmation |
|--------|-------------|----------------------|
| `createFile` | Create a new file with content | No |
| `updateFile` | Replace file contents | **Yes** |
| `appendToFile` | Add content to end of file | No |
| `deleteFile` | Delete a file | **Yes** |
| `renameFile` | Rename/move a file | **Yes** |
| `openFile` | Open a file in the editor | No |

Destructive actions (update, delete, rename) show a confirmation dialog before executing.

## Security & Privacy

### Token Storage

Your gateway token is stored securely using a priority-based system:

| Priority | Method | Description |
|----------|--------|-------------|
| 1 | **Environment Variable** | Set `OPENCLAW_TOKEN` — token never touches Obsidian |
| 2 | **OS Keychain** | Encrypted via Electron safeStorage |
| 3 | **Plaintext** | Fallback — avoid syncing plugin folder |

**OS Keychain support:**
- **macOS**: Keychain
- **Windows**: DPAPI (Data Protection API)
- **Linux**: libsecret (GNOME Keyring) or kwallet

The settings page shows your current storage method with a security indicator (🔒 or ⚠️).

**Using an environment variable (recommended for maximum security):**

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export OPENCLAW_TOKEN="your-token-here"
```

Then restart Obsidian. The token field will show "Using Environment Variable".

### Note Content

When "Include current note" is checked, the full content of your current note is sent to:
1. Your Clawdbot gateway
2. The configured LLM provider (Anthropic, OpenAI, etc.)

**Be mindful of sensitive content** — uncheck "Include current note" when working with private information.

### Audit Logging

Enable audit logging to track all file operations:

1. Open Settings → OpenClaw
2. Enable "Enable audit logging"
3. Optionally change the log path (default: `OpenClaw/audit-log.md`)

The audit log records:
- Timestamp
- Action status (✅ success, ❌ failed, ⏭️ skipped)
- Action type
- File paths affected

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Gateway URL | Clawdbot gateway address (no trailing slash) | `http://127.0.0.1:18789` |
| Gateway Token | Auth token for the gateway | (empty) |
| Show actions in chat | Display action indicators | `false` |
| Enable audit logging | Log file actions to markdown | `false` |
| Audit log path | Path for the audit log | `OpenClaw/audit-log.md` |

## OpenClaw Setup

Make sure your OpenClaw config has the HTTP endpoint enabled:

```json
{
  "gateway": {
    "http": {
      "endpoints": {
        "chatCompletions": { "enabled": true }
      }
    }
  }
}
```

## Development

```bash
git clone https://github.com/AndyBold/obsidian-openclaw.git
cd obsidian-openclaw
npm install
npm run dev   # Watch mode
npm run build # Production build
```

## License

MIT
