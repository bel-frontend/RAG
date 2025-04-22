import { QdrantClient } from './api';

const qdrant = new QdrantClient();
const COLLECTION = 'example_collection';
const DIM = 128;

async function runExamples() {
    // 1. Create a collection
    await qdrant.createCollection(COLLECTION, DIM);
    console.log('✅ Collection created.');

    // 2. Insert a point
    const vector = Array(DIM).fill(0.25);
    const payload = { category: 'fruit', name: 'banana' };
    await qdrant.insertPoint(COLLECTION, 1, vector, payload);
    console.log('✅ Point inserted.');

    // 3. Search (without filter)
    const result1 = await qdrant.search(COLLECTION, vector, 3);
    console.log('🔍 Search result (no filter):', result1);

    // 4. Search with filter
    const filter = {
        must: [{ key: 'category', match: { value: 'fruit' } }],
    };

    const result2 = await qdrant.search(COLLECTION, vector, 3, filter);
    console.log('🔍 Search result (with filter):', result2);

    // 5. Delete the point
    await qdrant.deletePoint(COLLECTION, [1]);
    console.log('🗑️ Point deleted.');
}

runExamples().catch(console.error);
