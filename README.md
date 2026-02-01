# Obsidian OpenClaw

Chat with Pip (OpenClaw) directly from Obsidian. Create, edit, and manage notes through conversation.

## Features

- **Chat sidebar** - Talk to Pip from the right sidebar
- **Context-aware** - Optionally include the current note in your conversation
- **File operations** - Pip can create, update, append to, delete, and rename files
- **Markdown rendering** - Pip's responses render as proper markdown

## Installation

### Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) running with HTTP endpoint enabled
- Node.js 18+

### Build

```bash
cd obsidian-pipbot
npm install
npm run build
```

### Install in Obsidian

1. Copy these files to your vault's `.obsidian/plugins/obsidian-openclaw/`:
   - `main.js`
   - `manifest.json`
   - `styles.css`

2. Enable the plugin in Obsidian settings → Community plugins

3. Configure settings:
   - **Gateway URL**: `http://127.0.0.1:18789` (default)
   - **Gateway Token**: Your Clawdbot gateway token

### Development

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

## Usage

1. Click the chat bubble icon in the ribbon (left sidebar) or use the command palette: "Open Pip Chat"
2. Type your message and press Cmd/Ctrl+Enter or click Send
3. Toggle "Include current note" to give Pip context about what you're working on

### Example prompts

- "Summarize this note"
- "Create a new note called 'Meeting Notes' with today's date"
- "Add a TODO section to the end of this file"
- "Rename this file to include today's date"

## File Actions

When you ask Pip to work with files, it returns structured actions that the plugin executes:

- `createFile` - Create a new file with content
- `updateFile` - Replace file contents
- `appendToFile` - Add content to end of file
- `deleteFile` - Delete a file
- `renameFile` - Rename/move a file
- `openFile` - Open a file in the editor

## Configuration

| Setting | Description | Default |
|---------|-------------|---------|
| Gateway URL | Clawdbot gateway address | `http://127.0.0.1:18789` |
| Gateway Token | Auth token for the gateway | (empty) |
| Show actions in chat | Display action indicators | false |

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

## License

MIT
