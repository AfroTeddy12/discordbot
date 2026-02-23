require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and add your bot token.');
  process.exit(1);
}

let config;
try {
  config = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8')
  );
} catch (e) {
  console.error('Invalid or missing config.json:', e.message);
  process.exit(1);
}

const { inactiveChannelId, phrases, caseSensitive, replyMessage } = config;
const phraseSet = new Set(
  (phrases || []).map((p) => (caseSensitive ? p : p.toLowerCase()))
);

function messageMatchesPhrases(content) {
  if (!content || typeof content !== 'string') return false;
  const normalized = caseSensitive ? content : content.toLowerCase();
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const trimmed = word.replace(/[^\w\s-]/g, '');
    if (phraseSet.has(trimmed)) return true;
  }
  return phraseSet.has(normalized.trim()) || phraseSet.has(normalized.replace(/[^\w\s-]/g, '').trim());
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  if (!inactiveChannelId || inactiveChannelId === 'YOUR_INACTIVE_VOICE_CHANNEL_ID') {
    console.warn('Set inactiveChannelId in config.json to your Inactive voice channel ID.');
  }
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!messageMatchesPhrases(message.content)) return;

  const member = message.member;
  if (!member?.voice?.channel) {
    await message.reply("You're not in a voice channel. Join one and say a phrase to be moved to Inactive.");
    return;
  }

  const guild = message.guild;
  const targetChannel = guild.channels.cache.get(inactiveChannelId);
  if (!targetChannel) {
    await message.reply("Inactive channel is not configured or doesn't exist. Check config.json.");
    return;
  }
  if (targetChannel.type !== 2 && targetChannel.type !== 13) {
    await message.reply("Configured inactive channel is not a voice channel.");
    return;
  }
  if (member.voice.channelId === inactiveChannelId) {
    await message.reply("You're already in the Inactive channel.");
    return;
  }

  try {
    await member.voice.setChannel(targetChannel);
    await message.reply(replyMessage || "Moved you to Inactive.");
  } catch (err) {
    console.error('Move failed:', err);
    await message.reply("I don't have permission to move you, or the channel is full.");
  }
});

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});
