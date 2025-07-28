import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const app = express();


const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;


app.get('/messages', async (req, res) => {
  const channelId = req.query.channel;
  const limit = req.query.limit || 10;

  const discordUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;

  try {
    const discordResponse = await fetch(discordUrl, {
      headers: {
        'Authorization': `Bot ${DISCORD_BOT_TOKEN}`
      }
    });
    const data = await discordResponse.json();
    res.json(data);
  } catch (err) {
    res.status(500).send({ error: err.toString() });
  }
});

app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
