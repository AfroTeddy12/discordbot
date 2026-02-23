require('dotenv').config();
const { Client, GatewayIntentBits, Events } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');
const { addSpeechEvent, SpeechEvents } = require('discord-speech-recognition');
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

const { inactiveChannelId, phrases, caseSensitive, replyMessage, joinCommand } = config;
const phraseSet = new Set(
  (phrases || []).map((p) => (caseSensitive ? p : p.toLowerCase()))
);

// When the bot receives speech, we need to know which guild it's from.
// The library emits speech in the context of the bot's current voice connection.
let currentGuildId = null;

function spokenContentMatchesPhrases(content) {
  if (!content || typeof content !== 'string') return false;
  const normalized = caseSensitive ? content : content.toLowerCase();
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const trimmed = word.replace(/[^\w\s-]/g, '');
    if (phraseSet.has(trimmed)) return true;
  }
  const full = normalized.trim();
  const fullNoPunct = full.replace(/[^\w\s-]/g, '').trim();
  return phraseSet.has(full) || phraseSet.has(fullNoPunct);
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

addSpeechEvent(client);

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  if (!inactiveChannelId || inactiveChannelId === 'YOUR_INACTIVE_VOICE_CHANNEL_ID') {
    console.warn('Set inactiveChannelId in config.json to your Inactive voice channel ID.');
  }
  const cmd = joinCommand || 'join';
  console.log(`Say "${cmd}" in chat (while in a voice channel) to make the bot join and start listening.`);
});

// Summon the bot: user types the join command while in a voice channel → bot joins to listen
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  const trigger = (joinCommand || 'join').trim().toLowerCase();
  const content = message.content.trim().toLowerCase();
  if (content !== trigger) return;

  const voiceChannel = message.member?.voice?.channel;
  if (!voiceChannel) {
    await message.reply('Join a voice channel first, then send that command so I can join and listen.');
    return;
  }

  try {
    joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: voiceChannel.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
      selfDeaf: false,
    });
    currentGuildId = voiceChannel.guild.id;
    await message.reply(`Joined **${voiceChannel.name}**. I'll move anyone who says the trigger phrases (e.g. brb, afk) to the Inactive channel.`);
  } catch (err) {
    console.error('Join voice failed:', err);
    await message.reply("I couldn't join the voice channel. Check my permissions (Connect, Speak).");
  }
});

// React to what people *say* in voice (speech → move to inactive)
client.on(SpeechEvents.speech, async (msg) => {
  if (!msg.content) return;
  const guildId = currentGuildId || msg.guild?.id;
  if (!guildId) return;
  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;
  const member = guild.members.cache.get(msg.author.id);
  if (!member?.voice?.channel) return;
  if (!spokenContentMatchesPhrases(msg.content)) return;

  const targetChannel = guild.channels.cache.get(inactiveChannelId);
  if (!targetChannel) return;
  const isVoice = targetChannel.type === 2 || targetChannel.type === 13;
  if (!isVoice) return;
  if (member.voice.channelId === inactiveChannelId) return;

  try {
    await member.voice.setChannel(targetChannel);
    const text = replyMessage || "Moved you to Inactive.";
    await member.send(text).catch(() => {});
  } catch (err) {
    console.error('Move failed:', err);
  }
});

client.login(token).catch((err) => {
  console.error('Login failed:', err);
  process.exit(1);
});
