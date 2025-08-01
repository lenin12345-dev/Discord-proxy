import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// /messages endpoint with pagination (before, after, around)
app.get('/messages', async (req, res) => {
  const channelId = req.query.channel;
  const limit = Math.min(Number(req.query.limit) || 50, 100); // Discord max limit = 100
  const before = req.query.before;
  const after = req.query.after;
  const around = req.query.around;

  if (!channelId) {
    return res.status(400).json({ error: 'Missing channel ID' });
  }

  let discordUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;
  if (before) discordUrl += `&before=${before}`;
  if (after) discordUrl += `&after=${after}`;
  if (around) discordUrl += `&around=${around}`;

  try {
    const discordResponse = await fetch(discordUrl, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });
    const data = await discordResponse.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

// /reactions endpoint with pagination (after)
app.get('/reactions', async (req, res) => {
  const channelId = req.query.channel;
  const messageId = req.query.messageId;
  const emoji = req.query.emoji;
  const after = req.query.after;

  if (!channelId || !messageId || !emoji) {
    return res.status(400).json({ error: 'Missing channelId, messageId, or emoji' });
  }

  const encodedEmoji = encodeURIComponent(emoji);
  let url = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}?limit=100`;
  if (after) url += `&after=${after}`;

  try {
    const discordResponse = await fetch(url, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      return res.status(discordResponse.status).json({ error: errorText });
    }

    const data = await discordResponse.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
