import { v4 as uuidv4 } from 'uuid';
const QDRANT_URL = 'http://localhost:6333';

type Vector = number[];
type Payload = Record<string, any>;
export class QdrantClient {
    constructor(private baseUrl = QDRANT_URL) {}

    async createCollection(name: string, dim: number, distance = 'Cosine') {
        const res = await fetch(`${this.baseUrl}/collections/${name}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                vectors: {
                    size: dim,
                    distance,
                },
            }),
        });

        if (!res.ok)
            throw new Error(`Failed to create collection: ${await res.text()}`);
        return res.json();
    }

    async insertPoint(
        collection: string,
        id: number,
        vector: Vector,
        payload?: Payload
    ) {
        const pointId = id ?? uuidv4();
        const res = await fetch(
            `${this.baseUrl}/collections/${collection}/points`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    points: [{ id: pointId, vector, payload }],
                }),
            }
        );

        if (!res.ok) {
            throw new Error(`Failed to insert point: ${await res.text()}`);
        } else {
            console.log(`Ires ,${JSON.stringify(res)}`);
        }
        return res.json();
    }

    async insertPoints(
        collection: string,
        points: { id: number | string; vector: Vector; payload?: Payload }[]
    ) {
        const res = await fetch(
            `${this.baseUrl}/collections/${collection}/points`,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points }),
            }
        );

        if (!res.ok)
            throw new Error(`Failed to insert points: ${await res.text()}`);
        return res.json();
    }

    async search(collection: string, vector: Vector, top = 5, filter?: any) {
        const res = await fetch(
            `${this.baseUrl}/collections/${collection}/points/search`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    vector,
                    top,
                    with_payload: true,
                    ...(filter ? { filter } : {}),
                }),
            }
        );

        if (!res.ok) throw new Error(`Search failed: ${await res.text()}`);
        return res.json();
    }

    async deletePoint(collection: string, ids: number[]) {
        const res = await fetch(
            `${this.baseUrl}/collections/${collection}/points/delete`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ points: ids }),
            }
        );

        if (!res.ok)
            throw new Error(`Failed to delete points: ${await res.text()}`);
        return res.json();
    }

    async getListOfCollections() {
        const res = await fetch(`${this.baseUrl}/collections`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok)
            throw new Error(`Failed to get collections: ${await res.text()}`);
        return res.json();
    }
}
