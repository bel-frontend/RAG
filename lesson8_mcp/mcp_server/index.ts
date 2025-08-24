import { createServer } from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

import { requestContext } from './context';
import { registerEchoTools } from './tools/echo';
import { registerProverbTools } from './tools/proverbs';
import { registerWeatherTools } from './tools/weather';

// 1) MCP-сервер
const mcp = new McpServer({ name: 'test-mcp', version: '0.1.0' });

// 2) Рэгістрацыя тулаў (модульна)
registerEchoTools(mcp);
registerProverbTools(mcp);
registerWeatherTools(mcp);

// 3) Транспарт (статлес) - без sessionIdGenerator для цалкам статлес рэжыму
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // Гэта робіць транспарт цалкам статлес
});

// падключаем MCP да транспарту
void mcp.connect(transport);

// 4) HTTP-сервер (Node API; у Bun таксама працуе)
const httpServer = createServer(async (req, res) => {
    try {
        const host = req.headers.host ?? 'localhost';
        const url = new URL(req.url ?? '/', `http://${host}`);
        const apikey = req.headers.apikey;
        const applicationid = req.headers.applicationid;

        // CORS / preflight
        if (req.method === 'OPTIONS') {
            res.writeHead(204, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
                'Access-Control-Allow-Headers':
                    'Content-Type,Authorization,apikey,applicationid,mcp-session-id',
                'Access-Control-Expose-Headers': 'Mcp-Session-Id',
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
            res.setHeader('Access-Control-Expose-Headers', 'Mcp-Session-Id');

            // У статлес рэжыме не патрабуем Mcp-Session-Id header
            // Кожны запыт цалкам незалежны

            // Для POST запытаў з JSON body
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
                    const apiKey = Array.isArray(apikey)
                        ? apikey[0]
                        : (apikey as string | undefined);
                    const appId = Array.isArray(applicationid)
                        ? applicationid[0]
                        : (applicationid as string | undefined);

                    // Run within request context
                    await new Promise<void>((resolve, reject) => {
                        requestContext.run(
                            { apikey: apiKey, applicationid: appId },
                            async () => {
                                try {
                                    await transport.handleRequest(
                                        req as any,
                                        res,
                                        parsed as any,
                                    );
                                    resolve();
                                } catch (e) {
                                    console.error(
                                        'Transport handleRequest error:',
                                        e,
                                    );
                                    reject(e);
                                }
                            },
                        );
                    });
                } catch (e) {
                    console.error('Error parsing JSON body:', e);
                    // Fallback to SDK parsing
                    await new Promise<void>((resolve, reject) => {
                        requestContext.run(
                            {
                                apikey: Array.isArray(apikey)
                                    ? apikey[0]
                                    : (apikey as string | undefined),
                                applicationid: Array.isArray(applicationid)
                                    ? applicationid[0]
                                    : (applicationid as string | undefined),
                            },
                            async () => {
                                try {
                                    await transport.handleRequest(
                                        req as any,
                                        res,
                                    );
                                    resolve();
                                } catch (e) {
                                    console.error(
                                        'Transport handleRequest fallback error:',
                                        e,
                                    );
                                    reject(e);
                                }
                            },
                        );
                    });
                }
                return;
            }

            // Для GET і DELETE запытаў
            await new Promise<void>((resolve, reject) => {
                requestContext.run(
                    {
                        apikey: Array.isArray(apikey)
                            ? apikey[0]
                            : (apikey as string | undefined),
                        applicationid: Array.isArray(applicationid)
                            ? applicationid[0]
                            : (applicationid as string | undefined),
                    },
                    async () => {
                        try {
                            await transport.handleRequest(req as any, res);
                            resolve();
                        } catch (e) {
                            console.error('Transport handleRequest error:', e);
                            reject(e);
                        }
                    },
                );
            });
            return;
        }

        // 404 для невядомых эндпоінтаў
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

// Апрацоўка памылак сервера
httpServer.on('error', (err) => {
    console.error('HTTP server error:', err);
});

// Апрацоўка закрыцця сервера
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

// Апрацоўка неапрацаваных памылак
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
