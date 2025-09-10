# Building a Simple MCP Server
## Model Context Protocol Implementation Guide

---

## Table of Contents

1. [What is MCP?](#what-is-mcp)
2. [Project Overview](#project-overview)
3. [Architecture](#architecture)
4. [Implementation Details](#implementation-details)
5. [Tools Showcase](#tools-showcase)
6. [HTTP Server Setup](#http-server-setup)
7. [Running the Server](#running-the-server)
8. [Testing & Usage](#testing--usage)
9. [Deployment](#deployment)
10. [Key Takeaways](#key-takeaways)

---

## What is MCP?

**Model Context Protocol (MCP)** is an open standard that enables AI models to securely access external data and tools.

### Key Benefits:
- 🔧 **Tool Integration** - Connect AI models to external APIs and services
- 🔒 **Security** - Controlled access to resources
- 🌐 **Standardization** - Universal protocol for AI-tool communication
- 🚀 **Extensibility** - Easy to add new capabilities

### Use Cases:
- Database queries
- API integrations
- File system operations
- External service calls
- Custom business logic

---

## Project Overview

### What We Built
A stateless HTTP-based MCP server with three demonstration tools:

```
🏗️ MCP Server
├── 🔄 Echo Tool (text mirroring)
├── 🌤️ Weather Tool (wttr.in integration)
└── 📚 Proverbs Tool (Belarusian proverbs API)
```

### Tech Stack
- **Runtime**: Bun (Node.js compatible)
- **Framework**: @modelcontextprotocol/sdk
- **Validation**: Zod
- **Transport**: HTTP (stateless)
- **Deployment**: Docker + Docker Compose

---

## Architecture

### High-Level Architecture

```
┌─────────────────┐    HTTP     ┌─────────────────┐
│                 │ ◄────────── │                 │
│   AI Client     │             │   MCP Server    │
│   (Claude, etc) │ ──────────► │                 │
└─────────────────┘             └─────────────────┘
                                          │
                                          ▼
                                ┌─────────────────┐
                                │   External APIs │
                                │   • wttr.in     │
                                │   • GitHub Gist │
                                └─────────────────┘
```

### Component Structure

```typescript
// 1. MCP Server Instance
const mcp = new McpServer({ name: 'test-mcp', version: '0.1.0' });

// 2. Tool Registration (Modular)
registerEchoTools(mcp);
registerProverbTools(mcp);
registerWeatherTools(mcp);

// 3. HTTP Transport (Stateless)
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined // Fully stateless
});

// 4. HTTP Server
const httpServer = createServer(/* request handler */);
```

---

## Implementation Details

### 1. Server Initialization

```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

// Create MCP server instance
const mcp = new McpServer({ 
    name: 'test-mcp', 
    version: '0.1.0' 
});

// Setup stateless transport
const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined // No session storage
});

// Connect MCP to transport
await mcp.connect(transport);
```

### 2. Tool Registration Pattern

Each tool follows a consistent pattern:

```typescript
export function registerToolName(mcp: McpServer) {
    mcp.registerTool(
        'tool_name',
        {
            title: 'Tool Display Name',
            description: 'What this tool does',
            inputSchema: { /* Zod validation schema */ }
        },
        async (params) => {
            // Tool implementation
            return { content: [{ type: 'text', text: result }] };
        }
    );
}
```

### 3. HTTP Endpoint Structure

- **`/healthz`** - Health check endpoint
- **`/mcp`** - Main MCP protocol endpoint
  - `GET` - Session management
  - `POST` - Tool execution
  - `DELETE` - Cleanup
  - `OPTIONS` - CORS preflight

---

## Tools Showcase

### 🔄 Echo Tool
**Purpose**: Simple text mirroring for testing connectivity

```typescript
// Input
{ "text": "Hello, MCP!" }

// Output
"Hello, MCP!"
```

**Use Case**: Testing MCP connection and basic functionality

### 🌤️ Weather Tool
**Purpose**: Fetch current weather from wttr.in

```typescript
// Input
{ "city": "New York" }

// Output
"New York: ⛅️ +22°C"
```

**Features**:
- Real-time weather data
- Global city support
- Simple text format

### 📚 Proverbs Tool
**Purpose**: Retrieve Belarusian proverbs with filtering

```typescript
// Input
{ 
    "topic": "wisdom", 
    "random": true, 
    "limit": 3 
}

// Output
"Розум дарожэй за золата..."
```

**Features**:
- Topic filtering
- Random selection
- Configurable limits (1-200)
- Belarusian cultural content

---

## HTTP Server Setup

### Request Handling Flow

```typescript
const httpServer = createServer(async (req, res) => {
    try {
        const url = new URL(req.url ?? '/', `http://${req.headers.host}`);

        // 1. CORS Headers
        if (req.method === 'OPTIONS') {
            // Handle preflight requests
        }

        // 2. Health Check
        if (url.pathname === '/healthz') {
            // Return server status
        }

        // 3. MCP Protocol
        if (url.pathname === '/mcp') {
            await transport.handleRequest(req, res, parsedBody);
        }

        // 4. 404 for unknown routes
    } catch (error) {
        // Error handling
    }
});
```

### Key Features

- **CORS Support** - Cross-origin requests allowed
- **Error Handling** - Graceful error responses
- **Request Parsing** - JSON body parsing
- **Health Monitoring** - Built-in health check

---

## Running the Server

### Development Setup

```bash
# Install dependencies
bun install

# Development mode (hot reload)
bun run dev

# Production mode
bun run start

# Local development with custom API
bun run local
```

### Server Output

```
MCP Streamable HTTP Server on http://localhost:3002/mcp
Available endpoints:
  - GET  /healthz  - Health check
  - POST /mcp      - MCP endpoint
  - GET  /mcp      - MCP session management
  - DELETE /mcp    - Session cleanup
```

### Process Management

The server handles graceful shutdown:

```typescript
process.on('SIGINT', () => {
    console.log('Shutting down MCP server...');
    httpServer.close(() => {
        console.log('MCP server closed');
        process.exit(0);
    });
});
```

---

## Testing & Usage

### Health Check

```bash
curl http://localhost:3002/healthz
```

```json
{
    "ok": true,
    "timestamp": "2025-09-10T12:00:00.000Z"
}
```

### MCP Client Configuration

Create `mcp.json` configuration:

```json
{
    "servers": {
        "test-mcp": {
            "transport": "http",
            "url": "http://localhost:3002/mcp"
        }
    }
}
```

### Tool Usage Examples

#### Echo Tool
```json
{
    "method": "tools/call",
    "params": {
        "name": "echo",
        "arguments": { "text": "Hello World!" }
    }
}
```

#### Weather Tool
```json
{
    "method": "tools/call",
    "params": {
        "name": "get_weather",
        "arguments": { "city": "London" }
    }
}
```

#### Proverbs Tool
```json
{
    "method": "tools/call",
    "params": {
        "name": "get_proverb_by_topic",
        "arguments": {
            "topic": "wisdom",
            "random": true,
            "limit": 1
        }
    }
}
```

---

## Deployment

### Docker Setup

**Dockerfile**:
```dockerfile
FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY . .
EXPOSE 3002
CMD ["bun", "index.ts"]
```

**docker-compose.yml**:
```yaml
services:
  mcp-server:
    build: .
    ports:
      - "3002:3002"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### Deployment Commands

```bash
# Build and run with Docker Compose
docker-compose up -d

# Or use the deployment script
./deploy.sh
```

### Production Considerations

- **Load Balancing** - Multiple instances behind a load balancer
- **Monitoring** - Health check integration
- **Logging** - Structured logging for debugging
- **Security** - Authentication and rate limiting
- **Scaling** - Horizontal scaling capabilities

---

## Key Takeaways

### ✅ What We Accomplished

1. **Built a Complete MCP Server** - Full HTTP-based implementation
2. **Modular Tool Architecture** - Easy to add new tools
3. **Stateless Design** - Scalable and cloud-friendly
4. **Production Ready** - Docker deployment, error handling
5. **Real-world Integration** - External API connections

### 🚀 Benefits of This Approach

- **Simplicity** - Clear separation of concerns
- **Flexibility** - Easy to extend with new tools
- **Reliability** - Robust error handling and graceful shutdown
- **Performance** - Stateless design for scalability
- **Maintainability** - Modular tool registration

### 🎯 Use Cases for Extension

- **Database Integration** - SQL query tools
- **File Operations** - File system management
- **API Orchestration** - Complex multi-step operations
- **Business Logic** - Custom domain-specific tools
- **Analytics** - Data processing and reporting

### 📚 Learning Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [Example Implementations](https://github.com/modelcontextprotocol/servers)

---

## Questions & Discussion

### Common Questions

**Q: Why stateless design?**
A: Better scalability, simpler deployment, no session management complexity.

**Q: How to add authentication?**
A: Implement middleware in the HTTP server layer before MCP handling.

**Q: Can I use WebSocket transport?**
A: Yes, MCP SDK supports multiple transports including WebSocket.

**Q: How to handle long-running operations?**
A: Consider async patterns or background job queues for heavy operations.

### Next Steps

1. **Add Your Own Tools** - Follow the modular pattern
2. **Implement Authentication** - Add security layer
3. **Add Monitoring** - Metrics and logging
4. **Scale Horizontally** - Deploy multiple instances
5. **Create More Complex Workflows** - Chain multiple tools

---

## Thank You!

### Resources
- **GitHub Repository**: Your MCP server implementation
- **Documentation**: Model Context Protocol specification
- **Community**: MCP developer community

### Contact & Support
- Questions about implementation
- Suggestions for improvements  
- Collaboration opportunities

**Happy Building! 🚀**
