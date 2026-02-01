# Obsidian OpenClaw

Chat with OpenClaw directly from Obsidian. Create, edit, and manage notes through conversation.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Opening the Chat Sidebar](#opening-the-chat-sidebar)
- [Usage](#usage)
- [File Actions](#file-actions)
- [Security & Privacy](#security--privacy)
  - [Token Storage](#token-storage)
  - [Note Content](#note-content)
  - [Audit Logging](#audit-logging)
- [File Sync](#file-sync)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Sync Paths](#sync-paths)
  - [Conflict Resolution](#conflict-resolution)
  - [Auto-Sync](#auto-sync)
- [Configuration](#configuration)
- [OpenClaw Setup](#openclaw-setup)
- [Development](#development)
- [License](#license)

## Features

- **Chat sidebar** - Talk to OpenClaw from the right sidebar
- **Context-aware** - Optionally include the current note in your conversation
- **File operations** - OpenClaw can create, update, append to, delete, and rename files
- **Markdown rendering** - Responses render as proper markdown
- **Secure token storage** - Uses OS keychain when available
- **Audit logging** - Optional logging of all file actions
- **Two-way sync** - Sync notes between your vault and the OpenClaw gateway

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

**Using an environment variable:**

For most users, the OS Keychain method works automatically. Use the environment variable as a fallback if keychain storage isn't working on your system.

<details>
<summary><strong>Linux / Windows (WSL)</strong></summary>

```bash
# Add to your shell profile (~/.zshrc, ~/.bashrc, etc.)
export OPENCLAW_TOKEN="your-token-here"
```

Then restart Obsidian.

</details>

<details>
<summary><strong>macOS</strong></summary>

macOS GUI apps don't inherit shell environment variables. Use `launchctl` instead:

**Temporary (until reboot):**
```bash
launchctl setenv OPENCLAW_TOKEN "your-token-here"
# Then restart Obsidian
```

**Persistent (survives reboot):**

Create a Launch Agent:

```bash
cat > ~/Library/LaunchAgents/com.openclaw.env.plist << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.openclaw.env</string>
    <key>ProgramArguments</key>
    <array>
        <string>launchctl</string>
        <string>setenv</string>
        <string>OPENCLAW_TOKEN</string>
        <string>YOUR_TOKEN_HERE</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
EOF

# Load it immediately
launchctl load ~/Library/LaunchAgents/com.openclaw.env.plist
```

Then restart Obsidian.

</details>

When configured, the token field will show "Using Environment Variable".

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

## File Sync

Sync notes between your Obsidian vault and the OpenClaw gateway. This enables two-way synchronization so notes created or edited in either location stay in sync.

### Prerequisites

The sync feature requires the [`obsidian-sync`](https://www.clawhub.ai/AndyBold/obsidian-sync) skill running on your gateway.

**Install via ClawdHub:**
```bash
clawdhub install obsidian-sync
```

**Or manually:** Copy the `skill/` folder from this repo to your Clawdbot skills directory.

**Start the sync server:**
```bash
SYNC_TOKEN="your-gateway-token" \
node skills/obsidian-sync/scripts/sync-server.mjs
```

**Expose via Tailscale (for remote access):**
```bash
tailscale serve --bg --https=18790 http://localhost:18790
```

**Run as a service (persist across reboots):**
See `skill/SKILL.md` for systemd setup instructions.

### Setup

1. Open Settings → OpenClaw
2. Enable **Enable sync**
3. Set **Sync server URL** (default: `http://127.0.0.1:18790`)
4. Configure **Sync paths** — map remote folders to local vault folders
5. Click **Test Connection** to verify

### Sync Paths

Configure which folders to sync:

| Remote Path | Local Path | Description |
|-------------|------------|-------------|
| `notes` | `OpenClaw/Notes` | Gateway notes folder |
| `memory` | `OpenClaw/Memory` | Agent memory/logs |

### Conflict Resolution

When a file is modified in both locations:

- **Ask each time** — Shows a modal with both versions, optional side-by-side diff
- **Prefer local** — Obsidian version wins
- **Prefer remote** — Gateway version wins

### Commands

- **Sync Now** (`Cmd/Ctrl+P` → "Sync Now") — Run sync manually

### Auto-Sync

Enable automatic sync every 5/15/30/60 minutes in settings. During auto-sync:
- If conflict behavior is "Ask", conflicts are skipped
- Use manual sync to resolve skipped conflicts

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Gateway URL | Clawdbot gateway address (no trailing slash) | `http://127.0.0.1:18789` |
| Gateway Token | Auth token for the gateway | (empty) |
| Show actions in chat | Display action indicators | `false` |
| Enable audit logging | Log file actions to markdown | `false` |
| Audit log path | Path for the audit log | `OpenClaw/audit-log.md` |
| Enable sync | Enable file synchronization | `false` |
| Sync server URL | Sync server address | `http://127.0.0.1:18790` |
| Sync interval | Auto-sync frequency | Manual only |
| Conflict behavior | How to handle conflicts | Ask each time |

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
