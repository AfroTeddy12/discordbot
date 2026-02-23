# Discord Inactive Mover Bot

Moves users to an **Inactive** voice channel when they **say** certain phrases in voice (e.g. "brb", "afk", "inactive"). The bot listens to voice with speech recognition and reacts to what people say, not to text messages.

## Requirements

- Node.js 18+
- A Discord bot token
- A voice channel to use as "Inactive"
- **FFmpeg** installed and on your PATH (required for voice by `discord-speech-recognition`)

## Setup

1. **Create a bot and get the token**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application → Bot.
   - Create a bot, copy the token, and enable **Message Content Intent** under Bot → Privileged Gateway Intents.

2. **Invite the bot**
   - OAuth2 → URL Generator → Scopes: `bot`; Permissions: **Move Members**, **Connect**, **Speak**, **View Channel**, **Send Messages**, **Read Message History**.
   - Open the generated URL and add the bot to your server.

3. **Configure the bot**
   - Copy `.env.example` to `.env` and set `DISCORD_TOKEN=your_bot_token`.
   - In `config.json`:
     - Set `inactiveChannelId` to the **ID** of your Inactive voice channel (right‑click the channel → Copy ID; enable Developer Mode in Discord settings if needed).
     - Optionally edit `joinCommand` (word users type to summon the bot), `phrases` (spoken trigger words), and `replyMessage`.

4. **Install and run**
   ```bash
   npm install
   npm start
   ```

## How it works (voice, not messages)

- Someone in a voice channel types the **join command** in chat (default: `join`). The bot joins that voice channel and starts listening.
- When anyone in that channel **says** one of the trigger phrases (e.g. "brb", "afk", "inactive"), the bot moves that speaker to the Inactive voice channel and can send them a DM.
- Matching is based on **speech recognition** of what people say in voice; it does not react to typed messages.

## Config

| Option              | Description |
|---------------------|-------------|
| `inactiveChannelId` | Voice channel ID to move users to. |
| `joinCommand`       | Chat command to make the bot join your voice channel and start listening (default: `join`). |
| `phrases`           | Spoken phrases that trigger a move (e.g. `["brb", "afk", "inactive"]`). |
| `caseSensitive`     | If `false`, matching is case‑insensitive. |
| `replyMessage`      | Message the bot sends (e.g. by DM) after moving the user. |

## Optional: run with auto-restart

```bash
npm run dev
```

Uses `--watch` to restart the bot when you change code.
