import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerEchoTools(mcp: McpServer) {
    mcp.registerTool(
        'echo',
        {
            title: 'Echo',
            description: 'Return the same text',
            inputSchema: { text: z.string() },
        },
        async ({ text }) => {
            console.log('Echo tool called with:', text);
            return { content: [{ type: 'text', text }] };
        },
    );
}
