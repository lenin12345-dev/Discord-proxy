import express from 'express';
import fetch from 'node-fetch';

const app = express();

// /messages endpoint with pagination (before, after, around)
app.get('/api/v10/channels/:channelId/messages', async (req, res) => {
  const channelId = req.params.channelId;
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const before = req.query.before;
  const after = req.query.after;
  const around = req.query.around;

  // ✅ Get Bot Token from request headers
  console.log(req.headers)
  const botToken = req.headers.authorization;

  if (!channelId) {
    return res.status(400).json({ error: 'Missing channel ID' });
  }

  if (!botToken) {
    return res.status(401).json({ error: 'Missing Bot Token in header: x-bot-token' });
  }

  let discordUrl = `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`;
  if (before) discordUrl += `&before=${before}`;
  if (after) discordUrl += `&after=${after}`;
  if (around) discordUrl += `&around=${around}`;

  try {
    const discordResponse = await fetch(discordUrl, {
      headers: {
        'Authorization': `${botToken}`,
      }
    });

    const contentType = discordResponse.headers.get("content-type");

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      return res.status(discordResponse.status).json({ error: errorText });
    }

    if (contentType && contentType.includes("application/json")) {
      const data = await discordResponse.json();
      return res.json(data);
    } else {
      const text = await discordResponse.text();
      return res.status(500).json({
        error: "Discord API did not return JSON",
        details: text
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});


// /reactions endpoint with pagination (after)
app.get('/api/v10/channels/:channelId/messages/:messageId/reactions/:emoji', async (req, res) => {
  const { channelId, messageId, emoji } = req.params;
     const botToken = req.headers.authorization;
  const after = req.query.after;

  if (!channelId || !messageId || !emoji) {
    return res.status(400).json({ error: 'Missing channelId, messageId, or emoji' });
  }

  const encodedEmoji = encodeURIComponent(emoji);
  let discordUrl = `https://discord.com/api/v10/channels/${channelId}/messages/${messageId}/reactions/${encodedEmoji}?limit=50`;
  if (after) discordUrl += `&after=${after}`;

  try {
    const discordResponse = await fetch(discordUrl, {
      headers: {
        'Authorization': `${botToken}`
      }
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      return res.status(discordResponse.status).json({ error: errorText });
    }

    const data = await discordResponse.json();

    // Build next page URL if there are 50 results (meaning more may exist)
    let nextPage = null;
    if (data.length === 50) {
      const lastUserId = data[data.length - 1]?.id;
      if (lastUserId) {
        const baseUrl = `${req.protocol}://${req.get('host')}${req.originalUrl.split('?')[0]}`;
        const params = new URLSearchParams(req.query);
        params.set('after', lastUserId);
        nextPage = `${baseUrl}?${params.toString()}`;
      }
    }

    res.json({ data, next_page: nextPage });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});


app.listen(3000, () => {
  console.log('Proxy server running on port 3000');
});
