# Discord Inactive Mover Bot

Moves users to an **Inactive** voice channel when they send certain phrases in any text channel (e.g. "brb", "afk", "inactive").

## Requirements

- Node.js 18+
- A Discord bot token
- A voice channel to use as "Inactive"

## Setup

1. **Create a bot and get the token**
   - Go to [Discord Developer Portal](https://discord.com/developers/applications) → New Application → Bot.
   - Create a bot, copy the token, and enable **Message Content Intent** under Bot → Privileged Gateway Intents.

2. **Invite the bot**
   - OAuth2 → URL Generator → Scopes: `bot`; Permissions: **Move Members**, **Connect**, **View Channel**, **Send Messages**, **Read Message History**.
   - Open the generated URL and add the bot to your server.

3. **Configure the bot**
   - Copy `.env.example` to `.env` and set `DISCORD_TOKEN=your_bot_token`.
   - In `config.json`:
     - Set `inactiveChannelId` to the **ID** of your Inactive voice channel (right‑click the channel → Copy ID; enable Developer Mode in Discord settings if needed).
     - Optionally edit `phrases` (trigger words) and `replyMessage`.

4. **Install and run**
   ```bash
   npm install
   npm start
   ```

## Config

| Option              | Description |
|---------------------|-------------|
| `inactiveChannelId` | Voice channel ID to move users to. |
| `phrases`           | Array of phrases that trigger a move (e.g. `["brb", "afk", "inactive"]`). |
| `caseSensitive`    | If `false`, matching is case‑insensitive. |
| `replyMessage`     | Message the bot sends after moving the user. |

## Behavior

- User must be in a **voice channel** when they send a phrase; otherwise the bot replies that they need to be in voice.
- The bot checks if the message contains any of the configured phrases (as whole words).
- If the user is in voice and the phrase matches, the bot moves them to the Inactive channel and sends the reply message.

## Optional: run with auto-restart

```bash
npm run dev
```

Uses `--watch` to restart the bot when you change code.
