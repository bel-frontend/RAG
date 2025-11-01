![header](https://firebasestorage.googleapis.com/v0/b/bel-frontend.appspot.com/o/L2hAtNuuC5aCjCiEgT0m0aY4x712%2F1a21d0cpunk2.webp?alt=media&token=e6414466-8845-4698-93d4-64ef644f4382)

## Hi there!

I've been meaning to write this article for more than a month now, but there hasn't been time or the right mood. Still, I gathered my thoughts and finally cobbled together something. I hope you find it useful. Take a look at GitHub — there are ready-to-run working examples that you can launch. For a better understanding of what's happening, get acquainted with the structure and code of the  [MCP server](https://github.com/bel-frontend/RAG/tree/main/lesson8_mcp/mcp_server).

#### Today we connect Cursor and VS Code to your APIs via MCP.

Sometimes you look at your own useful scripts and think: 'How can you neatly connect them to AI without unnecessary hassle? What do you need for this? From which side should you approach?' Today, in this article, we will try to solve this problem and learn how to create your own MCPs. And you can also check my previous AI articles.

---

### MCP in a nutshell

MCP (Model Context Protocol) is a unified 'translator' between your tools and intelligent clients (chat assistants; for example, agents in Cursor). Instead of another fragmented API, you precisely describe what your tool can do and what its inputs/outputs are — then everything works according to the standard. 

#### Why is MCP convenient?

The main idea of MCP is that your API can be connected to the model as a separate agent with transparent rules:

- Standardization. A single language for tools and clients instead of a set of different protocols.
- Governance. Tools connected to the model have explicit schemas, predictable behavior, clear rights.
- Fast integration. Connect API/FS/DB/DevOps processes — and use them from the IDE or the chat.

 #### Where MCP is particularly relevant

MCP is suitable for a range of tasks, most of which relate to development (now primarily editors adapted to work with external tools via MCP). For example:

- DevTools and ChatOps: CI/CD commands, diagnostics, and access to logs.
- Data/BI: aggregated queries, insightful summaries.
- Internal APIs: a single control point for the team.
- RAG/automation: data collection and pre- and post-processing.
- Working with documentation (for example, Confluence) and others. List of proposed MCPs for VS Code: [GitHub](https://github.com/mcp?utm_source=vscode-website&utm_campaign=mcp-registry-server-launch-2025)

---

### How to build a simple MCP server with HTTP transport (Bun/Node)

Back to building our server. I have already prepared several examples of tools in the training repository; you can explore them at the link [lesson8_mcp/mcp_server](https://github.com/bel-frontend/RAG/tree/main/lesson8_mcp/mcp_server) in the **bel_geek** repository. Code compatible with Bun and Node.js.

#### What we'll build

We'll create a simple server without unnecessary bells and whistles.
This will be a local HTTP server with `/healthz` and `/mcp`, stateless, with three demo tools (the same set as in the repository) to immediately test MCP:

- Routes:
  - `GET /healthz` - health check.
  - `/mcp` - MCP endpoint (`GET`, `POST`, `DELETE`).
- Stateless mode (no sessions).
- Three tools:
  - `echo` - returns the transmitted text. - `get_proverb_by_topic` — proverbs by topic (`topic`, `random`, `limit`)
  - `get_weather` — local weather from wttr.in.

---

---

### 🚀 Setting up the server and connecting it to Cursor/VS Code

The theory is done; time to act: clone, install, run — and MCP is up and running.

#### 🔑 Prerequisites (what you need before starting)

No surprises here:

- Node.js ≥ 18 or Bun ≥ 1.x (Bun starts faster — fewer unnecessary moves). - Two packages: @modelcontextprotocol/sdk (the MCP foundation) and zod (to describe input parameters precisely and reliably).
- Docker — only if you want to package everything into a container right away. For local testing, it's not required. 

#### ⚡️ Running an example

No unnecessary philosophy—simply clone the repository and run:

```
git clone https://github.com/bel-frontend/RAG
cd RAG/lesson8_mcp/mcp_server
```

```
bun install
bun index.ts
```

If everything goes well, the console will display the message:

```
MCP Streamable HTTP Server on http://localhost:3002/mcp
Available endpoints: /healthz, /mcp
```

#### 🎉 Server! It's alive! Let's check its heartbeat:

```
curl -s http://localhost:3002/healthz
```

The response should be in the format `{ ok: true, timestamp: ... }`.

### 🧩 Architecture in simple terms

How the server works:

1. An MCP server is created — it registers tools (`echo`, `get_proverb_by_topic`, `get_weather`).
2. An HTTP transport is added — MCP can receive and send requests via `/mcp`.
3. Routes:
- `/healthz` — returns a simple JSON object to verify that the server is alive. We translate MD format. Please preserve the structure and the ideas.

- `/mcp` - the main endpoint through which Cursor or VS Code connects to the tools.
4. Context — the headers (`apikey`, `applicationid`) are stored in storage so that the tools can use them.
5. Termination — on shutdown (SIGINT/SIGTERM) the server closes properly.

### 🛠 Tools — the main magic here

Three simple tools added for quick experimentation:

- `echo` — returns the text you pass to it (useful for checks). - `get_proverb_by_topic` returns proverbs by topic; it supports `random` and `limit`.
- `get_weather` shows the weather via the wttr.in service.

Each tool is described by a `zod` schema. This guarantees accuracy: if the user passes parameters in the wrong format, MCP will report the incorrect format.

### 🖇 Connecting to Cursor and VS Code

And now the most interesting part — integration.
When MCP is running, we can use it through Cursor or GitHub Copilot in VS Code.

Cursor:

1. Start the server (`bun index.ts`).
2. Create the file in the project at `./.cursor/mcp.json` with the following configuration:

```json
{
  "mcpServers": {
    "test-mcp": {
      "type": "http",
      "url": "http://localhost:3002/mcp",
      "headers": {
        "apiKey": "API_KEY_1234567890",
        "applicationId": "APPLICATION_ID"
      }
    }
  }
}
```

Open Settings → Model Context Protocol and make sure that `test-mcp` is in the list. In the Cursor chat, type (make sure that the agent is enabled): "Invoke the get_weather tool for Minsk" - and see the response.

#### VS Code (Copilot Chat)

Here it's almost the same, only the file needs to be placed into `.vscode/mcp.json`.
After that, in the Copilot Chat toolbar your tool should appear. 

```json
{
    "servers": {
        "test-mcp": {
            "type": "http",
            "url": "http://localhost:3002/mcp",
            "headers": {
                "apiKey": "API_KEY_1234567890",
                "applicationId": "APPLICATION_ID"
            }
        }
    }
}
```


#### 🐳 Docker mode

Would you like to package it right away?
We will build and run it in Docker:

```
docker compose build --no-cache
docker compose up -d
```

MCP will be available at `http://localhost:3002/mcp`.
 Team-friendly collaboration: everyone uses the same mental model and doesn’t waste time on “what works for me—doesn’t work for you.”

#### 🤔 Typical pitfalls and how to bypass them

- `CORS`—when connecting from a browser, you must allow headers. We added a basic variant in the code.
- `Stateless/Stateful` — in the example the server is stateless. If you need sessions, enable `sessionIdGenerator`.
- API headers—in Node.js they arrive in lowercase (`apikey`), not `apiKey`. It’s easy to get confused. External services (proverbs and weather) can slow things down. Add timeouts and caching. 

#### ✍️ How to build your own tool

Here is a simple example:

```js
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerMyTools(mcp: McpServer) {
  mcp.registerTool(
    'my_tool',
    {
      title: 'my_tool',
      description: 'A simple tool that adds 2+2',
      inputSchema: { name: z.string() },
    },
    async ({ name }) => ({
      content: [{ type: 'text', text: `Hello, ${name}!` }],
    })
  );
}
```
 Ready—now you can add your own 'tricks' to MCP and use them from the IDE.

### 🎯 Results

We built an MCP server on Bun/Node, added three demo tools, connected it to Cursor and VS Code, ran it in Docker and discussed typical issues.
The main thing is that MCP makes connecting your own tools to smart IDEs simple and standardized.

The future lies only in your imagination: you can integrate DevOps processes, databases, BI queries, and internal APIs. MCP makes it possible for other team members to simply pick it up and use it.

### What's next

We built a simple MCP server with HTTP transport, added three practical tools, configured CORS, and demonstrated configurations for Cursor and GitHub Copilot (VS Code), as well as a Docker deployment. 
The next steps are to extend the toolset, implement authentication, and add logging and caching.
If needed, stateful sessions and a production deployment. If this resonates with you, create your own tools and share them with the community!
Will create smart and useful things.