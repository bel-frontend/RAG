// Core Node.js HTTP server module - creates basic HTTP server, handles requests/responses
import { createServer } from 'node:http';

// Declare Node's process in a way that doesn't require @types/node
// (works in both Node and Bun runtimes)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const process: any = (globalThis as any).process;

// Main MCP Server class - manages tool registration and MCP protocol communication
// Provides interface for AI models to call registered tools
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

// HTTP Transport Layer - bridges HTTP requests to MCP protocol
// Converts HTTP ↔ MCP protocol messages, handles stateless communication
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Echo tool registration - simple tool that returns input text (for testing MCP connectivity)
import { registerEchoTools } from './tools/echo';

// Proverbs tool registration - fetches Belarusian proverbs from external API
// Supports filtering by topic, random selection, and limiting results
import { registerProverbTools } from './tools/proverbs';

// Weather tool registration - fetches current weather data from wttr.in service
// Takes city name as input and returns weather information
import { registerWeatherTools } from './tools/weather';

// 1) MCP server
const mcp = new McpServer({ name: 'test-mcp', version: '0.1.0' });

// 2) Tool registration (modular)
registerEchoTools(mcp);
registerProverbTools(mcp);
registerWeatherTools(mcp);

// 3) Transport (stateless) - without sessionIdGenerator for fully stateless mode
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // This makes the transport fully stateless
});

// Connect MCP to the transport
void mcp.connect(transport);

// 4) HTTP server (Node API; also works in Bun)
const httpServer = createServer(async (req, res) => {
    try {
        const host = req.headers.host ?? 'localhost';
        const url = new URL(req.url ?? '/', `http://${host}`);

        // CORS / preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            });
            res.end();
            return;
        }

        // Health check endpoint
        if (url.pathname === '/healthz') {
            res.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            });
            res.end(
                JSON.stringify({
                    ok: true,
                    timestamp: new Date().toISOString(),
                }),
            );
            return;
        }

        // MCP endpoint
        if (url.pathname === '/mcp') {
            // Ensure CORS for MCP route responses
            res.setHeader('Access-Control-Allow-Origin', '*');

        // In stateless mode, Mcp-Session-Id header is not required
        // Each request is completely independent

        // For POST requests with JSON body
            if (req.method === 'POST') {
                let raw = '';
                await new Promise<void>((resolve, reject) => {
                    req.setEncoding('utf8');
                    req.on('data', (chunk) => (raw += chunk));
                    req.on('end', () => resolve());
                    req.on('error', reject);
                });

                try {
                    const parsed = JSON.parse(raw);
            await transport.handleRequest(req as any, res, parsed as any);
                } catch (e) {
                    console.error('Error parsing JSON body:', e);
            // Fallback to SDK parsing
            await transport.handleRequest(req as any, res);
                }
                return;
            }

            // For GET and DELETE requests
        await transport.handleRequest(req as any, res);
            return;
        }

    // 404 for unknown endpoints
        res.writeHead(404, {
            'Content-Type': 'text/plain',
            'Access-Control-Allow-Origin': '*',
        });
        res.end('Not found');
    } catch (err) {
        console.error('Server error:', err);
        if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(
                JSON.stringify({
                    error: err instanceof Error ? err.message : String(err),
                }),
            );
        }
    }
});

// Server error handling
httpServer.on('error', (err) => {
    console.error('HTTP server error:', err);
});

// Server shutdown handling
process.on('SIGINT', () => {
    console.log('Shutting down MCP server...');
    httpServer.close(() => {
        console.log('MCP server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Shutting down MCP server...');
    httpServer.close(() => {
        console.log('MCP server closed');
        process.exit(0);
    });
});

// Handling uncaught errors
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    httpServer.close(() => {
        console.log('MCP server closed due to uncaught exception');
        process.exit(1);
    });
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    httpServer.close(() => {
        console.log('MCP server closed due to unhandled rejection');
        process.exit(1);
    });
});

httpServer.listen(3002, () => {
    console.log('MCP Streamable HTTP Server on http://localhost:3002/mcp');
    console.log('Available endpoints:');
    console.log('  - GET  /healthz  - Health check');
    console.log('  - POST /mcp      - MCP endpoint');
    console.log('  - GET  /mcp      - MCP session management');
    console.log('  - DELETE /mcp    - Session cleanup');
});
