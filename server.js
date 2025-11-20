const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

// Lightweight .env loader (avoids external dependencies)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.trim().startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENAI_API_KEY;

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

async function handleSessionRequest(req, res, body) {
  if (!API_KEY) {
    return sendJson(res, 500, { error: 'Missing OPENAI_API_KEY environment variable.' });
  }

  const payload = { user: 'anonymous-web-user' };
  try {
    const parsed = body ? JSON.parse(body) : {};
    const workflow = parsed.workflow || process.env.OPENAI_WORKFLOW_ID;
    if (!workflow) {
      return sendJson(res, 400, { error: 'No workflow ID provided.' });
    }
    payload.workflow = { id: workflow };
    payload.user = parsed.user || 'anonymous-web-user';
    if (parsed.clientSecret) {
      payload.client_secret = parsed.clientSecret;
    }
  } catch (err) {
    return sendJson(res, 400, { error: 'Invalid JSON body.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chatkit/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'chatkit_beta=v1',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return sendJson(res, response.status, { error: errorText || 'Failed to create session.' });
    }

    const json = await response.json();
    return sendJson(res, 200, json);
  } catch (err) {
    return sendJson(res, 500, { error: err.message });
  }
}

function serveStatic(req, res) {
  const requestedUrl = new URL(req.url, `http://${req.headers.host}`);
  let filePath = path.join(__dirname, 'public', requestedUrl.pathname);
  if (requestedUrl.pathname === '/' || requestedUrl.pathname === '') {
    filePath = path.join(__dirname, 'public', 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      return;
    }

    const stream = fs.createReadStream(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mimeMap = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
    };
    res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'text/plain' });
    stream.pipe(res);
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url.startsWith('/api/chatkit/session')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      handleSessionRequest(req, res, body);
    });
    return;
  }

  if (req.method === 'GET') {
    return serveStatic(req, res);
  }

  res.writeHead(405, { 'Content-Type': 'text/plain' });
  res.end('Method not allowed');
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
