
# How to Create a Simple MCP Server: Step-by-Step Example with This Project


This article shows how to launch an MCP server (Model Context Protocol) from scratch with HTTP transport, register your own tools, and connect it to a client via `mcp.json`.


— We will use Bun (but the code is compatible with Node.js), the `@modelcontextprotocol/sdk` SDK, parameter validation via `zod`, and several demo tools: `echo`, proverbs, and weather.

## What We Are Building


- HTTP server with two routes:
  - `GET /healthz` — server health check.
  - `/mcp` — MCP endpoint (supports `GET`, `POST`, `DELETE`).
- MCP server in stateless mode (no session storage on the server side).
- A set of tools available via the MCP client:
  - `echo` — returns the text passed in the input.
  - `get_proverb_by_topic` — proverbs by topic from a public list (with options `topic`, `random`, `limit`).
  - `get_weather` — short weather string from the wttr.in service.

## Project Structure


- `index.ts` — launches the HTTP server and MCP transport, routes, CORS, error handling.
- `tools/echo.ts` — registration of the `echo` tool.
- `tools/proverbs.ts` — the `get_proverb_by_topic` tool (fetches JSON with proverbs).
- `tools/weather.ts` — the `get_weather` tool (fetches a string from wttr.in).
- `package.json` — dependencies and Bun launch scripts.
- `Dockerfile`, `docker-compose.yml`, `deploy.sh` — containerization and local Docker launch.
- `.vscode/mcp.json` — example MCP client configuration for connecting to the server.

## Main Dependencies


- `@modelcontextprotocol/sdk` — MCP SDK (server + HTTP/stream transport).
- `zod` — description and validation of tool input parameter schemas.
- `undici` — modern fetch for Node/Bun (Bun already has fetch, but the dependency is present in the project).

## Architecture and Request Flow


1) Initialize the MCP server

- In `index.ts`, create `new McpServer({ name: 'goman-mcp', version: '0.1.0' })`.


2) Register tools modularly

- `registerEchoTools(mcp)` from `tools/echo.ts`
- `registerProverbTools(mcp)` from `tools/proverbs.ts`
- `registerWeatherTools(mcp)` from `tools/weather.ts`

Each tool:
- provides `title`, `description`, `inputSchema` (using `zod`),
- and an implementation-responder: receives parameters and returns `content` with text.


3) Configure HTTP transport in stateless mode

- `new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })` — disables session generation, each request is independent.
- `mcp.connect(transport)` — connect MCP to the transport.

4) HTTP server and routes

- CORS and preflight (`OPTIONS`) with `Access-Control-*` headers.
- `GET /healthz` — returns `{ ok: true, timestamp: ... }`.
- `/mcp` — MCP endpoint:
  - For `POST`, read `JSON` from the body and pass to `transport.handleRequest(req, res, parsed)`. If parsing fails, pass control to the SDK (`handleRequest(req, res)`) without `parsed`.

  - For `GET` and `DELETE` — also via `transport.handleRequest(req, res)`.
  (Authentication is not required in the demo; headers are not used.)


5) Error handling and graceful shutdown

- Signals `SIGINT`, `SIGTERM`, as well as `uncaughtException` and `unhandledRejection` gracefully close the server.

## Tools in Detail


- `echo` (`tools/echo.ts`)
  - Schema: `{ text: string }`
  - Returns the same text.

- `get_proverb_by_topic` (`tools/proverbs.ts`)
  - Schema: `{ topic?: string; random?: boolean; limit?: number <= 200 }`
  - Fetches JSON with a list of proverbs, filters by topic, returns random or first `limit` lines.
  - Errors are neatly caught and returned as text.

- `get_weather` (`tools/weather.ts`)
  - Schema: `{ city: string }`
  - Fetches a short string from wttr.in: `"Minsk: +22°C ..."`.

## Local Launch (Bun)


Make sure Bun is installed.

```sh
bun install
bun index.ts
```


After launch, in the logs:
- MCP Streamable HTTP Server on http://localhost:3002/mcp
- Available endpoints: /healthz, /mcp


Health check:

```sh
curl -s http://localhost:3002/healthz | jq .
```

## Connecting an MCP Client (mcp.json)


There is an example configuration in the project: `.vscode/mcp.json`.

```jsonc
{
  "servers": {
    "goman-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    }
  }
}
```


— In this demo, headers are not required.
- In stateless mode, the additional `Mcp-Session-Id` header is not required — each request is isolated.

## Running in Docker


To build and run:

```sh
docker compose build --no-cache
docker compose up -d
```


After this, the server will be available at `http://localhost:3002/mcp`.


Files for containerization:
- `Dockerfile` — based on `oven/bun`, installs dependencies and runs `bun index.ts`.
- `docker-compose.yml` — maps port `3002:3002`, sets `NODE_ENV` and other environment variables.
- `deploy.sh` — quick build and launch with a two-line command.

## Common Issues and How to Avoid Them


- CORS: if the client is in a browser — check allowed headers and methods. In this example, CORS is enabled for `*`.
- Sessions: if state (sessions) is required, you will need to enable `sessionIdGenerator` and store state somewhere (memory/cache/DB). Here — stateless by default.
- External APIs: the proverbs and weather tools depend on public services. Add timeouts/cache if you plan for production.

## How to Add Your Own Tool


1) Create a file in `tools/` (e.g., `tools/mytool.ts`).
2) Describe the input schema using `zod` and register the tool via `mcp.registerTool(...)`.
3) Import and call the registration in `index.ts` alongside other `register*Tools(...)`.

Minimal template:

```ts
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerMyTools(mcp: McpServer) {
  mcp.registerTool(
    'my_tool',
    {
      title: 'my_tool',
  description: 'What the tool does',
      inputSchema: { name: z.string() },
    },
    async ({ name }: { name: string }) => {
  return { content: [{ type: 'text', text: `Hello, ${name}!` }] };
    },
  );
}
```

## Conclusion


We have assembled a working example of an MCP server with HTTP transport, robust CORS support, stateless ideology, and three demo tools. Next, you can:
- connect a client with your `mcp.json`,
- expand the set of tools,
- add authentication and logging as needed,
- wrap in Docker for convenient delivery.

Key files to start: `index.ts`, `tools/*`, `.vscode/mcp.json`.

## MCP Settings for Cursor and VS Code, and How to Launch


Below are ready-made configuration examples and launch steps for two popular environments.


### Cursor (.cursor/mcp.json)


1) Create a `.cursor/mcp.json` file in the root directory of your project (or in your $HOME if you want it system-wide).

Прыклад:

```jsonc
{
  "mcpServers": {
    "goman-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    }
  }
}
```


2) Start the server:

```sh
bun install
bun index.ts
```


3) Open Cursor → Settings → MCP Servers and make sure `goman-mcp` is loaded from the configuration and marked as "connected". If you don't see it — do Reload Window in Cursor.


4) Test in the Cursor chat window: ask the model to use a tool, for example: "Call the get_weather tool for the city Minsk" or "Use get_proverb_by_topic with the topic 'about work'". Cursor will build the MCP tool call according to the schema.


Tip: headers in the configuration keys (`apiKey`, `applicationid`) are case-insensitive under the hood (Node lowers names to lowercase), so you can leave them as in the example.


### VS Code (.vscode/mcp.json)


VS Code does not include a built-in MCP client, so use one of the lightweight client extensions. Install one of the following (any will do):

```vscode-extensions
jasonkneen.mcpsx-run,nickeolofsson.remember-mcp-vscode
```


1) Place the config in `.vscode/mcp.json` (there is already an example in this repo):

```jsonc
{
  "servers": {
    "goman-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp"
    }
  }
}
```


2) Start the MCP server:

```sh
bun install
bun index.ts
```


3) In VS Code: Command Palette → go to the extension section (depending on the extension, this may be "MCP Servers" or "MCP"), check that `goman-mcp` is connected.


4) If you use GitHub Copilot Chat, the MCP client extension will add your tools to the available list. In the chat window, ask: "Use the get_weather tool with city=Minsk" or "get_proverb_by_topic with random=true, limit=3" — Copilot will make the MCP call.


5) For a quick server check outside the client:

```sh
curl -s http://localhost:3002/healthz | jq .
```


### Notes


- Stateless: the server works without sessions, so there is no need for `Mcp-Session-Id` — each request is independent.
- Headers: not needed in the demo. If you need authentication — add it later.
- CORS: enabled for `*`, so a browser client can also connect.
