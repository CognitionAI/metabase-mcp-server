import express from 'express';
import cors from 'cors';
import { spawn } from 'child_process';

const app = express();
const port = 8080;
const host = process.env.BIND_HOST || '127.0.0.1';

// Hostnames allowed in the Host and Origin headers. This bridge drives tools
// that create, query and delete databases, so a web page on another origin
// must not be able to reach it. Requests whose Host is not allowed, or whose
// Origin is present and not allowed, are refused. Set ALLOWED_HOSTS to serve it
// beyond localhost.
const allowedHosts = (process.env.ALLOWED_HOSTS || 'localhost,127.0.0.1,[::1]')
 .split(',').map(h => h.trim()).filter(Boolean);

function hostnameOf(value, withScheme) {
 try {
 return new URL(withScheme ? value : `http://${value}`).hostname;
 } catch {
 return null;
 }
}

function originAllowed(origin) {
 if (!origin) return true;
 const name = hostnameOf(origin, true);
 return name !== null && allowedHosts.includes(name);
}

function hostAllowed(hostHeader) {
 if (!hostHeader) return false;
 const name = hostnameOf(hostHeader, false);
 return name !== null && allowedHosts.includes(name);
}

app.use((req, res, next) => {
 if (!hostAllowed(req.headers.host) || !originAllowed(req.headers.origin)) {
 res.status(403).json({ error: 'Forbidden host or origin' });
 return;
 }
 next();
});

app.use(cors({ origin: (origin, cb) => cb(null, originAllowed(origin)) }));
app.use(express.json());

const connections = new Map();

app.get('/health', (req, res) => {
 res.json({ status: 'ok', service: 'metabase-mcp-server' });
});

app.get('/sse', async (req, res) => {
 console.log("Got new SSE connection");
 
 const connectionId = Date.now() + Math.random();
 
 res.writeHead(200, {
 'Content-Type': 'text/event-stream',
 'Cache-Control': 'no-cache',
 'Connection': 'keep-alive',
 'Access-Control-Allow-Origin': req.headers.origin || 'null',
 'Access-Control-Allow-Headers': 'Cache-Control, Content-Type',
 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
 });

 const sessionId = `session-${connectionId}`;
 res.write(`event: endpoint\ndata: /message?sessionId=${sessionId}\n\n`);

 const mcpProcess = spawn('node', ['build/index.js'], {
 env: {
 ...process.env,
 METABASE_URL: process.env.METABASE_URL || 'http://localhost:3000',
 METABASE_USERNAME: process.env.METABASE_USERNAME,
 METABASE_PASSWORD: process.env.METABASE_PASSWORD
 },
 stdio: ['pipe', 'pipe', 'pipe']
 });

 connections.set(sessionId, { res, mcpProcess, connectionId });

 mcpProcess.stdout.on('data', (data) => {
 const lines = data.toString().split('\n').filter(line => line.trim());
 lines.forEach(line => {
 try {
 const message = JSON.parse(line);
 res.write(`event: message\ndata: ${JSON.stringify(message)}\n\n`);
 } catch (e) {
 res.write(`event: message\ndata: ${JSON.stringify({ type: 'log', message: line })}\n\n`);
 }
 });
 });

 mcpProcess.stderr.on('data', (data) => {
 const errorMsg = data.toString();
 console.error('MCP Error:', errorMsg);
 res.write(`event: message\ndata: ${JSON.stringify({ type: 'error', message: errorMsg })}\n\n`);
 });

 mcpProcess.on('close', (code) => {
 console.log(`MCP process closed with code ${code}`);
 res.write(`event: message\ndata: ${JSON.stringify({ type: 'close', code })}\n\n`);
 connections.delete(sessionId);
 res.end();
 });

 req.on('close', () => {
 console.log("SSE connection closed");
 if (mcpProcess && !mcpProcess.killed) {
 mcpProcess.kill();
 }
 connections.delete(sessionId);
 });

 const keepAlive = setInterval(() => {
 res.write(`event: ping\ndata: {}\n\n`);
 }, 30000);

 req.on('close', () => {
 clearInterval(keepAlive);
 });
});

app.post('/message', async (req, res) => {
 console.log("Received POST message");
 
 const sessionId = req.query.sessionId;
 const connection = connections.get(sessionId);
 
 if (!connection) {
 return res.status(404).json({ error: 'Session not found' });
 }
 
 const { mcpProcess } = connection;
 
 if (mcpProcess && !mcpProcess.killed) {
 try {
 mcpProcess.stdin.write(JSON.stringify(req.body) + '\n');
 res.status(202).json({ status: 'accepted' });
 } catch (error) {
 console.error("Error sending message to MCP process:", error);
 res.status(500).json({ error: 'Failed to send message' });
 }
 } else {
 res.status(400).json({ error: 'MCP process not available' });
 }
});

app.listen(port, host, () => {
 console.log(`Simple SSE bridge running on ${host} port ${port}`);
 console.log(`Health check: http://localhost:${port}/health`);
 console.log(`SSE endpoint: http://localhost:${port}/sse`);
 console.log(`Message endpoint: http://localhost:${port}/message`);
 console.log(`Environment: METABASE_URL=${process.env.METABASE_URL}`);
});

