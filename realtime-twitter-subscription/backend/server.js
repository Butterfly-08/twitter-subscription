const http = require('http');
const WebSocket = require('ws');
const app = require('./app');
const connectDB = require('./config/db');
const env = require('./config/env');

const startServer = async () => {
  // Connect to Database
  await connectDB();

  // Create HTTP Server
  const server = http.createServer(app);

  // Initialize WebSocket Server
  const wss = new WebSocket.Server({ server });

  // Broadcast Tweet helper
  const broadcastTweet = (tweet) => {
    const payload = JSON.stringify({
      type: 'new_tweet',
      data: {
        id: tweet._id,
        userId: tweet.userId,
        authorName: tweet.authorName,
        authorUsername: tweet.authorUsername,
        content: tweet.content,
        type: tweet.type,
        audioUrl: tweet.audioUrl,
        durationSeconds: tweet.durationSeconds,
        sizeBytes: tweet.sizeBytes,
        createdAt: tweet.createdAt
      }
    });

    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  };

  // Bind broadcast function to app locals so controllers can use it
  app.locals.broadcastTweet = broadcastTweet;

  // WebSocket connection listener
  wss.on('connection', (ws, req) => {
    console.log(`[WebSocket] New client connection established. Current clients count: ${wss.clients.size}`);
    
    ws.on('message', (message) => {
      try {
        const parsed = JSON.parse(message);
        // We can handle ping/pong or client registration if needed
        if (parsed.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (err) {
        console.error('[WebSocket] Message parsing error:', err.message);
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected. Remaining clients count: ${wss.clients.size}`);
    });

    ws.on('error', (err) => {
      console.error('[WebSocket] Client error:', err.message);
    });
  });

  // Start HTTP Server
  server.listen(env.PORT, () => {
    console.log(`===========================================================`);
    console.log(` Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    console.log(` WebSockets enabled and listening for client nodes`);
    console.log(`===========================================================`);
  });
};

startServer();
