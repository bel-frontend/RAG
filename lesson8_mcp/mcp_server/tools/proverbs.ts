import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerProverbTools(mcp: McpServer) {
    mcp.registerTool(
        'get_proverb_by_topic',
        {
            title: 'get_proverb_by_topic',
            description:
                'Get proverbs (прыказкі і прымаўкі) in Belarusian. Optionally filter by topic and/or return a random one.',
            inputSchema: {
                topic: z.string().optional(),
                random: z.boolean().optional(),
                limit: z.number().int().positive().max(200).optional(),
            },
        },
        async ({
            topic,
            random,
            limit,
        }: {
            topic?: string;
            random?: boolean;
            limit?: number;
        }) => {
            const url =
                'https://gist.githubusercontent.com/bel-frontend/41775a79904f2535c4dd97d7990ad83d/raw/dc6c5cb1a849961833dd157454fd3ec11129883b/index.json';

            const fetchJson = async <T>(u: string): Promise<T> => {
                const res = await fetch(u);
                if (!res.ok) throw new Error(`Fetch error ${res.status}`);
                return (await res.json()) as T;
            };

            try {
                console.log('Fetching proverbs from:', url);
                const data =
                    (await fetchJson<{ message: string }[]>(url)) || [];

                let items = data.map((d) => d.message);

                if (topic && topic.trim()) {
                    const q = topic.trim().toLowerCase();
                    items = items.filter((m) => m.toLowerCase().includes(q));
                }

                if (items.length === 0) {
                    const none = topic
                        ? `No proverbs found for topic: "${topic}".`
                        : 'No proverbs found.';
                    return { content: [{ type: 'text', text: none }] };
                }

                if (random) {
                    const n = Math.min(
                        typeof limit === 'number'
                            ? Math.max(1, Math.min(limit, 200))
                            : 1,
                        items.length,
                    );

                    // Fisher–Yates shuffle for unbiased sampling
                    const copy = items.slice();
                    for (let i = copy.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [copy[i], copy[j]] = [copy[j], copy[i]];
                    }

                    const picked = copy.slice(0, n);
                    const text = n === 1 ? picked[0] : picked.join('\n');
                    return { content: [{ type: 'text', text }] };
                }

                const max =
                    typeof limit === 'number'
                        ? Math.min(limit, 200)
                        : undefined;
                const slice =
                    typeof max === 'number' ? items.slice(0, max) : items;
                const text = slice.join('\n');

                return { content: [{ type: 'text', text }] };
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Failed to fetch proverbs: ${msg}`,
                        },
                    ],
                };
            }
        },
    );
}
