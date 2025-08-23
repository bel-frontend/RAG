import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerWeatherTools(mcp: McpServer) {
    mcp.registerTool(
        'get_weather',
        {
            title: 'get_weather',
            description: 'Get current weather for a given city',
            inputSchema: { city: z.string() },
        },
        async ({ city }: { city: string }) => {
            const fetchText = async (url: string) => {
                const res = await fetch(url);
                if (!res.ok) throw new Error(`Fetch error ${res.status}`);
                return res.text();
            };
            const weather = await fetchText(`https://wttr.in/${city}?format=3`);
            console.log('Weather fetched:', weather);
            return {
                content: [
                    {
                        type: 'text',
                        text: weather || 'Cannot find weather.',
                    },
                ],
            };
        },
    );
}
